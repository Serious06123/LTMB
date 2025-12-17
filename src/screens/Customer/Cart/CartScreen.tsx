import React, { useState, useEffect, useRef } from 'react';
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
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
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
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {checked && <Icon name="check" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

// --- INTERFACES (Định nghĩa kiểu dữ liệu) ---
interface Product {
  id: string;
  name: string;
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

// Interface cho dữ liệu trả về từ GraphQL
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
      items {
        foodId
        quantity
      }
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
  const isFocused = useIsFocused();

  // State hiển thị UI
  const [cartData, setCartData] = useState<ShopGroup[]>([]);
  const isSavingRef = useRef(false);

  // 1. QUERY GIỎ HÀNG (Đã thêm Type <MyCartData>)
  const {
    data: myCartData,
    loading: myCartLoading,
    refetch: refetchMyCart,
  } = useQuery<MyCartData>(GET_MY_CART, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  });

  const [updateCart] = useMutation(UPDATE_CART_MUTATION);

  // Lấy ID nhà hàng để fetch tên
  const currentRestaurantId = cartData.length > 0 ? cartData[0].shopId : null;

  // 2. QUERY TÊN NHÀ HÀNG (Đã thêm Type <GetRestaurantData>)
  const { data: restaurantData } = useQuery<GetRestaurantData>(GET_RESTAURANT, {
    variables: { id: currentRestaurantId },
    skip: !currentRestaurantId,
  });

  // --- EFFECT 1: TỰ ĐỘNG CẬP NHẬT KHI VÀO MÀN HÌNH ---
  useEffect(() => {
    if (isFocused) {
      refetchMyCart();
    }
  }, [isFocused]);

  // --- EFFECT 2: ĐỒNG BỘ DỮ LIỆU TỪ SERVER VÀO UI ---
  useEffect(() => {
    // Check an toàn: data có tồn tại không?
    if (!myCartData || !myCartData.myCart) {
       if (!myCartLoading) setCartData([]);
       return;
    }

    const serverCart = myCartData.myCart;
    
    // Nếu giỏ hàng không có items
    if (!serverCart.items || serverCart.items.length === 0) {
      setCartData([]);
      return;
    }

    // Map dữ liệu Server -> UI
    setCartData(prevCart => {
      // Giữ lại trạng thái checked cũ
      const prevItemsMap = new Map();
      if(prevCart.length > 0) {
         prevCart[0].items.forEach(i => prevItemsMap.set(i.id, i.checked));
      }

      const items: Product[] = serverCart.items.map((it) => ({
        id: it.foodId,
        name: it.name,
        price: it.price,
        image: it.image ? { uri: it.image } : IMAGES.pizza1,
        quantity: it.quantity,
        // Nếu item cũ đã check thì giữ nguyên, nếu mới thì mặc định true
        checked: prevItemsMap.has(it.foodId) ? prevItemsMap.get(it.foodId) : true, 
      }));

      const shopGroup: ShopGroup = {
        shopId: serverCart.restaurantId || 'unknown',
        shopName: restaurantData?.restaurant?.name || 'Đang tải...', 
        items: items,
        checked: items.every(i => i.checked),
      };

      return [shopGroup];
    });

  }, [myCartData, restaurantData]);


  // --- LOGIC SAVE ---
  const saveCartToServer = async (newData: ShopGroup[], silent = true) => {
    const activeShop = newData.find(s => s.items.length > 0);
    if (!activeShop) return;

    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      
      const itemsPayload = activeShop.items.map(i => ({
        foodId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image?.uri || ''
      }));

      await updateCart({
        variables: {
          restaurantId: activeShop.shopId,
          items: itemsPayload
        }
      });
      
      if (!silent) console.log("Saved cart successfully");
    } catch (err) {
      console.error("Save cart error:", err);
    } finally {
      isSavingRef.current = false;
    }
  };

  // --- UI HANDLERS ---
  const changeQuantity = (shopId: string, itemId: string, delta: number) => {
    setCartData(prev => {
      const updatedCart = prev.map(shop => {
        if (shop.shopId !== shopId) return shop;

        const newItems = shop.items.map(item => {
          if (item.id === itemId) {
             return { ...item, quantity: item.quantity + delta };
          }
          return item;
        }).filter(i => i.quantity > 0);

        return { ...shop, items: newItems };
      }).filter(s => s.items.length > 0);

      saveCartToServer(updatedCart);
      return updatedCart;
    });
  };

  const toggleItem = (shopId: string, itemId: string) => {
    setCartData(prev => prev.map(shop => {
      if (shop.shopId !== shopId) return shop;
      
      const newItems = shop.items.map(i => 
        i.id === itemId ? { ...i, checked: !i.checked } : i
      );
      const allChecked = newItems.every(i => i.checked);
      return { ...shop, items: newItems, checked: allChecked };
    }));
  };

  const toggleShop = (shopId: string) => {
    setCartData(prev => prev.map(shop => {
      if (shop.shopId !== shopId) return shop;
      const newVal = !shop.checked;
      return {
        ...shop,
        checked: newVal,
        items: shop.items.map(i => ({ ...i, checked: newVal }))
      };
    }));
  };

  const toggleSelectAll = () => {
    const isAllSelected = getSelectedCount() > 0;
    setCartData(prev => prev.map(shop => ({
      ...shop,
      checked: !isAllSelected,
      items: shop.items.map(i => ({ ...i, checked: !isAllSelected }))
    })));
  };

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
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  // --- RENDER ---
  const renderShopGroup = ({ item: shop }: { item: ShopGroup }) => (
    <View style={styles.shopBlock}>
      <View style={styles.shopHeader}>
        <View style={styles.row}>
          <CheckBox checked={shop.checked} onPress={() => toggleShop(shop.shopId)} />
          <Icon name="home" size={18} color="#333" style={{ marginLeft: 8, marginRight: 4 }} />
          <Text style={styles.shopName}>{shop.shopName}</Text>
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
              <Text style={styles.variationText}>Cơ bản</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatCurrency(product.price)}</Text>
                
                <View style={styles.quantityStepper}>
                  <TouchableOpacity 
                    style={styles.stepBtn}
                    onPress={() => {
                       if (product.quantity === 1) {
                          Alert.alert('Xóa?', 'Bạn muốn bỏ món này?', [
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowleft" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
      </View>

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
              <Icon name="shoppingcart" size={50} color="#DDD" />
              <Text style={{ color: '#999', marginTop: 10 }}>Giỏ hàng đang trống</Text>
            </View>
          }
        />
      )}

      {cartData.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.row}>
            {getSelectedCount() > 0 ? (
              <Icon name="checkcircle" size={20} color={colors.primary} />
            ) : (
              <Icon name="checkcircleo" size={20} color="#999" />
            )}
            <Text style={styles.selectAllText}>
              {getSelectedCount() > 0 ? 'Bỏ chọn' : 'Tất cả'}
            </Text>
          </TouchableOpacity>

          <View style={styles.totalContainer}>
            <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.finalPrice}>{formatCurrency(getTotalPrice())}</Text>
            </View>

            <TouchableOpacity
              style={[styles.buyButton, getSelectedCount() === 0 && styles.buyButtonDisabled]}
              disabled={getSelectedCount() === 0}
              onPress={() => {
                const selectedShops = cartData.map(s => ({
                  ...s,
                  items: s.items.filter(i => i.checked)
                })).filter(s => s.items.length > 0);

                navigation.navigate('Payment' as never, {
                  totalAmount: getTotalPrice(),
                  selectedShops: selectedShops,
                } as never);
              }}
            >
              <Text style={styles.buyButtonText}>Mua ({getSelectedCount()})</Text>
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
  shopName: { fontWeight: 'bold', fontSize: 15, color: '#000', marginHorizontal: 8 },
  productItem: { paddingHorizontal: 12, paddingTop: 12 },
  productRow: { flexDirection: 'row', alignItems: 'flex-start' },
  productImage: { width: 80, height: 80, marginHorizontal: 10, borderRadius: 8, backgroundColor: '#EEE' },
  productInfo: { flex: 1, height: 80, justifyContent: 'space-between' },
  productName: { fontSize: 14, color: '#000', fontWeight: '500' },
  variationText: { fontSize: 11, color: '#888', backgroundColor: '#F9F9F9', alignSelf: 'flex-start', padding: 2, borderRadius: 3 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  quantityStepper: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 4, height: 28 },
  stepBtn: { width: 28, alignItems: 'center', justifyContent: 'center' },
  quantityText: { width: 30, textAlign: 'center', lineHeight: 26, color: '#000', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD', fontSize: 13 },
  checkBox: { width: 22, height: 22, borderWidth: 1, borderColor: '#BBB', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  checkBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderColor: '#EEE', elevation: 10 },
  selectAllText: { marginLeft: 8, color: '#444' },
  totalContainer: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#666', textAlign: 'right' },
  finalPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  buyButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25 },
  buyButtonDisabled: { backgroundColor: '#CCC' },
  buyButtonText: { color: '#FFF', fontWeight: 'bold' },
});