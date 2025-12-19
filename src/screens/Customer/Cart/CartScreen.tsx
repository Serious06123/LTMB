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
import { useDispatch } from 'react-redux';
import { setSelectedShops } from '../../../features/cart/cartSlice';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

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
  };
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

interface GetRestaurantData {
  restaurant: {
    _id: string;
    name: string;
  } | null;
}

export default function CartScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [cartData, setCartData] = useState<ShopGroup[]>([]);
  const [localCart, setLocalCart] = useState<ShopGroup[] | null>(null);
  const LOCAL_CART_KEY = '@LTMB:cart';
  const [originalServerSnapshot, setOriginalServerSnapshot] = useState<
    any | null
  >(null);

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

  const processedIncomingRef = React.useRef(false);
  const localMergeRef = React.useRef(false);

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
        if (Date.now() - start > 3000) {
          clearInterval(iv);
          return resolve();
        }
      }, 50);
    });

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
        // Use empty string when restaurantId not available instead of null
        shopId: serverCart.restaurantId
          ? String(serverCart.restaurantId)
          : null,
        shopName: serverCart.restaurantId ? 'Nhà hàng' : 'Nhà hàng',
        checked: false,
        items: items.map((it: any) => ({
          id: it.foodId,
          name: it.name,
          variation: '',
          price: it.price,
          // include restaurantId if present on item, fallback to serverCart.restaurantId
          restaurantId: it.restaurantId || serverCart.restaurantId || null,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      },
    ];

    setCartData(shopGroup);
    setOriginalServerSnapshot({ restaurantId: serverCart.restaurantId, items });
    setCurrentRestaurantId(serverCart.restaurantId || null);
  }, [myCartData, myCartLoading]);

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

  useEffect(() => {
    const inc = Array.isArray(incomingNewItems)
      ? incomingNewItems
      : incomingNewItems
      ? [incomingNewItems]
      : [];
    if (inc.length === 0) return;
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
      (server && (server as any).restaurantId !== undefined
        ? (server as any).restaurantId
        : undefined) ||
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
          // if item already has restaurantId, keep it; else use restId
          restaurantId: it.restaurantId || restId || null,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      });
    } else {
      shopGroup.push({
        // No restaurantId available for local-only cart; use null
        shopId: null,
        shopName: 'Giỏ hàng',
        checked: false,
        items: inc.map((it: any) => ({
          id: it.foodId,
          name: it.name,
          variation: '',
          price: it.price,
          restaurantId: it.restaurantId || incomingRestaurantId || null,
          image: it.image ? { uri: it.image } : IMAGES.pizza1,
          quantity: it.quantity || 1,
          checked: false,
        })),
      });
    }

    setCartData(shopGroup);
    const serverItems = server && server.items ? server.items : [];
    setOriginalServerSnapshot({
      restaurantId: restId,
      items: serverItems,
    });
    console.log(
      '[Cart] EffectB setOriginalServerSnapshot from server items length=',
      serverItems.length,
    );
    setCurrentRestaurantId(restId || null);
    processedIncomingRef.current = true;
  }, [incomingNewItems, incomingRestaurantId, myCartData]);

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
    setLocalCart(null);
    localMergeRef.current = false;
  }, [localCart]);

  const toggleShop = (shopId: string | null) => {
    const newData = cartData.map(shop => {
      if (String(shop.shopId) === String(shopId)) {
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

  const toggleItem = (shopId: string | null, itemId: string) => {
    const newData = cartData.map(shop => {
      if (String(shop.shopId) === String(shopId)) {
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
      newData.find(s => String(s.shopId) === String(shopId)),
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
    const activeShop = cartData.find(s => s.items.length > 0);
    if (!activeShop) {
      console.log('[Cart] saveCartToServer: no activeShop, nothing to save');
      return;
    }

    const restaurantId = activeShop.shopId;
    const items = activeShop.items.map(i => ({
      foodId: i.id,
      // include restaurantId per item if present; fallback to restaurantId variable
      restaurantId: i.restaurantId || restaurantId || null,
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

    const server = originalServerSnapshot;
    const changed = (() => {
      if (!server) return items.length > 0; // no server cart before -> changed if we have items
      if (String(server.restaurantId) !== String(restaurantId)) return true;
      const sItems = server.items || [];
      if (sItems.length !== items.length) return true;
      for (let it of items) {
        const si = sItems.find(
          (x: any) => String(x.foodId) === String(it.foodId),
        );
        if (!si) return true;
        if ((si.quantity || 0) !== (it.quantity || 0)) return true;
      }
      return false;
    })();

    try {
      await AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartData));
      console.log('[Cart] Persisted cart to AsyncStorage key=', LOCAL_CART_KEY);
    } catch (e) {
      console.warn('Persist cart to AsyncStorage failed', e);
    }

    console.log('[Cart] saveCartToServer changed=', changed);
    if (!changed) return;

    if (restaurantId === null || restaurantId === '') {
      console.log(
        '[Cart] saveCartToServer skipping server update for local shop=',
        restaurantId,
      );
      return;
    }

    try {
      const res = await updateCart({ variables: { restaurantId, items } });
      console.log('[Cart] updateCart result=', res);
      setOriginalServerSnapshot({ restaurantId, items });
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
      } catch (e) {}
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

  const changeQuantity = (
    shopId: string | null,
    itemId: string,
    delta: number,
  ) => {
    const newData = cartData
      .map(shop => {
        if (String(shop.shopId) === String(shopId)) {
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
          <Icon
            name="car"
            size={18}
            color="#333"
            style={{ marginLeft: 8, marginRight: 4 }}
          />
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
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <View style={styles.variationTag}>
                <Text style={styles.variationText}>{product.variation}</Text>
                <Icon name="down" size={10} color="#666" />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>
                  {formatCurrency(product.price)}
                </Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
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
              <Icon name="arrowleft" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Giỏ hàng ({cartData.reduce((acc, s) => acc + s.items.length, 0)})
            </Text>
          </View>

          <FlatList
            data={cartData}
            renderItem={renderShopGroup}
            keyExtractor={(item, index) =>
              String(item.shopId ?? `local-${index}`)
            }
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
                      items: s.items
                        .filter(i => i.checked)
                        .map(i => ({
                          id: i.id,
                          name: i.name,
                          price: i.price,
                          quantity: i.quantity,
                          // Truyền image dưới dạng STRING để không gửi object tới GraphQL
                          image:
                            typeof i.image === 'object' && i.image?.uri
                              ? i.image.uri
                              : typeof i.image === 'string'
                              ? i.image
                              : '',
                          // include restaurantId per item so Payment can group correctly
                          restaurantId: i.restaurantId || s.shopId || null,
                        })),
                    }))
                    .filter(s => s.items.length > 0);

                  if (selectedShops.length > 0) {
                    console.log(
                      '[Cart] Navigating to Payment with shops=',
                      selectedShops,
                    );
                    try {
                      await saveCartToServer();
                    } catch (e) {}
                    // dispatch to redux so PaymentScreen can read selectedShops from store
                    try {
                      dispatch(setSelectedShops(selectedShops));
                    } catch (err) {
                      console.warn(
                        '[Cart] dispatch setSelectedShops failed',
                        err,
                      );
                    }

                    (navigation as any).navigate('Payment' as never, {
                      selectedShops,
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
