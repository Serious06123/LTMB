import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import { WebView } from 'react-native-webview';
import { colors } from '../../../theme'; // Import màu từ theme
import PrimaryButton from '../../../components/button/PrimaryButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Định nghĩa các phương thức thanh toán
type PaymentMethod = 'cash' | 'qr';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { totalAmount, selectedShops, itemCount } = (route.params as any) || {
    totalAmount: 0,
    selectedShops: [],
    itemCount: 0,
  };
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qr');

  // Hàm format tiền tệ (cho giống bên Cart)
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  };
  // Xử lý khi nhấn thanh toán
  const CREATE_ORDER = gql`
    mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        id
        totalAmount
        status
        createdAt
      }
    }
  `;

  const CREATE_VNPAY = gql`
    mutation CreateVnpay($orderId: ID!) {
      createVnpay(orderId: $orderId)
    }
  `;

  const GET_ORDER = gql`
    query GetOrder($id: ID!) {
      getOrder(id: $id) {
        id
        totalAmount
        status
        paymentStatus
      }
    }
  `;

  const [createOrder, { loading: creating }] = useMutation(CREATE_ORDER);
  const [createVnpay] = useMutation(CREATE_VNPAY);
  const [fetchOrder, { data: orderData }] = useLazyQuery(GET_ORDER, {
    fetchPolicy: 'network-only',
  });

  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handlePay = async () => {
    try {
      const items =
        (selectedShops && selectedShops.length > 0
          ? selectedShops[0].items
          : []) || [];
      const restaurantId =
        selectedShops && selectedShops.length > 0
          ? selectedShops[0].shopId
          : null;
      const payload = {
        restaurantId,
        items: items.map((i: any) => ({
          foodId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image?.uri || i.image,
        })),
        totalAmount: totalAmount || 0,
        paymentMethod: selectedMethod === 'qr' ? 'ONLINE' : 'COD',
      };

      const { data } = await createOrder({ variables: { input: payload } });
      // Fix: type assertion for data
      const orderId = (data as { createOrder: { id: string } }).createOrder.id;
      // If ONLINE payment, create VNPay url and open WebView
      if (selectedMethod === 'qr') {
        try {
          const resp = await createVnpay({ variables: { orderId } });
          const paymentUrlResp = (resp?.data as { createVnpay?: string })?.createVnpay;
          if (!paymentUrlResp) throw new Error('Empty payment url');
          setPaymentUrl(paymentUrlResp);
          setShowWebView(true);
        } catch (e) {
          console.error('createVnpay error', e);
          Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán VNPay.');
        }
        return;
      }

      // COD fallback
      Alert.alert('Đơn hàng đã tạo', `Mã đơn: ${orderId}`, [
        {
          text: 'Theo dõi đơn hàng',
          onPress: () =>
            (navigation as any).navigate('TrackOrderScreen', { orderId }),
        },
      ]);
    } catch (err) {
      console.error('createOrder failed', err);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  };

  const handleWebNavChange = (navState: any) => {
    const url: string = navState?.url || '';
    // VNPay will redirect to backend return URL like /vnpay/return
    if (url.includes('/vnpay/return')) {
      // close webview
      setShowWebView(false);
      // poll backend for order status using txn ref if present in url
      const m = url.match(/vnp_TxnRef=([^&]+)/);
      const orderIdFromUrl = m ? decodeURIComponent(m[1]) : null;
      const orderIdToFetch = orderIdFromUrl;
      if (orderIdToFetch) {
        fetchOrder({ variables: { id: orderIdToFetch } });
        // wait for the query to resolve via orderData watcher (effect could be used)
        setTimeout(async () => {
          try {
            const fetchResult = await fetchOrder({ variables: { id: orderIdToFetch } });
            const od = (fetchResult.data as { getOrder?: any })?.getOrder;
            if (od && od.paymentStatus === 'paid') {
              Alert.alert(
                'Thanh toán thành công',
                'Giao dịch đã được xác nhận',
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      (navigation as any).navigate('TrackOrderScreen', {
                        orderId: orderIdToFetch,
                      }),
                  },
                ],
              );
            } else {
              Alert.alert(
                'Thanh toán',
                'Giao dịch chưa hoàn tất hoặc thất bại',
              );
            }
          } catch (e) {
            console.error('Error fetching order after vnpay return', e);
          }
        }, 800);
      }
    }
  };

  // Component hiển thị một ô chọn phương thức (Cash/QR)
  const renderMethodOption = (
    id: PaymentMethod,
    title: string,
    iconName: string,
  ) => {
    const isSelected = selectedMethod === id;
    return (
      <TouchableOpacity
        style={[styles.methodItem, isSelected && styles.methodItemActive]}
        onPress={() => setSelectedMethod(id)}
      >
        {isSelected && (
          <View style={styles.checkIcon}>
            <Icon name="checkcircle" size={20} color={colors.primary} />
          </View>
        )}
        <Icon
          name={iconName}
          size={28}
          color={isSelected ? colors.primary : '#A0A5BA'}
        />
        <Text
          style={[styles.methodText, isSelected && styles.methodTextActive]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrowleft" size={24} color="#181C2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Chọn phương thức */}
      <View style={styles.methodRow}>
        {renderMethodOption('qr', 'Mã QR', 'qrcode')}
        {renderMethodOption('cash', 'Tiền mặt', 'wallet')}
      </View>

      {/* Khu vực hiển thị chính */}
      <View style={styles.mainDisplayContainer}>
        <Text style={styles.sectionTitle}>
          {selectedMethod === 'qr'
            ? 'Quét mã để thanh toán'
            : 'Thanh toán khi nhận hàng'}
        </Text>

        <View style={styles.cardDisplay}>
          {selectedMethod === 'qr' ? (
            <View style={styles.qrContainer}>
              <View style={styles.qrFrame}>
                {/* Tạo QR Code chứa nội dung chuyển khoản số tiền tương ứng */}
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ChuyenKhoan_${totalAmount}`,
                  }}
                  style={styles.qrImage}
                />
              </View>
              <Text style={styles.qrNote}>Ngân hàng MB Bank</Text>
              <Text style={styles.qrOwner}>NGUYEN VAN A</Text>
              <Text style={styles.qrNumber}>1234 5678 9999</Text>
              <Text
                style={{
                  color: colors.primary,
                  marginTop: 5,
                  fontWeight: 'bold',
                }}
              >
                Số tiền: {formatCurrency(totalAmount)}
              </Text>
            </View>
          ) : (
            <View style={styles.cashContainer}>
              <View style={styles.iconCircle}>
                <Icon name="wallet" size={60} color={colors.primary} />
              </View>
              <Text style={styles.cashText}>
                Shipper sẽ thu{' '}
                <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                  {formatCurrency(totalAmount)}
                </Text>{' '}
                tiền mặt khi giao hàng.
              </Text>
              <Text style={styles.cashSubText}>
                Vui lòng chuẩn bị tiền lẻ để thanh toán nhanh hơn.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>

          {/* 4. Hiển thị số tiền động tại đây */}
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        <PrimaryButton title="XÁC NHẬN THANH TOÁN" onPress={handlePay} />
      </View>
      {showWebView && paymentUrl ? (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebNavChange}
            startInLoadingState
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: {
    width: 45,
    height: 45,
    backgroundColor: '#ECF0F4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  methodRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  methodItem: {
    width: (width - 60) / 2,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ECF0F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  methodItemActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF',
  },
  methodText: {
    marginTop: 8,
    color: '#A0A5BA',
    fontSize: 14,
    fontWeight: '600',
  },
  methodTextActive: {
    color: colors.primary,
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  mainDisplayContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  cardDisplay: {
    backgroundColor: '#F0F5FA',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  qrContainer: {
    alignItems: 'center',
    width: '100%',
  },
  qrFrame: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrNote: {
    fontSize: 14,
    color: '#A0A5BA',
    marginBottom: 4,
  },
  qrOwner: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 4,
  },
  qrNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },
  cashContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBD2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cashText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#181C2E',
    textAlign: 'center',
    marginBottom: 12,
  },
  cashSubText: {
    fontSize: 14,
    color: '#A0A5BA',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#A0A5BA',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#181C2E',
  },
});
