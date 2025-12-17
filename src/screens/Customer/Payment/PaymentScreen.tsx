import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../../../theme'; 
import PrimaryButton from '../../../components/button/PrimaryButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- 1. DEFINITIONS ---

type PaymentMethod = 'cash' | 'qr';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: any;
}

interface ShopGroup {
  shopId: string;
  shopName: string;
  items: CartItem[];
}

type PaymentScreenRouteParams = {
  Payment: {
    totalAmount: number;
    selectedShops: ShopGroup[];
  };
};

interface CreateOrderInput {
  restaurantId: string;
  shipperId: string | null;
  items: {
    foodId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
}

// --- 2. GRAPHQL TYPES (FIX LỖI HERE) ---

// Định nghĩa kiểu dữ liệu trả về của Mutation
interface CreateOrderData {
  createOrder: {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
}

// Định nghĩa kiểu biến truyền vào
interface CreateOrderVars {
  input: CreateOrderInput;
}

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

// --- 3. COMPONENT ---

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PaymentScreenRouteParams, 'Payment'>>();
  
  const { totalAmount, selectedShops } = route.params || {
    totalAmount: 0,
    selectedShops: [],
  };

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qr');

  // Truyền Generic Type vào useMutation để TS hiểu data trả về
  const [createOrder, { loading: creating }] = useMutation<CreateOrderData, CreateOrderVars>(CREATE_ORDER);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handlePay = async () => {
    if (!selectedShops || selectedShops.length === 0) {
      Alert.alert("Lỗi", "Không có sản phẩm nào để thanh toán");
      return;
    }

    try {
      const targetShop = selectedShops[0];
      const items = targetShop.items || [];
      const restaurantId = targetShop.shopId;

      const inputPayload: CreateOrderInput = {
        restaurantId,
        shipperId: null,
        items: items.map((i) => ({
          foodId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: (typeof i.image === 'string') ? i.image : (i.image?.uri || ''),
        })),
        totalAmount: totalAmount || 0,
        paymentMethod: selectedMethod === 'qr' ? 'ONLINE' : 'COD',
      };

      // Gọi API
      const { data } = await createOrder({ variables: { input: inputPayload } });
      
      // Bây giờ TS đã hiểu data có property createOrder
      const orderId = data?.createOrder?.id;

      Alert.alert(
        'Thanh toán thành công',
        `Đơn hàng đã được tạo và đang chờ Shipper nhận.\nMã đơn: ${orderId?.slice(-6).toUpperCase()}`,
        [
          {
            text: 'Về trang chủ',
            onPress: () => navigation.navigate('CustomerTabs'),
            style: 'cancel'
          },
          {
            text: 'Theo dõi đơn hàng',
            onPress: () => {
                // 'CustomerTabs' là tên Stack chứa các Tab (trong navigation.tsx)
                // 'History' là tên Tab bạn đặt trong CustomerTabs.tsx (kiểm tra lại tên chính xác nhé)
                navigation.navigate('CustomerTabs', { 
                    screen: 'HistoryTab' 
                });
            },
          },
        ],
      );
    } catch (err: any) {
      console.error('CreateOrder Failed:', err);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng: ' + err.message);
    }
  };

  const renderMethodOption = (id: PaymentMethod, title: string, iconName: string) => {
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
        <Icon name={iconName} size={28} color={isSelected ? colors.primary : '#A0A5BA'} />
        <Text style={[styles.methodText, isSelected && styles.methodTextActive]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrowleft" size={24} color="#181C2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.methodRow}>
          {renderMethodOption('qr', 'Mã QR', 'qrcode')}
          {renderMethodOption('cash', 'Tiền mặt', 'wallet')}
        </View>

        <View style={styles.mainDisplayContainer}>
          <Text style={styles.sectionTitle}>
            {selectedMethod === 'qr' ? 'Quét mã để thanh toán' : 'Thanh toán khi nhận hàng'}
          </Text>

          <View style={styles.cardDisplay}>
            {selectedMethod === 'qr' ? (
              <View style={styles.qrContainer}>
                <View style={styles.qrFrame}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ThanhToan_${totalAmount}`,
                    }}
                    style={styles.qrImage}
                  />
                </View>
                <Text style={styles.qrNote}>Ngân hàng MB Bank</Text>
                <Text style={styles.qrOwner}>NGUYEN VAN A</Text>
                <Text style={styles.qrNumber}>1234 5678 9999</Text>
                <Text style={{ color: colors.primary, marginTop: 5, fontWeight: 'bold' }}>
                  Số tiền: {formatCurrency(totalAmount)}
                </Text>
              </View>
            ) : (
              <View style={styles.cashContainer}>
                <View style={styles.iconCircle}>
                  <Icon name="wallet" size={60} color={colors.primary} />
                </View>
                <Text style={styles.cashText}>
                  Shipper sẽ thu <Text style={{ fontWeight: 'bold', color: colors.primary }}>{formatCurrency(totalAmount)}</Text> tiền mặt khi giao hàng.
                </Text>
                <Text style={styles.cashSubText}>
                  Vui lòng chuẩn bị tiền lẻ để thanh toán nhanh hơn.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        {/* Sử dụng PrimaryButton đã fix props */}
        <PrimaryButton 
          title={creating ? "ĐANG XỬ LÝ..." : "XÁC NHẬN THANH TOÁN"} 
          onPress={handlePay} 
          disabled={creating}
          loading={creating} // Có thể dùng thêm prop loading nếu muốn hiển thị spinner
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 },
  backBtn: { width: 45, height: 45, backgroundColor: '#ECF0F4', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#181C2E' },
  methodRow: { flexDirection: 'row', paddingHorizontal: 24, justifyContent: 'space-between', marginBottom: 30 },
  methodItem: { width: (width - 60) / 2, height: 80, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ECF0F4', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  methodItemActive: { borderColor: colors.primary, backgroundColor: '#FFF' },
  methodText: { marginTop: 8, color: '#A0A5BA', fontSize: 14, fontWeight: '600' },
  methodTextActive: { color: colors.primary },
  checkIcon: { position: 'absolute', top: 5, right: 5 },
  mainDisplayContainer: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#181C2E', marginBottom: 16, textTransform: 'uppercase' },
  cardDisplay: { backgroundColor: '#F0F5FA', borderRadius: 30, padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  qrContainer: { alignItems: 'center', width: '100%' },
  qrFrame: { padding: 16, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  qrImage: { width: 180, height: 180 },
  qrNote: { fontSize: 14, color: '#A0A5BA', marginBottom: 4 },
  qrOwner: { fontSize: 18, fontWeight: 'bold', color: '#181C2E', marginBottom: 4 },
  qrNumber: { fontSize: 20, fontWeight: 'bold', color: colors.primary, letterSpacing: 1 },
  cashContainer: { alignItems: 'center', paddingHorizontal: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEBD2', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  cashText: { fontSize: 16, fontWeight: '600', color: '#181C2E', textAlign: 'center', marginBottom: 12 },
  cashSubText: { fontSize: 14, color: '#A0A5BA', textAlign: 'center' },
  footer: { padding: 24, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  totalLabel: { fontSize: 14, color: '#A0A5BA', marginBottom: 4, fontWeight: 'bold' },
  totalAmount: { fontSize: 30, fontWeight: 'bold', color: '#181C2E' },
});