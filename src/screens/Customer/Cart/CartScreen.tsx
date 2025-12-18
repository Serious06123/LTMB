import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery , useMutation} from '@apollo/client/react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Thêm icon quán
import { colors } from '../../../theme';

// --- 1. INTERFACE ---
interface Restaurant {
  id: string;
  name: string;
  address?: { street: string };
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
  restaurantId: Restaurant | null; // Có thể null nếu cart rỗng
  items: CartItem[];
  totalAmount: number;
}

interface MyCartData {
  myCart: Cart;
}

// --- 2. QUERY ---
const GET_MY_CART = gql`
  query GetMyCart {
    myCart {
      _id
      totalAmount
      restaurantId {
        id
        name
        address {
            street
        }
      }
      items {
        foodId
        name
        price
        quantity
        image
      }
    }
  }
`;

// (Giữ nguyên các Mutation Update/Clear cart cũ của bạn...)

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { data, loading, refetch } = useQuery<MyCartData>(GET_MY_CART, { fetchPolicy: 'network-only' });

  useEffect(() => {
    if (isFocused) refetch();
  }, [isFocused]);

  // ... (Các hàm xử lý tăng giảm số lượng giữ nguyên)

  const cart = data?.myCart;

  if (!cart || cart.items.length === 0) {
    return (
        <View style={styles.center}>
            <Text>Giỏ hàng trống</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* --- HIỂN THỊ TÊN NHÀ HÀNG --- */}
      {cart.restaurantId && (
        <View style={styles.restaurantInfo}>
            <View style={styles.storeIcon}>
                <MaterialIcons name="store" size={24} color={colors.primary} />
            </View>
            <View>
                <Text style={styles.restaurantName}>{cart.restaurantId.name}</Text>
                <Text style={styles.restaurantAddress}>
                    {cart.restaurantId.address?.street || 'Địa chỉ quán'}
                </Text>
            </View>
        </View>
      )}

      {/* List Món ăn */}
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.foodId}
        renderItem={({ item }) => (
           // ... (Code render item giữ nguyên của bạn)
           <View style={{padding: 10}}><Text>{item.name}</Text></View> 
        )}
      />

      {/* Footer Thanh toán */}
      {/* ... */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  // Style cho phần tên quán
  restaurantInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      margin: 16,
      marginTop: 10,
      padding: 15,
      borderRadius: 12,
      elevation: 2
  },
  storeIcon: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0F0',
      alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  restaurantAddress: { fontSize: 12, color: '#666' }
});