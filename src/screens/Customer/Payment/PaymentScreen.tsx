import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { setDeliveryLocation } from '../../../features/cart/cartSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { colors } from '../../../theme';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';

interface Address {
  street: string;
  city: string;
  lat: number;
  lng: number;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  address: Address;
}

interface CartItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId?: string | null;
}

interface Cart {
  _id: string;
  restaurantId: string;
  items: CartItem[];
  totalAmount: number;
}

interface GetUserProfileData {
  me: UserProfile;
  myCart: Cart;
}

interface CreateOrderInput {
  restaurantId?: string | null;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: Address;
}

const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      phone
      address {
        street
        city
        lat
        lng
      }
    }
    myCart {
      _id
      items {
        foodId
        name
        price
        quantity
        image
        restaurantId
      }
      totalAmount
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
      totalAmount
      shippingAddress {
        street
      }
    }
  }
`;

const CREATE_ORDERS = gql`
  mutation CreateOrders($inputs: [CreateOrderInput]!) {
    createOrders(inputs: $inputs) {
      id
      status
      totalAmount
    }
  }
`;

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const dispatch = useDispatch();
  const deliveryLocation = useSelector(
    (s: any) => s.cart?.deliveryLocation || null,
  ) as Address | null;
  const reduxSelectedShops = useSelector(
    (s: any) => s.cart?.selectedShops || null,
  );
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  // selectedShops passed from CartScreen: store in state so it's not lost when route.params changes
  const [selectedShopsState, setSelectedShopsState] = useState<any[] | null>(
    () => route.params?.selectedShops || reduxSelectedShops || null,
  );

  // groupedShops: normalized groups keyed by restaurantId for display + order creation
  const [groupedShops, setGroupedShops] = useState<any[] | null>(null);

  // If navigation later provides selectedShops explicitly, update state (but don't overwrite on other param changes)
  useEffect(() => {
    if (route.params?.selectedShops) {
      setSelectedShopsState(route.params.selectedShops);
    } else if (reduxSelectedShops) {
      setSelectedShopsState(reduxSelectedShops);
    }
  }, [route.params?.selectedShops, reduxSelectedShops]);

  const client = useApolloClient();

  // Whenever selectedShopsState changes, normalize into groups by restaurantId
  useEffect(() => {
    const normalize = async () => {
      const src = selectedShopsState;
      if (!src) {
        setGroupedShops(null);
        return;
      }

      const groups: Record<string, any> = {};
      for (const shop of src) {
        const items = shop.items || [];
        for (const raw of items) {
          const rid = raw.restaurantId || null;
          const key = String(rid || 'null');
          if (!groups[key]) groups[key] = { restaurantId: rid, items: [] };

          // normalize item shape coming from CartScreen: use id as foodId, image as string
          const foodId = raw.foodId || raw.id || raw._id || null;
          let imageStr = '';
          if (!raw.image) imageStr = '';
          else if (typeof raw.image === 'string') imageStr = raw.image;
          else if (raw.image && typeof raw.image === 'object' && raw.image.uri)
            imageStr = raw.image.uri;
          else imageStr = String(raw.image);

          groups[key].items.push({
            foodId: foodId ? String(foodId) : null,
            id: raw.id,
            name: raw.name,
            price: Number(raw.price) || 0,
            quantity: Number(raw.quantity) || 1,
            image: imageStr,
            restaurantId: rid,
          });
        }
      }

      const arr = Object.values(groups) as any[];
      setGroupedShops(arr);
    };
    normalize();
  }, [selectedShopsState, client]);

  // Bỏ onCompleted, chỉ dùng Generic Type <GetUserProfileData>
  const { data, loading, error } = useQuery<GetUserProfileData>(
    GET_USER_PROFILE,
    {
      fetchPolicy: 'network-only',
    },
  );

  const [createOrderMutation, { loading: creating }] =
    useMutation(CREATE_ORDER);

  const [createOrdersMutation] = useMutation(CREATE_ORDERS);

  const GET_FOOD_SIMPLE = gql`
    query GetFoodSimple($id: ID!) {
      getFood(id: $id) {
        id
        restaurant {
          _id
        }
        restaurantId
      }
    }
  `;

  // Khi data tải xong, nếu store chưa có địa chỉ thì lưu địa chỉ mặc định vào Redux
  useEffect(() => {
    if (data?.me?.address?.street && !deliveryLocation) {
      dispatch(
        setDeliveryLocation({
          street: data.me.address.street,
          city: data.me.address.city || 'Hồ Chí Minh',
          lat: data.me.address.lat || 0,
          lng: data.me.address.lng || 0,
        }),
      );
    }
  }, [data, deliveryLocation, dispatch]); // Chạy lại mỗi khi data hoặc deliveryLocation thay đổi

  // Backward-compat: nếu MapScreen trả về params (legacy), cập nhật vào Redux
  useEffect(() => {
    if (route.params?.selectedAddress) {
      dispatch(setDeliveryLocation(route.params.selectedAddress));
    }
  }, [route.params?.selectedAddress, dispatch]);

  const handleOpenMap = () => {
    navigation.navigate('MapScreen', {
      isPickingMode: true,
      returnScreen: 'Payment',
    });
  };

  const handleOrder = async () => {
    // Build shops list from groupedShops (preferred). If not available, normalize selectedShopsState now.
    let shops: any[] = [];
    if (groupedShops && groupedShops.length > 0) shops = groupedShops;
    else if (selectedShopsState && selectedShopsState.length > 0) {
      const groups: Record<string, any> = {};
      for (const shop of selectedShopsState) {
        const items = shop.items || [];
        for (const raw of items) {
          const rid = raw.restaurantId || null;
          const key = String(rid || 'null');
          if (!groups[key]) groups[key] = { restaurantId: rid, items: [] };
          const foodId = raw.foodId || raw.id || raw._id || null;
          let imageStr = '';
          if (!raw.image) imageStr = '';
          else if (typeof raw.image === 'string') imageStr = raw.image;
          else if (raw.image && typeof raw.image === 'object' && raw.image.uri)
            imageStr = raw.image.uri;
          else imageStr = String(raw.image);
          groups[key].items.push({
            foodId: foodId ? String(foodId) : null,
            id: raw.id,
            name: raw.name,
            price: Number(raw.price) || 0,
            quantity: Number(raw.quantity) || 1,
            image: imageStr,
            restaurantId: rid,
          });
        }
      }
      shops = Object.values(groups);
    }
    console.log('[Payment] shops to order=', shops);
    if (!shops || shops.length === 0) {
      Alert.alert('Giỏ hàng trống!');
      return;
    }

    if (!deliveryLocation) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng!');
      return;
    }

    try {
      // Resolve missing restaurantId for items by querying food details
      const missingFoodIds = new Set();
      for (const shop of shops) {
        for (const it of shop.items) {
          if (!it.restaurantId) {
            const fid = it.foodId || it.id;
            if (fid) missingFoodIds.add(String(fid));
          }
        }
      }
      if (missingFoodIds.size > 0) {
        await Promise.all(
          Array.from(missingFoodIds).map(async fid => {
            try {
              const res = await client.query({
                query: GET_FOOD_SIMPLE,
                variables: { id: fid },
              });
              // Fix: ensure res.data is typed and getFood is accessed safely
              const foodData = (res.data as { getFood?: any })?.getFood;
              const rid =
                foodData?.restaurantId || foodData?.restaurant?._id || null;
              for (const shop of shops) {
                for (const it of shop.items) {
                  const idMatch = String(it.foodId || it.id) === String(fid);
                  if (idMatch && !it.restaurantId) it.restaurantId = rid;
                }
              }
            } catch (e) {
              console.warn('[Payment] failed to fetch food', fid, e);
            }
          }),
        );
      }

      // Build inputs: ensure each input has a non-null restaurantId (server requires ID)
      const inputs: CreateOrderInput[] = [];
      for (const shop of shops) {
        // Resolve restaurantId from group or item or fallback to server cart
        let resolvedRestaurantId =
          shop.restaurantId ||
          (shop.items && shop.items[0] && shop.items[0].restaurantId) ||
          data?.myCart?.restaurantId ||
          null;

        // If still missing, try to fetch from the first item's food detail
        if (!resolvedRestaurantId) {
          const firstId =
            (shop.items && (shop.items[0]?.foodId || shop.items[0]?.id)) ||
            null;
          if (firstId) {
            try {
              const r = await client.query({
                query: GET_FOOD_SIMPLE,
                variables: { id: String(firstId) },
              });
              const fd = (r.data as any)?.getFood;
              const rid = fd?.restaurantId || fd?.restaurant?._id || null;
              if (rid) {
                resolvedRestaurantId = String(rid);
                // propagate to items
                for (const it of shop.items) {
                  if (!it.restaurantId) it.restaurantId = resolvedRestaurantId;
                }
              }
            } catch (e) {
              console.warn('[Payment] fallback fetch food failed', e);
            }
          }
        }

        // If still missing, abort (server GraphQL type requires non-null ID)
        if (!resolvedRestaurantId) {
          Alert.alert(
            'Lỗi đặt hàng',
            'Không thể xác định nhà hàng cho một số món. Vui lòng kiểm tra giỏ hàng và thử lại.',
          );
          return;
        }

        const items = (shop.items || []).map((i: any) => {
          const fid = i.foodId || i.id;
          let imageStr = '';
          if (!i.image) imageStr = '';
          else if (typeof i.image === 'string') imageStr = i.image;
          else if (typeof i.image === 'object' && i.image.uri)
            imageStr = i.image.uri;
          else imageStr = String(i.image);
          return {
            foodId: String(fid),
            name: i.name,
            price: Number(i.price) || 0,
            quantity: Number(i.quantity) || 1,
            image: imageStr,
          };
        });

        inputs.push({
          restaurantId: String(resolvedRestaurantId),
          items,
          totalAmount: items.reduce(
            (s: number, it: any) => s + it.price * it.quantity,
            0,
          ),
          paymentMethod,
          shippingAddress: {
            street: deliveryLocation!.street,
            city: deliveryLocation!.city,
            lat: deliveryLocation!.lat,
            lng: deliveryLocation!.lng,
          },
        } as CreateOrderInput);
      }

      // Call batched mutation
      console.log('[Payment] createOrders inputs=', inputs);
      await createOrdersMutation({ variables: { inputs } });

      Alert.alert('Thành công', 'Đặt hàng thành công!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('CustomerTabs', { screen: 'Orders' }),
        },
      ]);
    } catch (err: any) {
      const msg = err.message || 'Có lỗi xảy ra';
      Alert.alert('Lỗi đặt hàng', msg);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (error)
    return (
      <View style={styles.center}>
        <Text>Lỗi tải trang: {error.message}</Text>
      </View>
    );

  // Use groupedShops (preferred) or passed selected shops, otherwise fall back to server `myCart`.
  const shopsToDisplay: {
    items: {
      id?: string;
      foodId?: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
      restaurantId?: string | null;
    }[];
  }[] = groupedShops
    ? groupedShops
    : selectedShopsState
    ? // map selectedShops entries (which may be {items: [...]}) to groups
      selectedShopsState.map((s: any) => ({
        restaurantId: null,
        items: s.items,
      }))
    : data?.myCart
    ? [
        {
          restaurantId: data.myCart.restaurantId || null,
          items: data.myCart.items.map(i => ({
            foodId: i.foodId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            restaurantId: i.restaurantId || data.myCart.restaurantId || null,
          })),
        },
      ]
    : [];

  const deliveryFee = 15000;
  const passedTotal =
    route.params?.totalAmount ??
    shopsToDisplay.reduce(
      (acc, s) =>
        acc + s.items.reduce((t, it) => t + it.price * it.quantity, 0),
      0,
    );
  const finalTotal = (passedTotal || 0) + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          <TouchableOpacity style={styles.addressCard} onPress={handleOpenMap}>
            <View style={styles.mapIcon}>
              <FontAwesome5
                name="map-marked-alt"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              {deliveryLocation ? (
                <>
                  <Text style={styles.addressStreet}>
                    {deliveryLocation.street}
                  </Text>
                  <Text style={styles.addressCity}>
                    {deliveryLocation.city}
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#888' }}>
                  Vui lòng chọn địa chỉ giao hàng
                </Text>
              )}
            </View>
            <MaterialIcons name="navigate-next" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          {shopsToDisplay.map((shop, si) => (
            <View key={si} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>
                Đơn hàng {si + 1}
              </Text>
              {shop.items.map((item: any, index: number) => {
                // normalize image source: item.image may be a string uri, an object {uri: string},
                // or a local require number. Avoid passing empty string to {uri}.
                let imageSource: any = null;
                if (
                  typeof item.image === 'string' &&
                  item.image.trim() !== ''
                ) {
                  imageSource = { uri: item.image };
                } else if (item.image && typeof item.image === 'object') {
                  if (
                    typeof item.image.uri === 'string' &&
                    item.image.uri.trim() !== ''
                  ) {
                    imageSource = { uri: item.image.uri };
                  } else if (typeof item.image === 'number') {
                    imageSource = item.image;
                  }
                } else if (typeof item.image === 'number') {
                  imageSource = item.image;
                }

                return (
                  <View key={index} style={styles.itemRow}>
                    {imageSource ? (
                      <Image source={imageSource} style={styles.itemImage} />
                    ) : (
                      <View
                        style={[styles.itemImage, { backgroundColor: '#eee' }]}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {(item.price * item.quantity).toLocaleString()}đ
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'COD' && styles.activeMethod,
            ]}
            onPress={() => setPaymentMethod('COD')}
          >
            <MaterialIcons
              name="money"
              size={24}
              color={paymentMethod === 'COD' ? colors.primary : '#666'}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === 'COD' && styles.activeText,
              ]}
            >
              Thanh toán khi nhận hàng (COD)
            </Text>
            {paymentMethod === 'COD' && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethod,
              paymentMethod === 'ONLINE' && styles.activeMethod,
            ]}
            onPress={() => setPaymentMethod('ONLINE')}
          >
            <MaterialIcons
              name="payment"
              size={24}
              color={paymentMethod === 'ONLINE' ? colors.primary : '#666'}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === 'ONLINE' && styles.activeText,
              ]}
            >
              Ví điện tử / Ngân hàng
            </Text>
            {paymentMethod === 'ONLINE' && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.billSection}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tạm tính</Text>
            <Text style={styles.billValue}>
              {passedTotal?.toLocaleString()}đ
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Phí giao hàng</Text>
            <Text style={styles.billValue}>
              {deliveryFee.toLocaleString()}đ
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>
              {finalTotal.toLocaleString()}đ
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrder}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderButtonText}>
              ĐẶT HÀNG - {finalTotal.toLocaleString()}đ
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#181C2E',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressStreet: { fontSize: 15, fontWeight: '600', color: '#333' },
  addressCity: { fontSize: 13, color: '#666', marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemQuantity: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: colors.primary },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeMethod: { borderColor: colors.primary, backgroundColor: '#FFF9F9' },
  methodText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#666' },
  activeText: { color: colors.primary, fontWeight: '600' },
  billSection: { backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: { fontSize: 14, color: '#666' },
  billValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    elevation: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  orderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
