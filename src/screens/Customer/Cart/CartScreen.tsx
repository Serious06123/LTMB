import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Giữ lại nếu bạn muốn backup, nhưng logic load sẽ bỏ
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

// --- COMPONENTS CON ---
function CheckBox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.checkBox, checked && styles.checkBoxActive]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {checked && <Icon name="check" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

// --- INTERFACES ---
interface Product {
  id: string;
  name: string;
  variation: string;
  price: number;
  image: any;
  quantity: number;
  checked: boolean;
}

interface ShopGroup {
  shopId: string;
  shopName: string;
  items: Product[];
  checked: boolean;
}

// GraphQL Response Types
interface CartItemGQL {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface MyCartData {
  myCart: {
    _id: string;
    restaurantId?: string | null;
    items: CartItemGQL[];
    totalAmount?: number;
    restaurant?: { // Giả sử backend có trả về restaurant info popualted, nếu chưa có thì query riêng
      name: string;
    }
  } | null;
}

interface GetRestaurantData {
  restaurant: {
    _id: string;
    name: string;
  } | null;
}

// --- GRAPHQL ---
const GET_MY_CART = gql`
  query MyCart {
    myCart {
      _id
      restaurantId
      items {
        foodId
        name
        price
        quantity
        image
      }
      totalAmount
    }
  }
`;

const UPDATE_CART_MUTATION = gql`
  mutation UpdateCart($restaurantId: ID!, $items: [CartItemInput]!) {
    updateCart(restaurantId: $restaurantId, items: $items) {
      _id
      restaurantId
      items {
        foodId
        name
        price
        quantity
        image
      }
      totalAmount
    }
  }
`;

const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      _id
      name
    }
  }
`;

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const isFocused = useIsFocused();

  // State hiển thị UI
  const [cartData, setCartData] = useState<ShopGroup[]>([]);

  // Biến để tracking việc save
  const isSavingRef = useRef(false);

  // 1. QUERY LẤY GIỎ HÀNG TỪ DB
  const {
    data: myCartData,
    loading: myCartLoading,
    error: myCartError,
    refetch: refetchMyCart,
  } = useQuery<MyCartData>(GET_MY_CART, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  });

  const [updateCart] = useMutation(UPDATE_CART_MUTATION);

  // 2. QUERY LẤY TÊN NHÀ HÀNG (Nếu cần)
  // Lấy ID nhà hàng hiện tại từ cartData để fetch tên
  const currentRestaurantId = cartData.length > 0 ? cartData[0].shopId : null;

  const { data: restaurantData } = useQuery<GetRestaurantData>(GET_RESTAURANT, {
    variables: { id: currentRestaurantId },
    skip: !currentRestaurantId || currentRestaurantId === 'local',
  });

  // --- EFFECT 1: ĐỒNG BỘ DỮ LIỆU TỪ DB VÀO STATE UI ---
  useEffect(() => {
    if (myCartLoading) return;

    console.log("🔄 [Cart] Syncing DB to UI...");
    const serverCart = myCartData?.myCart;

    if (!serverCart || !serverCart.items || serverCart.items.length === 0) {
      // Nếu server không có gì, và cũng không có params truyền vào -> Trống
      // Lưu ý: Nếu đang có params (items mới thêm), ta sẽ xử lý ở Effect 2, không set rỗng ở đây vội.
      const incoming = (route.params as any)?.newItems;
      if (!incoming) {
        setCartData([]);
      }
      return;
    }

    // Map dữ liệu từ Server sang format UI
    const items: Product[] = serverCart.items.map((it) => ({
      id: it.foodId,
      name: it.name,
      variation: '',
      price: it.price,
      image: it.image ? { uri: it.image } : IMAGES.pizza1,
      quantity: it.quantity,
      checked: false, // Mặc định không chọn khi load lại
    }));

    const shopGroup: ShopGroup = {
      shopId: serverCart.restaurantId || 'unknown',
      shopName: 'Đang tải...', // Sẽ update khi có restaurantData
      items: items,
      checked: false,
    };

    setCartData([shopGroup]);

  }, [myCartData, myCartLoading]);

  // --- EFFECT 2: CẬP NHẬT TÊN NHÀ HÀNG ---
  useEffect(() => {
    if (restaurantData?.restaurant && cartData.length > 0) {
      setCartData(prev => prev.map(shop =>
        shop.shopId === restaurantData.restaurant!._id
          ? { ...shop, shopName: restaurantData.restaurant!.name }
          : shop
      ));
    }
  }, [restaurantData]);

  // --- EFFECT 3: XỬ LÝ ITEMS MỚI TỪ NAVIGATION (ADD TO CART) ---
  // Khi user bấm "Thêm vào giỏ" từ màn hình khác, params sẽ chứa item mới.
  // Ta cần merge vào UI và GỌI SAVE NGAY LẬP TỨC để đồng bộ lên DB.
  useEffect(() => {
    const params = route.params as any;
    if (params?.newItems && params.newItems.length > 0) {
      console.log("➕ [Cart] New items detected from navigation:", params.newItems);

      const newItemsIncoming = params.newItems;
      const incomingRestId = params.restaurantId;

      setCartData(currentCart => {
        // Logic merge
        // 1. Kiểm tra xem giỏ hiện tại có cùng nhà hàng không?
        // Nếu khác nhà hàng -> Thay thế hoàn toàn (theo logic app food thường gặp) hoặc cảnh báo.
        // Ở đây ta giả định thay thế hoặc merge nếu cùng ID.

        let targetShop = currentCart.find(s => s.shopId === incomingRestId);

        // Nếu chưa có shop này (hoặc giỏ đang trống/khác shop)
        if (!targetShop) {
          // Nếu muốn chỉ giữ 1 giỏ hàng duy nhất: Clear cũ, tạo mới
          const newShop: ShopGroup = {
            shopId: incomingRestId,
            shopName: 'Đang cập nhật...',
            items: newItemsIncoming.map((it: any) => ({
              id: it.foodId,
              name: it.name,
              variation: '',
              price: it.price,
              image: it.image ? { uri: it.image } : IMAGES.pizza1,
              quantity: it.quantity,
              checked: true, // Item mới thêm thì auto check cho tiện
            })),
            checked: true
          };
          return [newShop];
        }

        // Nếu cùng shop -> Merge items
        const updatedItems = [...targetShop.items];
        newItemsIncoming.forEach((newItem: any) => {
          const existIdx = updatedItems.findIndex(i => i.id === newItem.foodId);
          if (existIdx >= 0) {
            updatedItems[existIdx].quantity += newItem.quantity;
            updatedItems[existIdx].checked = true;
          } else {
            updatedItems.push({
              id: newItem.foodId,
              name: newItem.name,
              variation: '',
              price: newItem.price,
              image: newItem.image ? { uri: newItem.image } : IMAGES.pizza1,
              quantity: newItem.quantity,
              checked: true,
            });
          }
        });

        return [{ ...targetShop, items: updatedItems, checked: true }];
      });

      // Xóa params để không merge lại lần sau
      navigation.setParams({ newItems: null, restaurantId: null } as any);

      // Trigger save ngay lập tức để DB cập nhật item mới thêm
      setTimeout(() => saveCartToServer(true), 500);
    }
  }, [route.params]);


  // --- LOGIC SAVE ---
  const saveCartToServer = async (silent = false) => {
    if (isSavingRef.current) return;

    // Tìm shop đang có items
    const activeShop = cartData.find(s => s.items.length > 0);
    if (!activeShop) return; // Giỏ rỗng thì thôi hoặc gọi mutation clearCart (tùy backend)

    try {
      isSavingRef.current = true;
      console.log("💾 [Cart] Saving to server...", activeShop.shopId);

      const itemsPayload = activeShop.items.map(i => ({
        foodId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image?.uri || (typeof i.image === 'string' ? i.image : '')
      }));

      await updateCart({
        variables: {
          restaurantId: activeShop.shopId,
          items: itemsPayload
        }
      });

      if (!silent) console.log("✅ [Cart] Saved successfully");

      // Refetch để đảm bảo data đồng bộ chuẩn chỉnh (đặc biệt là totalAmount từ BE tính)
      // await refetchMyCart(); 

    } catch (err) {
      console.error("❌ [Cart] Save failed:", err);
      if (!silent) Alert.alert("Lỗi", "Không thể cập nhật giỏ hàng lên máy chủ");
    } finally {
      isSavingRef.current = false;
    }
  };

  // Auto Save khi rời màn hình (Blur)
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      saveCartToServer(true);
    });
    return unsubscribe;
  }, [navigation, cartData]); // Dependency cartData để function lấy state mới nhất


  // --- UI HANDLERS ---
  const toggleShop = (shopId: string) => {
    setCartData(prev => prev.map(shop => {
      if (shop.shopId === shopId) {
        const newVal = !shop.checked;
        return {
          ...shop,
          checked: newVal,
          items: shop.items.map(i => ({ ...i, checked: newVal }))
        };
      }
      return shop;
    }));
  };

  const toggleItem = (shopId: string, itemId: string) => {
    setCartData(prev => prev.map(shop => {
      if (shop.shopId === shopId) {
        const newItems = shop.items.map(i =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        );
        const allChecked = newItems.every(i => i.checked);
        return { ...shop, items: newItems, checked: allChecked };
      }
      return shop;
    }));
  };

  const changeQuantity = (shopId: string, itemId: string, delta: number) => {
    setCartData(prev => {
      return prev.map(shop => {
        if (shop.shopId === shopId) {
          const newItems = shop.items.map(item => {
            if (item.id === itemId) {
              return { ...item, quantity: item.quantity + delta };
            }
            return item;
          }).filter(i => i.quantity > 0); // Xóa nếu <= 0

          return { ...shop, items: newItems };
        }
        return shop;
      }).filter(s => s.items.length > 0); // Xóa shop nếu hết items
    });
  };

  const toggleSelectAll = () => {
    const isAllSelected = getSelectedCount() > 0; // Logic đơn giản: nếu có chọn -> bỏ chọn hết
    setCartData(prev => prev.map(shop => ({
      ...shop,
      checked: !isAllSelected,
      items: shop.items.map(i => ({ ...i, checked: !isAllSelected }))
    })));
  };

  // --- HELPERS ---
  const getTotalPrice = () => {
    let total = 0;
    cartData.forEach(shop => {
      shop.items.forEach(item => {
        if (item.checked) total += item.price * item.quantity;
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    let count = 0;
    cartData.forEach(shop => {
      shop.items.forEach(i => { if (i.checked) count++ });
    });
    return count;
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  // --- RENDER ---
  const renderShopGroup = ({ item: shop }: { item: ShopGroup }) => (
    <View style={styles.shopBlock}>
      <View style={styles.shopHeader}>
        <View style={styles.row}>
          <CheckBox
            checked={shop.checked}
            onPress={() => toggleShop(shop.shopId)}
          />
          <Icon name="car" size={18} color="#333" style={{ marginLeft: 8, marginRight: 4 }} />
          <Text style={styles.shopName}>{shop.shopName}</Text>
          <Icon name="right" size={14} color="#999" />
        </View>
      </View>

      {shop.items.map(product => (
        <View key={product.id} style={styles.productItem}>
          <View style={styles.productRow}>
            <CheckBox
              checked={product.checked}
              onPress={() => toggleItem(shop.shopId, product.id)}
            />
            <Image source={product.image} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.variationTag}>
                <Text style={styles.variationText}>Cơ bản</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatCurrency(product.price)}</Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      if (product.quantity === 1) {
                        Alert.alert('Xóa?', 'Bạn muốn xóa món này?', [
                          { text: 'Hủy', style: 'cancel' },
                          { text: 'Xóa', style: 'destructive', onPress: () => changeQuantity(shop.shopId, product.id, -1) }
                        ]);
                      } else {
                        changeQuantity(shop.shopId, product.id, -1);
                      }
                    }}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{product.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => changeQuantity(shop.shopId, product.id, 1)}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          saveCartToServer(true); // Save trước khi back cho chắc
          navigation.goBack();
        }}>
          <Icon name="arrowleft" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

      {/* BODY */}
      {myCartLoading && cartData.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cartData}
          renderItem={renderShopGroup}
          keyExtractor={item => item.shopId}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: '#999', marginTop: 50 }}>Giỏ hàng trống</Text>
            </View>
          }
        />
      )}

      {/* FOOTER */}
      {cartData.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.row}>
            {getSelectedCount() > 0 ? (
              <Icon name="closecircleo" size={20} color={colors.primary} />
            ) : (
              <Icon name="checksquareo" size={20} color="#999" />
            )}
            <Text style={styles.selectAllText}>
              {getSelectedCount() > 0 ? 'Bỏ chọn' : 'Tất cả'}
            </Text>
          </TouchableOpacity>

          <View style={styles.totalContainer}>
            <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.finalPrice}>{formatCurrency(getTotalPrice())}</Text>
            </View>

            <TouchableOpacity
              style={[styles.buyButton, getSelectedCount() === 0 && styles.buyButtonDisabled]}
              disabled={getSelectedCount() === 0}
              onPress={async () => {
                await saveCartToServer(); // Save DB lần cuối
                // Prepare data for payment
                const selectedShops = cartData.map(s => ({
                  ...s,
                  items: s.items.filter(i => i.checked)
                })).filter(s => s.items.length > 0);

                navigation.navigate('Payment' as never, {
                  totalAmount: getTotalPrice(),
                  selectedShops: selectedShops,
                  itemCount: getSelectedCount()
                } as never);
              }}
            >
              <Text style={styles.buyButtonText}>Mua hàng ({getSelectedCount()})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 16, color: '#000' },

  shopBlock: { backgroundColor: '#FFF', marginTop: 10, paddingBottom: 10 },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderColor: '#F0F0F0' },
  row: { flexDirection: 'row', alignItems: 'center' },
  shopName: { fontWeight: 'bold', fontSize: 14, color: '#000', marginRight: 4 },

  productItem: { paddingHorizontal: 12, paddingTop: 12 },
  productRow: { flexDirection: 'row', alignItems: 'flex-start' },
  productImage: { width: 80, height: 80, marginHorizontal: 10, borderRadius: 4, backgroundColor: '#EEE' },
  productInfo: { flex: 1, height: 80, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: '#000', lineHeight: 18 },
  variationTag: { alignSelf: 'flex-start', backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  variationText: { fontSize: 10, color: '#666' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },

  quantityStepper: { flexDirection: 'row', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 4 },
  stepBtn: { width: 28, alignItems: 'center', justifyContent: 'center' },
  quantityText: { width: 30, textAlign: 'center', paddingVertical: 4, color: '#333', fontSize: 13, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E8E8E8' },

  checkBox: { width: 20, height: 20, borderWidth: 1, borderColor: '#999', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  checkBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderColor: '#EEE', elevation: 10 },
  selectAllText: { marginLeft: 8, color: '#666' },
  totalContainer: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#000', textAlign: 'right' },
  finalPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },

  buyButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  buyButtonDisabled: { backgroundColor: '#CCC' },
  buyButtonText: { color: '#FFF', fontWeight: 'bold' },
});