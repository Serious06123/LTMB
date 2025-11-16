// Trong file: src/screens/Cart/CartScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import PrimaryButton from '../../components/button/PrimaryButton';

// Định nghĩa kiểu dữ liệu cho một món hàng trong giỏ
interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  image: any; // Dùng 'any' cho require(), hoặc 'string' nếu dùng URI
  quantity: number;
}

// Dữ liệu giả lập dựa trên hình ảnh của bạn
const DUMMY_DATA: CartItem[] = [
  {
    id: '1',
    name: 'Pizza Calzone European',
    price: 32, // Giá gốc cho 1 cái
    size: '14"',
    image: require('../../assets/images/pizza1.png'), // Bạn cần thêm ảnh này vào
    quantity: 2,
  },
  {
    id: '2',
    name: 'Pizza Calzone European',
    price: 32,
    size: '14"',
    image: require('../../assets/images/pizza2.png'), // Bạn cần thêm ảnh này vào
    quantity: 1,
  },
];

// Component nhỏ cho bộ đếm số lượng
const QuantityStepper = ({ value, onDecrease, onIncrease }: { value: number, onDecrease: () => void, onIncrease: () => void }) => (
  <View style={styles.stepperContainer}>
    <TouchableOpacity onPress={onDecrease} style={styles.stepperButton}>
      <Text style={styles.stepperText}>-</Text>
    </TouchableOpacity>
    <Text style={styles.stepperValue}>{value}</Text>
    <TouchableOpacity onPress={onIncrease} style={styles.stepperButton}>
      <Text style={styles.stepperText}>+</Text>
    </TouchableOpacity>
  </View>
);

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState<CartItem[]>(DUMMY_DATA);

  // Hàm này sẽ tính tổng tiền
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Hàm xử lý tăng/giảm số lượng (chưa nối logic)
  const handleDecrease = (id: string) => {
    console.log('Giảm số lượng cho:', id);
    // Logic cập nhật state...
  };

  const handleIncrease = (id: string) => {
    console.log('Tăng số lượng cho:', id);
    // Logic cập nhật state...
  };
  
  // Hàm xử lý khi nhấn "Place Order"
  const handlePlaceOrder = () => {
    console.log('Đặt hàng với tổng tiền:', calculateTotal());
    // Logic gọi API...
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity>
          <Text style={styles.doneButton}>DONE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 2. Danh sách sản phẩm */}
        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image source={item.image} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price * item.quantity}</Text>
              <Text style={styles.itemSize}>{item.size}</Text>
            </View>
            <View style={styles.itemControls}>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteText}>×</Text>
              </TouchableOpacity>
              <QuantityStepper 
                value={item.quantity}
                onDecrease={() => handleDecrease(item.id)}
                onIncrease={() => handleIncrease(item.id)}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 3. Phần tóm tắt (dính ở dưới) */}
      <View style={styles.summaryContainer}>
        {/* Địa chỉ giao hàng */}
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>DELIVERY ADDRESS</Text>
          <TouchableOpacity>
            <Text style={styles.editButton}>EDIT</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>2118 Thornridge Cir. Syracuse</Text>
        </View>

        {/* Tổng tiền */}
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>TOTAL:</Text>
          <Text style={styles.totalPrice}>${calculateTotal()}</Text>
          <TouchableOpacity>
            <Text style={styles.breakdownText}>Breakdown {'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Nút Đặt hàng */}
        <PrimaryButton 
          title="PLACE ORDER"
          onPress={handlePlaceOrder}
          style={{ marginTop: 24 }} // Ghi đè style nếu cần
        />
      </View>
    </SafeAreaView>
  );
}

// 4. StyleSheet
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1222', // Màu nền tối
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  doneButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Đảm bảo không bị che bởi phần tóm tắt
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2235', // Màu thẻ tối hơn
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSize: {
    color: '#8A8E9B', // Màu xám
    fontSize: 14,
  },
  itemControls: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepperValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  summaryContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32, // Thêm padding cho an toàn
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#8A8E9B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressBox: {
    backgroundColor: '#F3F4F6', // Màu xám nhạt
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  addressText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '500',
  },
  totalPrice: {
    color: colors.black,
    fontSize: 32,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  breakdownText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});