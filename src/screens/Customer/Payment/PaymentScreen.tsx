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
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { colors } from '../../../theme';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

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
  restaurantId: string;
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

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  // Bỏ onCompleted, chỉ dùng Generic Type <GetUserProfileData>
  const { data, loading, error } = useQuery<GetUserProfileData>(
    GET_USER_PROFILE,
    {
      fetchPolicy: 'network-only',
    },
  );

  const [createOrderMutation, { loading: creating }] =
    useMutation(CREATE_ORDER);

  // Khi data tải xong, tự động set địa chỉ mặc định
  useEffect(() => {
    if (data?.me?.address?.street && !deliveryAddress) {
      setDeliveryAddress({
        street: data.me.address.street,
        city: data.me.address.city || 'Hồ Chí Minh',
        lat: data.me.address.lat || 0,
        lng: data.me.address.lng || 0,
      });
    }
  }, [data]); // Chạy lại mỗi khi data thay đổi

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setDeliveryAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  const handleOpenMap = () => {
    navigation.navigate('MapScreen', {
      isPickingMode: true,
      returnScreen: 'Payment',
    });
  };

  const handleOrder = async () => {
    const cart = data?.myCart;

    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Giỏ hàng trống!');
      return;
    }

    if (!deliveryAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng!');
      return;
    }

    const orderInput: CreateOrderInput = {
      restaurantId: cart.restaurantId,
      items: cart.items.map(i => ({
        foodId: i.foodId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      totalAmount: cart.totalAmount,
      paymentMethod: paymentMethod,
      shippingAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        lat: deliveryAddress.lat,
        lng: deliveryAddress.lng,
      },
    };

    try {
      await createOrderMutation({
        variables: { input: orderInput },
      });

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

  const cart = data?.myCart;
  const deliveryFee = 15000;
  const finalTotal = (cart?.totalAmount || 0) + deliveryFee;

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
              {deliveryAddress ? (
                <>
                  <Text style={styles.addressStreet}>
                    {deliveryAddress.street}
                  </Text>
                  <Text style={styles.addressCity}>{deliveryAddress.city}</Text>
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
          {cart?.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {(item.price * item.quantity).toLocaleString()}đ
              </Text>
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
              {cart?.totalAmount.toLocaleString()}đ
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
