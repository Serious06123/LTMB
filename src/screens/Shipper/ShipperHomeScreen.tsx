import React, { useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Alert, 
    RefreshControl,
    Image 
} from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// --- 1. INTERFACES ---
interface Address {
    street: string;
    city: string;
}

interface UserInfo {
    name: string;
    address: Address; // Địa chỉ khách/quán
}

interface RestaurantInfo {
    name: string;
    address: Address;
    image?: string;
}

interface OrderItem {
    id: string;
    totalAmount: number;
    status: string;
    shippingAddress: Address; // Địa chỉ giao hàng của đơn (nếu có riêng)
    restaurantUser: RestaurantInfo; // Thông tin quán (lấy từ resolver map hoặc populate)
    customerUser: UserInfo;
    items: { name: string; quantity: number }[];
}

interface GetAvailableOrdersData {
    getRunningOrders: OrderItem[];
}

// --- 2. QUERY & MUTATION ---
const GET_AVAILABLE_ORDERS = gql`
  query GetRunningOrders {
    getRunningOrders {
      id
      totalAmount
      status
      # Lấy địa chỉ giao hàng
      shippingAddress {
        street
        city
      }
      # Lấy thông tin quán (Giả sử BE trả về restaurantUser hoặc restaurantId populate)
      restaurantUser {
        name
        address {
            street
        }
      }
      items {
        name
        quantity
      }
    }
  }
`;

const SHIPPER_ACCEPT_ORDER = gql`
  mutation ShipperAcceptOrder($orderId: ID!) {
    shipperAcceptOrder(orderId: $orderId) {
      id
      status
      shipperId
    }
  }
`;

export default function ShipperHomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  // Query danh sách đơn chưa có người nhận
  const { data, loading, refetch, error } = useQuery<GetAvailableOrdersData>(GET_AVAILABLE_ORDERS, { 
      fetchPolicy: 'network-only' 
  });

  const [acceptOrder, { loading: accepting }] = useMutation(SHIPPER_ACCEPT_ORDER);

  // Auto refresh khi quay lại màn hình này
  useEffect(() => {
    if (isFocused) refetch();
  }, [isFocused]);

  const handleAcceptOrder = (orderId: string) => {
    Alert.alert("Xác nhận", "Bạn chắc chắn muốn nhận đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Nhận đơn",
        onPress: async () => {
          try {
            await acceptOrder({ variables: { orderId } });
            Alert.alert("Thành công", "Đã nhận đơn! Vui lòng kiểm tra tab Lịch Sử.");
            refetch(); // Load lại danh sách để đơn vừa nhận biến mất
          } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể nhận đơn");
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.card}>
      {/* Header Card: Tên Quán */}
      <View style={styles.cardHeader}>
         <View style={styles.iconRestaurant}>
            <MaterialIcons name="store" size={24} color="#fff" />
         </View>
         <View style={{flex: 1, marginLeft: 10}}>
             <Text style={styles.restaurantName} numberOfLines={1}>
                {item.restaurantUser?.name || 'Nhà hàng'}
             </Text>
             <Text style={styles.restaurantAddress} numberOfLines={1}>
                {item.restaurantUser?.address?.street || 'Đang cập nhật'}
             </Text>
         </View>
         <Text style={styles.price}>{item.totalAmount?.toLocaleString()}đ</Text>
      </View>

      <View style={styles.divider} />

      {/* Body: Địa chỉ giao */}
      <View style={styles.bodyRow}>
          <FontAwesome5 name="map-marker-alt" size={16} color={colors.primary} style={{width: 20}} />
          <View style={{flex: 1}}>
              <Text style={styles.label}>Giao đến:</Text>
              <Text style={styles.addressText}>
                  {item.shippingAddress?.street}, {item.shippingAddress?.city}
              </Text>
          </View>
      </View>

      {/* Footer: Nút nhận */}
      <TouchableOpacity 
        style={styles.btnAccept} 
        onPress={() => handleAcceptOrder(item.id)}
        disabled={accepting}
      >
        <Text style={styles.btnText}>NHẬN ĐƠN NGAY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Săn đơn hàng</Text>
          <Text style={styles.headerSubtitle}>Các đơn hàng đang chờ tài xế</Text>
      </View>

      {error ? (
          <View style={styles.center}>
              <Text style={{color: 'red'}}>Lỗi tải dữ liệu!</Text>
              <TouchableOpacity onPress={() => refetch()}><Text style={{color: 'blue'}}>Thử lại</Text></TouchableOpacity>
          </View>
      ) : (
          <FlatList
            data={data?.getRunningOrders || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.primary]} />}
            ListEmptyComponent={
                <View style={styles.center}>
                    <MaterialIcons name="delivery-dining" size={60} color="#ccc" />
                    <Text style={{textAlign: 'center', marginTop: 10, color: '#888'}}>
                        Hiện chưa có đơn hàng nào cần giao.
                    </Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  header: { marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#181C2E' },
  headerSubtitle: { fontSize: 14, color: '#A0A5BA' },
  
  card: { 
      backgroundColor: '#FFF', 
      borderRadius: 16, 
      marginBottom: 16, 
      padding: 16,
      elevation: 3,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconRestaurant: { 
      width: 40, height: 40, borderRadius: 20, 
      backgroundColor: '#FF7622', alignItems: 'center', justifyContent: 'center' 
  },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  restaurantAddress: { fontSize: 12, color: '#A0A5BA' },
  price: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  
  divider: { height: 1, backgroundColor: '#F0F5FA', marginVertical: 10 },
  
  bodyRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  label: { fontSize: 12, color: '#A0A5BA', marginBottom: 2 },
  addressText: { fontSize: 14, color: '#181C2E', fontWeight: '500' },
  
  btnAccept: { 
      backgroundColor: colors.primary, 
      paddingVertical: 12, 
      borderRadius: 12, 
      alignItems: 'center' 
  },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' }
});