import React, { useState, useEffect, useCallback } from 'react';
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
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

// Simple CheckBox component (placed after imports so TouchableOpacity/Icon are available)
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
// --- 1. CẤU TRÚC DỮ LIỆU ---
interface Product {
  id: string;
  name: string;
  variation: string;
  price: number;
  originalPrice?: number;
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

// --- GraphQL Types ---
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
    userId: string;
    restaurantId?: string | null;
    items: CartItemGQL[];
    totalAmount?: number;
  } ;
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
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

// Restaurant query type
interface GetRestaurantData {
  restaurant: {
    _id: string;
    name: string;
  } | null;
}

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartData, setCartData] = useState<ShopGroup[]>([]);
  const [localCart, setLocalCart] = useState<ShopGroup[] | null>(null);
  const LOCAL_CART_KEY = '@LTMB:cart';
  const [originalServerSnapshot, setOriginalServerSnapshot] = useState<
    any | null
  >(null);

  // Mutation để lưu giỏ hàng khi rời khỏi trang
  // Mutation để lưu giỏ hàng khi rời khỏi trang

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

  const [updateCart] = useMutation<UpdateCartData, UpdateCartVars>(
    UPDATE_CART_MUTATION,
  );

  // Query lấy giỏ hàng hiện tại từ server
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

  const {
    data: myCartData,
    loading: myCartLoading,
    error: myCartError,
    refetch: refetchMyCart,
  } = useQuery<MyCartData>(GET_MY_CART, { fetchPolicy: 'network-only' });

  const route = useRoute();
  const incomingNewItems = (route.params as any)?.newItems || [];
  const incomingRestaurantId = (route.params as any)?.restaurantId || null;

  // Track current restaurant id to fetch restaurant info (name)
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(
    null,
  );

  const GET_RESTAURANT = gql`
    query GetRestaurant($id: ID!) {
      restaurant(id: $id) {
        _id
        name
      }
    }
  `;

  const {
    data: restaurantData,
    loading: restaurantLoading,
    error: restaurantError,
  } = useQuery<GetRestaurantData>(GET_RESTAURANT, {
    variables: { id: currentRestaurantId as string },
    skip: !currentRestaurantId,
  } as any);

  // Snapshot of server cart to compare later (declared above)

  // Khi có dữ liệu từ server hoặc incoming items, thực hiện merge
  // Prevent re-processing the same incoming items
  const processedIncomingRef = React.useRef(false);
  // Track local merge progress so saves wait until localCart merged
  const localMergeRef = React.useRef(false);

  // Wait helper: resolves when incoming merge and local merge finished or myCart finished loading
  const waitForMerge = () =>
    new Promise<void>(resolve => {
      const hasIncoming = Array.isArray(incomingNewItems)
        ? incomingNewItems.length > 0
        : !!incomingNewItems;
      console.log(
        '[Cart] waitForMerge hasIncoming=',
        hasIncoming,
        'myCartLoading=',
        myCartLoading,
        'localMerge=',
        localMergeRef.current,
        'processedIncoming=',
        processedIncomingRef.current,
      );
      if (!hasIncoming && !localMergeRef.current) return resolve();
      if (
        processedIncomingRef.current &&
        !myCartLoading &&
        !localMergeRef.current
      )
        return resolve();
      const start = Date.now();
      const iv = setInterval(() => {
        if (
          processedIncomingRef.current &&
          !myCartLoading &&
          !localMergeRef.current
        ) {
          clearInterval(iv);
          console.log('[Cart] waitForMerge resolved');
          return resolve();
        }
        // timeout after 3s to avoid blocking navigation
        if (Date.now() - start > 3000) {
          clearInterval(iv);
          return resolve();
        }
      }, 50);
    });

  // Effect A: initialize cart from server when available (only if no incoming items to process)
  useEffect(() => {
    if (myCartLoading) return;
    if (processedIncomingRef.current) return; // incoming already handled
    console.log('[Cart] EffectA initializing from server', myCartData?.myCart);
    const serverCart = myCartData?.myCart || null;
    if (!serverCart) {
      setCartData([]);
      setOriginalServerSnapshot(null);
      return;
    }

    const items = serverCart.items || [];
    const shopGroup: ShopGroup[] = [
      {
        shopId: serverCart.restaurantId || 'server',
        shopName: serverCart.restaurantId ? 'Nhà hàng' : 'Nhà hàng',
        checked: false,
        items: items.map((it: any) => ({
          id: it.foodId,
          name: it.name,
          variation: '',
          price: it.price,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      },
    ];

    setCartData(shopGroup);
    setOriginalServerSnapshot({ restaurantId: serverCart.restaurantId, items });
    // request restaurant name
    setCurrentRestaurantId(serverCart.restaurantId || null);
  }, [myCartData, myCartLoading]);

  // When restaurantData returns, update shopName in cartData for matching shopId
  useEffect(() => {
    if (!restaurantData?.restaurant) return;
    const rid = restaurantData.restaurant._id;
    const restaurantName = restaurantData.restaurant.name ?? '';
    setCartData(
      prev =>
        prev.map(shop =>
          String(shop.shopId) === String(rid)
            ? { ...shop, shopName: restaurantName }
            : shop,
        ) as ShopGroup[],
    );
  }, [restaurantData]);

  // NOTE: render loading/error inside JSX below to avoid breaking Hooks order

  // Effect B: if there are incoming items from navigation, merge them once with server data
  useEffect(() => {
    const inc = Array.isArray(incomingNewItems)
      ? incomingNewItems
      : incomingNewItems
      ? [incomingNewItems]
      : [];
    if (inc.length === 0) return;
    // Wait for server cart to finish loading before merging incoming items.
    if (myCartLoading) return;
    if (processedIncomingRef.current) return;

    console.log(
      '[Cart] EffectB merging incoming items',
      inc,
      'incomingRestaurantId=',
      incomingRestaurantId,
    );

    const server = myCartData?.myCart || { items: [] };
    const baseItems = server.items ? [...server.items] : [];

    inc.forEach((incItem: any) => {
      const idx = baseItems.findIndex(
        b => String(b.foodId) === String(incItem.foodId),
      );
      if (idx >= 0) {
        baseItems[idx].quantity =
          (baseItems[idx].quantity || 0) + (incItem.quantity || 0);
      } else {
        baseItems.push({
          foodId: incItem.foodId,
          name: incItem.name,
          price: incItem.price,
          quantity: incItem.quantity,
          image: incItem.image,
        });
      }
    });

    const restId =
      (server && (server as any).restaurantId !== undefined ? (server as any).restaurantId : undefined) ||
      incomingRestaurantId ||
      inc[0]?.restaurantId ||
      null;
    const shopGroup: ShopGroup[] = [];
    if (restId) {
      shopGroup.push({
        shopId: restId,
        shopName: 'Nhà hàng',
        checked: false,
        items: baseItems.map((it: any) => ({
          id: it.foodId,
          name: it.name,
          variation: '',
          price: it.price,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      });
    } else {
      shopGroup.push({
        shopId: 'local',
        shopName: 'Giỏ hàng',
        checked: false,
        items: inc.map((it: any) => ({
          id: it.foodId,
          name: it.name,
          variation: '',
          price: it.price,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      });
    }

    setCartData(shopGroup);
    // DO NOT set snapshot to the merged (baseItems) here — keep the original server snapshot
    // so that saveCartToServer can detect changes and perform an update.
    const serverItems = server && server.items ? server.items : [];
    setOriginalServerSnapshot({
      restaurantId: restId,
      items: serverItems,
    });
    console.log(
      '[Cart] EffectB setOriginalServerSnapshot from server items length=',
      serverItems.length,
    );
    // set restaurant id to fetch its name
    setCurrentRestaurantId(restId || null);
    processedIncomingRef.current = true;
  }, [incomingNewItems, incomingRestaurantId, myCartData]);

  // Load local cart from AsyncStorage once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCAL_CART_KEY);
        console.log('[Cart] load local cart raw=', raw);
        if (!raw) return;
        const parsed: ShopGroup[] = JSON.parse(raw);
        console.log('[Cart] parsed local cart length=', parsed.length);
        if (mounted) {
          setLocalCart(parsed);
          localMergeRef.current = true;
        }
      } catch (e) {
        console.warn('Failed to load local cart', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Merge loaded local cart into current cartData (only add shops/items that are missing)
  useEffect(() => {
    if (!localCart) return;
    console.log(
      '[Cart] merging localCart into cartData, localCart=',
      localCart,
    );
    setCartData(prev => {
      const map = new Map(prev.map(s => [String(s.shopId), { ...s }]));
      for (const localShop of localCart) {
        const key = String(localShop.shopId);
        if (!map.has(key)) {
          map.set(key, { ...localShop });
          continue;
        }
        // merge items: add only items not present
        const existing = map.get(key)!;
        const existingIds = new Set(existing.items.map(i => String(i.id)));
        const mergedItems = [...existing.items];
        for (const li of localShop.items) {
          if (!existingIds.has(String(li.id))) mergedItems.push(li);
        }
        map.set(key, { ...existing, items: mergedItems });
      }
      return Array.from(map.values());
    });
    // clear localCart to avoid re-merging
    setLocalCart(null);
    // mark merging finished
    localMergeRef.current = false;
  }, [localCart]);

  // --- LOGIC XỬ LÝ (GIỮ NGUYÊN) ---
  const toggleShop = (shopId: string) => {
    const newData = cartData.map(shop => {
      if (shop.shopId === shopId) {
        const newChecked = !shop.checked;
        return {
          ...shop,
          checked: newChecked,
          items: shop.items.map(item => ({ ...item, checked: newChecked })),
        };
      }
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
      };
    });
    console.log(
      '[Cart] toggleShop newData=',
      newData.map(s => ({
        shopId: s.shopId,
        checked: s.checked,
        items: s.items.length,
      })),
    );
    setCartData(newData);
  };

  const toggleItem = (shopId: string, itemId: string) => {
    const newData = cartData.map(shop => {
      if (shop.shopId === shopId) {
        const newItems = shop.items.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        );
        const allChecked =
          newItems.length > 0 && newItems.every(item => item.checked);
        return { ...shop, items: newItems, checked: allChecked };
      }
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
      };
    });
    console.log(
      '[Cart] toggleItem newData for shop=',
      shopId,
      newData.find(s => s.shopId === shopId),
    );
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

  const selectAll = () => {
    const newData = cartData.map(shop => ({
      ...shop,
      checked: true,
      items: shop.items.map(item => ({ ...item, checked: true })),
    }));
    setCartData(newData);
  };

  const toggleSelectAll = () => {
    if (getSelectedCount() > 0) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const saveCartToServer = useCallback(async () => {
    console.log('[Cart] saveCartToServer START', {
      cartLength: cartData.length,
    });
    // Chọn shop lưu: ưu tiên shop checked, nếu không có lấy shop đầu tiên có items
    // Save first shop that has items (regardless of checked state)
    const activeShop = cartData.find(s => s.items.length > 0);
    if (!activeShop) {
      console.log('[Cart] saveCartToServer: no activeShop, nothing to save');
      return;
    }

    const restaurantId = activeShop.shopId;
    const items = activeShop.items.map(i => ({
      foodId: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image:
        typeof i.image === 'object' && i.image?.uri
          ? i.image.uri
          : i.image || '',
    }));

    console.log(
      '[Cart] saveCartToServer activeShop=',
      restaurantId,
      'itemsCount=',
      items.length,
      'originalSnapshot=',
      originalServerSnapshot,
    );

    // Compare with originalServerSnapshot to avoid unnecessary saves
    const server = originalServerSnapshot;
    const changed = (() => {
      if (!server) return items.length > 0; // no server cart before -> changed if we have items
      if (String(server.restaurantId) !== String(restaurantId)) return true;
      const sItems = server.items || [];
      if (sItems.length !== items.length) return true;
      // compare by foodId and quantity
      for (let it of items) {
        const si = sItems.find(
          (x: any) => String(x.foodId) === String(it.foodId),
        );
        if (!si) return true;
        if ((si.quantity || 0) !== (it.quantity || 0)) return true;
      }
      return false;
    })();

    // Always persist full cart locally so multi-shop data is not lost
    try {
      await AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartData));
      console.log('[Cart] Persisted cart to AsyncStorage key=', LOCAL_CART_KEY);
    } catch (e) {
      console.warn('Persist cart to AsyncStorage failed', e);
    }

    console.log('[Cart] saveCartToServer changed=', changed);
    if (!changed) return;

    // If the active shop is local (no restaurantId) skip server update
    if (!restaurantId || String(restaurantId) === 'local') {
      console.log(
        '[Cart] saveCartToServer skipping server update for local shop=',
        restaurantId,
      );
      return;
    }

    try {
      const res = await updateCart({ variables: { restaurantId, items } });
      console.log('[Cart] updateCart result=', res);
      // after successful save, update snapshot
      setOriginalServerSnapshot({ restaurantId, items });
      // optionally refetch server cart
      try {
        await refetchMyCart();
      } catch (e) {
        console.warn('[Cart] refetchMyCart failed', e);
      }
    } catch (err) {
      console.warn('Save cart failed:', err);
    }
  }, [cartData, updateCart, originalServerSnapshot, refetchMyCart]);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('blur', async () => {
      try {
        await saveCartToServer();
      } catch (e) {
        // swallow to avoid blocking navigation
      }
    });
    return unsubscribe;
  }, [navigation, saveCartToServer]);

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

  const changeQuantity = (shopId: string, itemId: string, delta: number) => {
    const newData = cartData
      .map(shop => {
        if (shop.shopId === shopId) {
          const newItems = shop.items
            .map(item => {
              if (item.id === itemId) {
                const newQty = item.quantity + delta;
                return { ...item, quantity: newQty };
              }
              return item;
            })
            .filter(it => it.quantity > 0); // remove items with qty <= 0

          return { ...shop, items: newItems };
        }
        return shop;
      })
      .filter(s => s.items.length > 0); // remove empty shops

    console.log(
      '[Cart] changeQuantity newData=',
      newData.map(s => ({
        shopId: s.shopId,
        items: s.items.map(i => ({ id: i.id, qty: i.quantity })),
      })),
    );
    setCartData(newData);
  };

  // --- RENDER ITEM ---
  const renderShopGroup = ({ item: shop }: { item: ShopGroup }) => (
    <View style={styles.shopBlock}>
      <View style={styles.shopHeader}>
        <View style={styles.row}>
          <CheckBox
            checked={shop.checked}
            onPress={() => toggleShop(shop.shopId)}
          />
          {/* THAY ĐỔI: Icon 'shop' */}
          <Icon
            name="car"
            size={18}
            color="#333"
            style={{ marginLeft: 8, marginRight: 4 }}
          />
          <Text style={styles.shopName}>{shop.shopName}</Text>
          {/* THAY ĐỔI: Icon 'right' */}
          <Icon name="right" size={14} color="#999" />
        </View>
        {/* edit removed */}
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
              <View style={styles.variationTag}>
                <Text style={styles.variationText}>{product.variation}</Text>
                {/* THAY ĐỔI: Icon 'down' */}
                <Icon name="down" size={10} color="#666" />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>
                  {formatCurrency(product.price)}
                </Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    //nếu xuống còn 0 thì bỏ item khỏi giỏ hàng
                    onPress={() => {
                      if (product.quantity === 1) {
                        Alert.alert(
                          'Xóa sản phẩm',
                          'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
                          [
                            {
                              text: 'Hủy',
                              style: 'cancel',
                            },
                            {
                              text: 'Xóa',
                              onPress: () =>
                                changeQuantity(shop.shopId, product.id, -1),
                              style: 'destructive',
                            },
                          ],
                        );
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

          <View style={styles.voucherRow}>
            {/* THAY ĐỔI: Icon 'tags' */}
            <Icon name="tags" size={16} color={colors.primary} />
            <Text style={styles.voucherText}>Giảm 15k phí vận chuyển</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {myCartLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : myCartError ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>Error: {(myCartError as any)?.message || 'Unknown error'}</Text>
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={async () => {
                console.log(
                  '[Cart] header back pressed, waiting for merge/save',
                );
                try {
                  await waitForMerge();
                  await saveCartToServer();
                } catch (e) {}
                navigation.goBack();
              }}
            >
              {/* THAY ĐỔI: Icon 'arrowleft' */}
              <Icon name="arrowleft" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Giỏ hàng ({cartData.reduce((acc, s) => acc + s.items.length, 0)})
            </Text>
          </View>

          <FlatList
            data={cartData}
            renderItem={renderShopGroup}
            keyExtractor={item => item.shopId}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={toggleSelectAll}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                {/* THAY ĐỔI: Icon 'closecircleo' và 'checksquareo' */}
                {getSelectedCount() > 0 ? (
                  <Icon name="closecircleo" size={20} color={colors.primary} />
                ) : (
                  <Icon name="checksquareo" size={20} color="#999" />
                )}
                <Text style={styles.selectAllText}>
                  {getSelectedCount() > 0 ? 'Bỏ chọn' : 'Tất cả'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
              <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                <Text style={styles.finalPrice}>
                  {formatCurrency(getTotalPrice())}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.buyButton,
                  getSelectedCount() === 0 && styles.buyButtonDisabled,
                ]}
                disabled={getSelectedCount() === 0}
                onPress={async () => {
                  console.log(
                    '[Cart] Buy pressed, selectedCount=',
                    getSelectedCount(),
                  );
                  const selectedShops = cartData
                    .map(s => ({
                      shopId: s.shopId,
                      shopName: s.shopName,
                      items: s.items
                        .filter(i => i.checked)
                        .map(i => ({
                          id: i.id,
                          name: i.name,
                          price: i.price,
                          quantity: i.quantity,
                        })),
                    }))
                    .filter(s => s.items.length > 0);

                  if (selectedShops.length > 0) {
                    try {
                      await saveCartToServer();
                    } catch (e) {}
                    (navigation as any).navigate('Payment' as never, {
                      currentRestaurantId,
                      totalAmount: getTotalPrice(),
      
                    });
                  }
                }}
              >
                <Text style={styles.buyButtonText}>
                  Mua hàng ({getSelectedCount()})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 16,
  },
  headerEdit: {
    fontSize: 16,
    color: '#333',
  },
  // checkBoxHitSlop removed, use inline object instead
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shopBlock: {
    backgroundColor: '#FFF',
    marginTop: 10,
    paddingBottom: 10,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  shopName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  editText: {
    color: '#666',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productItem: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 80,
    height: 80,
    marginHorizontal: 10,
    backgroundColor: '#EEE',
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80,
  },
  productName: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  variationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginTop: 4,
  },
  variationText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quantityStepper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 2,
  },
  stepBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E8E8E8',
  },
  quantityText: {
    width: 30,
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 2,
    color: '#333',
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 30,
  },
  voucherText: {
    color: colors.primary,
    fontSize: 12,
    marginLeft: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 10,
  },
  selectAllText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#000',
    textAlign: 'right',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
});