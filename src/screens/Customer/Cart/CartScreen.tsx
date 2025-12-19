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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setSelectedShops } from '../../../features/cart/cartSlice';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

// --- COMPONENTS ---

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
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
  originalPrice?: number;
  image: any;
  quantity: number;
  checked: boolean;
  restaurantId?: string | null;
}

interface ShopGroup {
  shopId: string | null;
  shopName: string;
  items: Product[];
  checked: boolean;
}

interface CartItemGQL {
  foodId: string;
  restaurantId?: string; // Quan trọng: Thêm trường này để group
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

interface MyCartData {
  myCart: {
    _id: string;
    userId: string;
    restaurantId?: string | null; // Restaurant Root (nếu có)
    items: CartItemGQL[];
    totalAmount?: number;
  } | null;
}

interface UpdateCartData {
  updateCart: {
    _id: string;
    restaurantId?: string | null;
    items: CartItemGQL[];
    totalAmount?: number;
  };
}

interface UpdateCartVars {
  restaurantId: string;
  items: Array<{
    foodId: string;
    restaurantId: string | null;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

// --- MAIN SCREEN ---

export default function CartScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // State quản lý danh sách hiển thị
  const [cartData, setCartData] = useState<ShopGroup[]>([]);
  
  // State phục vụ logic merge/save
  const [localCart, setLocalCart] = useState<ShopGroup[] | null>(null);
  const LOCAL_CART_KEY = '@LTMB:cart';
  const [originalServerSnapshot, setOriginalServerSnapshot] = useState<any | null>(null);

  const processedIncomingRef = useRef(false);
  const localMergeRef = useRef(false);

  // --- GRAPHQL ---

  const UPDATE_CART_MUTATION = gql`
    mutation UpdateCart($restaurantId: ID!, $items: [CartItemInput]!) {
      updateCart(restaurantId: $restaurantId, items: $items) {
        _id
        restaurantId
        items {
          foodId
          restaurantId 
          name
          price
          quantity
          image
        }
        totalAmount
      }
    }
  `;

  const [updateCart] = useMutation<UpdateCartData, UpdateCartVars>(UPDATE_CART_MUTATION);

  const GET_MY_CART = gql`
    query MyCart {
      myCart {
        _id
        restaurantId
        items {
          foodId
          restaurantId 
          name
          price
          quantity
          image
        }
        totalAmount
      }
    }
  `;

  const {
    data: myCartData,
    loading: myCartLoading,
    error: myCartError,
    refetch: refetchMyCart,
  } = useQuery<MyCartData>(GET_MY_CART, { fetchPolicy: 'network-only' });

  // --- PARAMS ---
  const route = useRoute();
  const incomingNewItems = (route.params as any)?.newItems || [];
  const incomingRestaurantId = (route.params as any)?.restaurantId || null;

  // --- EFFECT 1: XỬ LÝ DỮ LIỆU TỪ SERVER VỀ & GROUP THEO RESTAURANT ---
  useEffect(() => {
    if (myCartLoading) return;
    if (processedIncomingRef.current) return; 

    const serverCart = myCartData?.myCart;
    if (!serverCart) {
      setCartData([]);
      setOriginalServerSnapshot(null);
      return;
    }

    const items = serverCart.items || [];
    
    // --- LOGIC GROUPING MỚI: Gom nhóm theo restaurantId ---
    const groups: { [key: string]: Product[] } = {};
    
    items.forEach((it: CartItemGQL) => {
      // Ưu tiên lấy ID từ item, nếu không có thì lấy từ root (fallback)
      const rId = it.restaurantId || serverCart.restaurantId || 'unknown';
      
      if (!groups[rId]) {
        groups[rId] = [];
      }

      groups[rId].push({
        id: it.foodId,
        name: it.name,
        variation: '',
        price: it.price,
        restaurantId: rId === 'unknown' ? null : rId,
        image: it.image ? { uri: it.image } : IMAGES.pizza1,
        quantity: it.quantity || 1,
        checked: false, // Mặc định không chọn
      });
    });

    // Chuyển object groups thành mảng ShopGroup
    const shopGroupArray: ShopGroup[] = Object.keys(groups).map((rId) => {
      // Tạm thời hiển thị tên là "Nhà hàng" vì item không có field name của quán
      // Nếu muốn hiển thị tên, cần update query hoặc fetch thêm info
      return {
        shopId: rId === 'unknown' ? null : rId,
        shopName: 'Nhà hàng', 
        checked: false,
        items: groups[rId],
      };
    });

    setCartData(shopGroupArray);
    
    // Snapshot để so sánh khi save
    setOriginalServerSnapshot({ 
      restaurantId: serverCart.restaurantId, 
      items 
    });

  }, [myCartData, myCartLoading]);

  // --- EFFECT 2: XỬ LÝ INCOMING ITEMS (TỪ FOOD DETAIL) ---
  useEffect(() => {
    const inc = Array.isArray(incomingNewItems)
      ? incomingNewItems
      : incomingNewItems
      ? [incomingNewItems]
      : [];
      
    if (inc.length === 0) return;
    if (myCartLoading) return;
    if (processedIncomingRef.current) return;

    // Logic: Thêm item mới vào list hiện tại
    // Cần clone lại cartData để sửa đổi
    const newCartData = [...cartData];

    inc.forEach((incItem: any) => {
      const targetRestId = incItem.restaurantId || incomingRestaurantId || 'unknown';
      
      // Tìm xem đã có nhóm quán này chưa
      let groupIndex = newCartData.findIndex(g => String(g.shopId) === String(targetRestId));

      if (groupIndex === -1) {
        // Chưa có -> Tạo nhóm mới
        newCartData.unshift({ // Đưa lên đầu
          shopId: targetRestId === 'unknown' ? null : targetRestId,
          shopName: 'Nhà hàng mới',
          checked: false,
          items: [],
        });
        groupIndex = 0;
      }

      // Thêm món vào nhóm
      const group = newCartData[groupIndex];
      const existingItemIndex = group.items.findIndex(i => i.id === incItem.foodId);

      if (existingItemIndex > -1) {
        // Cộng dồn
        group.items[existingItemIndex].quantity += (incItem.quantity || 1);
      } else {
        // Thêm mới
        group.items.push({
          id: incItem.foodId,
          name: incItem.name,
          variation: '',
          price: incItem.price,
          restaurantId: targetRestId,
          image: incItem.image ? { uri: incItem.image } : IMAGES.pizza1,
          quantity: incItem.quantity || 1,
          checked: true, // Auto check món mới thêm
        });
      }
      
      // Logic đặc biệt: Khi thêm món mới, tự động bỏ chọn các quán khác (để đúng luật 1 quán)
      newCartData.forEach((g, idx) => {
        if (idx !== groupIndex) {
          g.checked = false;
          g.items.forEach(i => i.checked = false);
        }
      });
    });

    setCartData(newCartData);
    processedIncomingRef.current = true;
  }, [incomingNewItems, incomingRestaurantId, myCartLoading, cartData]);


  // --- LOGIC CHỌN NHÀ HÀNG (EXCLUSIVE) ---
  const toggleShop = (shopId: string | null) => {
    const newData = cartData.map(shop => {
      // Nếu là shop đang click
      if (String(shop.shopId) === String(shopId)) {
        const newChecked = !shop.checked;
        return {
          ...shop,
          checked: newChecked,
          items: shop.items.map(item => ({ ...item, checked: newChecked })),
        };
      }
      // QUAN TRỌNG: Các shop khác PHẢI bị bỏ chọn (unchecked)
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
      };
    });
    setCartData(newData);
  };

  // --- LOGIC CHỌN MÓN (EXCLUSIVE) ---
  const toggleItem = (shopId: string | null, itemId: string) => {
    // Trước tiên, tìm xem item được click có đang được check hay uncheck
    // Để quyết định xem có cần clear các shop khác không.
    // Nếu user CHECK vào item -> Clear shop khác.
    // Nếu user UNCHECK -> Không cần clear (vì đang cùng shop).
    
    const newData = cartData.map(shop => {
      // Nếu là shop chứa món này
      if (String(shop.shopId) === String(shopId)) {
        const newItems = shop.items.map(item => {
          if (item.id === itemId) {
            return { ...item, checked: !item.checked };
          }
          return item;
        });

        // Kiểm tra xem trong shop này còn item nào được chọn không
        const anyChecked = newItems.some(item => item.checked);
        // Nếu tất cả item được chọn -> shop checked = true (hoặc tuỳ logic)
        // Ở đây mình để logic: Có item check -> Shop có thể coi là active
        const allChecked = newItems.length > 0 && newItems.every(i => i.checked);
        
        return { 
          ...shop, 
          items: newItems, 
          checked: allChecked // Update trạng thái header shop
        };
      }
      
      // QUAN TRỌNG: Nếu user đang thao tác chọn ở Shop A, thì Shop B phải bị reset
      // Tuy nhiên, ta chỉ reset Shop B nếu Shop A đang CÓ item được chọn.
      // Nhưng để đơn giản và an toàn cho UX "1 quán": Cứ click vào Shop A là reset Shop B.
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
      };
    });

    setCartData(newData);
  };

  const deselectAll = () => {
    const newData = cartData.map(shop => ({
      ...shop,
      checked: false,
      items: shop.items.map(item => ({ ...item, checked: false })),
    }));
    setCartData(newData);
  };

  // Select All giờ đây chỉ nên Select All của "Nhà hàng đầu tiên" hoặc "Nhà hàng đang active"
  // Vì không được phép chọn 2 nhà hàng cùng lúc.
  const selectAll = () => {
    // Logic: Chỉ chọn nhà hàng đầu tiên trong danh sách (hoặc logic khác tuỳ bạn)
    if (cartData.length > 0) {
        toggleShop(cartData[0].shopId);
    }
  };

  const toggleSelectAll = () => {
    if (getSelectedCount() > 0) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  // --- LOGIC LƯU CART (Giữ nguyên hoặc tinh chỉnh nhẹ) ---
  const saveCartToServer = useCallback(async () => {
    // Chỉ lưu items của quán ĐANG ĐƯỢC CHỌN (nếu có) hoặc quán đầu tiên có items
    // Vì backend hiện tại thiết kế Cart là Single Restaurant, ta nên ưu tiên quán nào có nhiều item nhất hoặc quán đang active.
    
    // Tìm quán nào có item (ưu tiên quán đang có items checked, hoặc quán đầu tiên)
    let activeShop = cartData.find(s => s.items.some(i => i.checked));
    if (!activeShop) {
        // Nếu không ai được chọn, lấy quán đầu tiên có items
        activeShop = cartData.find(s => s.items.length > 0);
    }

    if (!activeShop) return;

    const restaurantId = activeShop.shopId;
    if (!restaurantId) return;

    const itemsToSave = activeShop.items.map(i => ({
      foodId: i.id,
      restaurantId: restaurantId, // Gán ID quán cho item
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: typeof i.image === 'object' && i.image?.uri ? i.image.uri : (i.image || ''),
    }));

    // ... (Phần logic check changed giữ nguyên)
    
    try {
      await updateCart({ variables: { restaurantId, items: itemsToSave } });
      await refetchMyCart();
    } catch (err) {
      console.warn('Save cart failed:', err);
    }
  }, [cartData, updateCart, refetchMyCart]);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('blur', async () => {
      try {
        await saveCartToServer();
      } catch (e) {}
    });
    return unsubscribe;
  }, [navigation, saveCartToServer]);

  // --- HELPERS ---
  const getTotalPrice = () => {
    let total = 0;
    cartData.forEach(shop => {
      shop.items.forEach(item => {
        if (item.checked) {
          total += item.price * item.quantity;
        }
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    let count = 0;
    cartData.forEach(shop =>
      shop.items.forEach(item => {
        if (item.checked) count++;
      }),
    );
    return count;
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };

  const changeQuantity = (shopId: string | null, itemId: string, delta: number) => {
    const newData = cartData.map(shop => {
      if (String(shop.shopId) === String(shopId)) {
        const newItems = shop.items.map(item => {
            if (item.id === itemId) {
              return { ...item, quantity: item.quantity + delta };
            }
            return item;
          })
          .filter(it => it.quantity > 0);
        return { ...shop, items: newItems };
      }
      return shop;
    }).filter(s => s.items.length > 0);

    setCartData(newData);
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
          {/* Có thể thêm ID quán để debug nếu cần: {shop.shopId} */}
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
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>
                  {formatCurrency(product.price)}
                </Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      if (product.quantity === 1) {
                        Alert.alert('Xóa sản phẩm', 'Bạn muốn xóa món này?', [
                          { text: 'Hủy', style: 'cancel' },
                          { text: 'Xóa', style: 'destructive', onPress: () => changeQuantity(shop.shopId, product.id, -1) },
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowleft" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Giỏ hàng ({cartData.reduce((acc, s) => acc + s.items.length, 0)})
        </Text>
      </View>

      {myCartLoading ? (
         <ActivityIndicator style={{marginTop: 20}} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={cartData}
          renderItem={renderShopGroup}
          keyExtractor={(item) => String(item.shopId)}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.row}>
          <TouchableOpacity onPress={toggleSelectAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {getSelectedCount() > 0 ? (
              <Icon name="closecircleo" size={20} color={colors.primary} />
            ) : (
              <Icon name="checksquareo" size={20} color="#999" />
            )}
            <Text style={styles.selectAllText}>{getSelectedCount() > 0 ? 'Bỏ chọn' : 'Tất cả'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalContainer}>
          <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.finalPrice}>{formatCurrency(getTotalPrice())}</Text>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, getSelectedCount() === 0 && styles.buyButtonDisabled]}
            disabled={getSelectedCount() === 0}
            onPress={() => {
              // Chuẩn bị dữ liệu sang màn Payment
              const selectedShops = cartData
                .map(s => ({
                   // Truyền thông tin quán (shopId) để Payment xử lý
                   shopId: s.shopId,
                   shopName: s.shopName,
                   items: s.items.filter(i => i.checked)
                }))
                .filter(s => s.items.length > 0);

              dispatch(setSelectedShops(selectedShops));
              
              (navigation as any).navigate('Payment' as never, {
                selectedShops,
                totalAmount: getTotalPrice(),
              });
            }}
          >
            <Text style={styles.buyButtonText}>Mua ({getSelectedCount()})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', marginLeft: 16 },
  shopBlock: { backgroundColor: '#FFF', marginTop: 10, paddingBottom: 10 },
  shopHeader: { flexDirection: 'row', padding: 12, borderBottomWidth: 0.5, borderColor: '#F0F0F0', alignItems: 'center' },
  shopName: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  checkBox: { width: 20, height: 20, borderWidth: 1, borderColor: '#999', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  productItem: { padding: 12 },
  productRow: { flexDirection: 'row', alignItems: 'flex-start' },
  productImage: { width: 80, height: 80, borderRadius: 4, backgroundColor: '#EEE', marginHorizontal: 10 },
  productInfo: { flex: 1, height: 80, justifyContent: 'space-between' },
  productName: { fontSize: 14, fontWeight: '500' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { color: colors.primary, fontWeight: 'bold' },
  quantityStepper: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 4 },
  stepBtn: { width: 25, alignItems: 'center', justifyContent: 'center' },
  quantityText: { width: 30, textAlign: 'center', lineHeight: 25 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', padding: 12, elevation: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { marginLeft: 8 },
  totalContainer: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#666' },
  finalPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  buyButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  buyButtonDisabled: { backgroundColor: '#CCC' },
  buyButtonText: { color: '#FFF', fontWeight: 'bold' },
});