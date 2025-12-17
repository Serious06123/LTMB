import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// GraphQL Imports
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import RatingModal from '../../../components/RatingModal';

// Define types for the GraphQL query response
interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
  restaurant: { name: string; avatar?: string };
}

interface GetMyOrdersData {
  myOrders: Order[];
}


// 1. QUERY LẤY DỮ LIỆU THẬT
const GET_MY_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      totalAmount
      status
      createdAt
      items {
        name
        quantity
      }
      restaurant {
        name
        avatar
      }
    }
  }
`;

const TABS = [
  { id: 'Processing', title: 'Đang xử lý', dbStatus: ['pending', 'confirmed', 'preparing'] },
  { id: 'Delivering', title: 'Đang giao', dbStatus: ['delivering'] },
  { id: 'Completed', title: 'Đã giao', dbStatus: ['completed', 'delivered'] },
  { id: 'Cancelled', title: 'Đã hủy', dbStatus: ['cancelled'] },
];

const OrderHistoryScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Processing');
  const [showRating, setShowRating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // 2. GỌI API
  const { data, loading, error, refetch } = useQuery<GetMyOrdersData>(GET_MY_ORDERS, {
    pollInterval: 5000, // Tự động cập nhật mỗi 5 giây (Realtime cơ bản)
  });

  // 3. XỬ LÝ DỮ LIỆU TỪ SERVER
  const orders = data?.myOrders || [];

  // Lọc đơn hàng theo Tab
  const filteredOrders = orders.filter((order: any) => {
    const currentTab = TABS.find(t => t.id === activeTab);
    // So sánh status trong DB với danh sách status của Tab
    return currentTab?.dbStatus.includes(order.status);
  });

  const handleOpenRating = (order: any) => {
    setSelectedOrder(order);
    setShowRating(true);
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    // Mapping trạng thái sang tiếng Việt và màu sắc
    let statusColor = colors.primary;
    let statusText = item.status;
    
    // Logic hiển thị trạng thái
    if (['pending', 'confirmed', 'preparing'].includes(item.status)) {
        statusColor = '#FFA500'; statusText = 'Đang chuẩn bị';
    } else if (item.status === 'delivering') {
        statusColor = '#1E90FF'; statusText = 'Đang giao hàng';
    } else if (['completed', 'delivered'].includes(item.status)) {
        statusColor = '#28a745'; statusText = 'Giao thành công';
    } else if (item.status === 'cancelled') {
        statusColor = '#dc3545'; statusText = 'Đã hủy';
    }

    // Tạo chuỗi mô tả món ăn (Ví dụ: "2x Phở Bò, 1x Trà đá")
    const itemsDescription = item.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');

    // Format ngày tháng
    const dateStr = new Date(parseInt(item.createdAt)).toLocaleString('vi-VN');

    // Ảnh mặc định nếu quán không có ảnh
    const restaurantImage = item.restaurant?.avatar 
        ? { uri: item.restaurant.avatar } 
        : require('../../../assets/images/pizza1.png'); // Ảnh mặc định

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.restaurantName}>{item.restaurant?.name || 'Nhà hàng'}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
            <Image source={restaurantImage} style={styles.foodImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.itemsText} numberOfLines={2}>{itemsDescription}</Text>
                <Text style={styles.dateText}>{dateStr}</Text>
                <View style={styles.priceRow}>
                     <Text style={styles.itemCount}>{item.items.length} món</Text>
                     <Text style={styles.totalPrice}>
                        {item.totalAmount.toLocaleString('vi-VN')} đ
                     </Text>
                </View>
            </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Chi tiết</Text>
            </TouchableOpacity>
            
            {(item.status === 'completed' || item.status === 'delivered') ? (
                 <>
                    <TouchableOpacity 
                        style={[styles.secondaryButton, { borderColor: '#FFA500', marginLeft: 10 }]}
                        onPress={() => handleOpenRating(item)}
                    >
                        <Text style={{ color: '#FFA500', fontWeight: '600' }}>Đánh giá</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.primaryButton, {marginLeft: 10}]}>
                        <Text style={styles.primaryButtonText}>Đặt lại</Text>
                    </TouchableOpacity>
                 </>
            ) : item.status === 'cancelled' ? (
                 <TouchableOpacity style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Đặt lại</Text>
                 </TouchableOpacity>
            ) : (
                <TouchableOpacity 
                    style={styles.primaryButton} 
                    onPress={() => navigation.navigate('TrackOrder', { orderId: item.id })}
                >
                    <Text style={styles.primaryButtonText}>Theo dõi</Text>
                 </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  // Hiển thị Loading khi đang tải dữ liệu lần đầu
  if (loading && !data) {
      return (
          <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
              <ActivityIndicator size="large" color={colors.primary} />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === item.id && styles.activeTabItem
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === item.id && styles.activeTabText
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
        )}
      />

      {selectedOrder && (
        <RatingModal
            visible={showRating}
            onClose={() => setShowRating(false)}
            orderId={selectedOrder.id}
            restaurantName={selectedOrder.restaurant?.name}
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (Giữ nguyên styles như cũ)
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabItem: {
    backgroundColor: '#FFF0F0', 
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  cardBody: {
    flexDirection: 'row',
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee'
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemsText: {
    fontSize: 14,
    color: '#32343E',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#A0A5BA',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#999',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});

export default OrderHistoryScreen;