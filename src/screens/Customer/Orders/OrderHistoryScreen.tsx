import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  ImageSourcePropType,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BASE_URL } from '../../../constants/config';

// --- 1. CẤU HÌNH TABS ---
const TABS = [
  { id: 'Pending', title: 'Đang xác nhận', dbStatus: ['pending'] },
  // Bạn có thể thêm 'confirmed' vào đây nếu muốn nó hiện ở tab này: dbStatus: ['pending', 'confirmed']
  { id: 'preparing', title: 'Đang xử lý', dbStatus: ['preparing', 'confirmed'] }, 
  { id: 'Delivering', title: 'Đang giao', dbStatus: ['delivering', 'shipping'] }, // Đề phòng backend trả về 'shipping'
  { id: 'Delivered', title: 'Đã giao', dbStatus: ['delivered'] },
  { id: 'Completed', title: 'Hoàn thành', dbStatus: ['completed'] },
  { id: 'Cancelled', title: 'Đã hủy', dbStatus: ['cancelled'] },
];

// --- 2. INTERFACES ---
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface RestaurantInfo {
  _id: string;
  name: string;
  avatar: string;
}

interface OrderRaw {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  restaurant: RestaurantInfo;
}

interface ProcessedOrder extends OrderRaw {
  restaurantName: string;
  restaurantImage: ImageSourcePropType;
  date: string;
  itemSummary: string;
}

interface MyOrdersData {
  myOrders: OrderRaw[];
}

// --- 3. GRAPHQL QUERY ---
const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      totalAmount
      status
      createdAt
      items {
        name
        quantity
        price
        image
      }
      restaurant {
        id
        name
        avatar
      }
    }
  }
`;

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  // State quản lý Tab đang chọn (Mặc định là Tab đầu tiên)
  const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);

  const { data, loading, error, refetch } = useQuery<MyOrdersData>(GET_MY_ORDERS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused]);

  useEffect(() => {
    if (error) {
      console.log("❌ Lỗi Fetch Orders:", error);
      console.log("❌ Chi tiết:", JSON.stringify(error, null, 2));
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      console.log("✅ Fetch thành công. Số lượng đơn:", data.myOrders.length);
      console.log("✅ Danh sách đơn:", JSON.stringify(data.myOrders, null, 2));
    }
  }, [data]);

  // --- 4. XỬ LÝ & LỌC DỮ LIỆU ---
  const filteredOrders = useMemo(() => {
    const orders = data?.myOrders || [];
    
    // Tìm tab hiện tại để lấy danh sách dbStatus cần lọc
    const currentTab = TABS.find(t => t.id === activeTabId);
    const targetStatuses = currentTab ? currentTab.dbStatus : [];

    const result: ProcessedOrder[] = [];

    orders.forEach((order) => {
      // Chỉ xử lý nếu status của đơn hàng nằm trong danh sách status của Tab hiện tại
      // Lưu ý: convert về lowercase để so sánh cho an toàn
      if (targetStatuses.includes(order.status.toLowerCase())) {
          
        const mappedOrder: ProcessedOrder = {
          ...order,
          restaurantName: order.restaurant?.name || 'Nhà hàng',
          restaurantImage: order.restaurant?.avatar 
            ? (order.restaurant.avatar.startsWith('http') 
                ? { uri: order.restaurant.avatar } 
                : { uri: `${BASE_URL}${order.restaurant.avatar}` })
            : IMAGES.pizza1,
          date: new Date(parseInt(order.createdAt)).toLocaleString(),
          itemSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
        };
        result.push(mappedOrder);
      }
    });

    // Sắp xếp đơn hàng mới nhất lên đầu
    return result.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
  }, [data, activeTabId]);


  const goBack = () => navigation.goBack();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#1E90FF';
      case 'preparing': return '#9370DB';
      case 'shipping': 
      case 'delivering': return '#FF6347';
      case 'delivered': return '#20B2AA';
      case 'completed': return '#32CD32';
      case 'cancelled': return '#FF0000';
      default: return '#888';
    }
  };

  const getStatusText = (status: string) => {
     const map: Record<string, string> = {
         pending: 'Chờ xác nhận',
         confirmed: 'Đã xác nhận',
         preparing: 'Đang chuẩn bị',
         shipping: 'Đang giao',
         delivering: 'Đang giao',
         delivered: 'Đã giao',
         completed: 'Hoàn tất',
         cancelled: 'Đã hủy'
     };
     return map[status.toLowerCase()] || status;
  }

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: ProcessedOrder }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // Nếu đơn hàng chưa hoàn tất/hủy -> Vào trang Tracking
        if (['pending', 'confirmed', 'preparing', 'shipping', 'delivering'].includes(item.status.toLowerCase())) {
             navigation.navigate('TrackOrderScreen', { orderId: item.id });
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Image source={item.restaurantImage} style={styles.restaurantImage} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Text style={styles.restaurantName}>{item.restaurantName}</Text>
             <Text style={{fontSize: 12, color: '#888'}}>#{item.id.slice(-6)}</Text>
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)} • {item.items.length} món
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <Text style={styles.itemsText} numberOfLines={2}>
          {item.itemSummary}
        </Text>
        <View style={styles.priceRow}>
           <Text style={styles.dateText}>{item.date}</Text>
           <Text style={styles.totalPrice}>${item.totalAmount}</Text>
        </View>
      </View>

      {/* Nút hành động tùy theo trạng thái */}
      {['shipping', 'delivering'].includes(item.status.toLowerCase()) && (
        <View style={styles.actionRow}>
           <TouchableOpacity style={styles.trackButton}>
              <Text style={styles.trackButtonText}>Theo dõi ngay</Text>
           </TouchableOpacity>
        </View>
      )}
      
      {item.status.toLowerCase() === 'completed' && (
         <View style={styles.actionRow}>
            <TouchableOpacity style={styles.reorderButton}>
               <Text style={styles.reorderButtonText}>Đặt lại</Text>
            </TouchableOpacity>
         </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* --- TAB HEADER SCROLLABLE --- */}
      <View style={styles.tabContainerWrapper}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContentContainer}
        >
            {TABS.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabButton, isActive && styles.activeTabButton]}
                        onPress={() => setActiveTabId(tab.id)}
                    >
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {tab.title}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
           <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Image 
                source={IMAGES.pizza1}
                style={{width: 150, height: 150, opacity: 0.5, marginBottom: 20}} 
                resizeMode="contain"
              />
              <Text style={{ color: '#888', fontSize: 16 }}>
                Không có đơn hàng nào ở mục này.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F9', paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  backButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#181C2E' },
  
  // Styles cho Scrollable Tabs
  tabContainerWrapper: {
      height: 50,
      marginBottom: 10,
  },
  tabContentContainer: {
      paddingHorizontal: 20,
      alignItems: 'center',
  },
  tabButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#EDEDED',
  },
  activeTabButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
  },
  tabText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '600',
  },
  activeTabText: {
      color: '#fff',
  },

  // Card Styles
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  restaurantImage: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#eee' },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  statusText: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  cardBody: {},
  itemsText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#A0A5BA' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  actionRow: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, alignItems: 'flex-end' },
  trackButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  trackButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  reorderButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  reorderButtonText: { color: colors.primary, fontSize: 13, fontWeight: 'bold' }
});