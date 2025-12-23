import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { colors } from '../../../theme';

// --- 1. KHAI BÁO INTERFACE ---

interface RestaurantInfo {
  name: string;
}

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  restaurantId: string;
  items: OrderItem[];
  restaurantUser?: {
    name?: string;
  };
}

interface MyOrdersData {
  myOrders: Order[];
}

// --- 2. QUERY & MUTATION ---

const GET_MY_ORDERS = gql`
  query MyOrders {
    myOrders {
      id
      restaurantId
      totalAmount
      status
      createdAt
      items {
        name
        quantity
      }
    }
  }
`;

const CUSTOMER_COMPLETE_ORDER = gql`
  mutation CustomerCompleteOrder($orderId: ID!) {
    customerCompleteOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

export default function OrderHistoryScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'Current' | 'History'>('Current');

  // Áp dụng Interface vào useQuery
  const { data, loading, refetch } = useQuery<MyOrdersData>(GET_MY_ORDERS, {
    fetchPolicy: 'network-only',
  });

  const [completeOrder] = useMutation(CUSTOMER_COMPLETE_ORDER);

  const client = useApolloClient();
  const [restaurants, setRestaurants] = useState<
    Record<string, RestaurantInfo>
  >({});

  const GET_RESTAURANT = gql`
    query GetRestaurant($id: ID!) {
      restaurant(id: $id) {
        _id
        name
      }
    }
  `;

  // Khi có orders mới, fetch thông tin các nhà hàng chưa có trong cache `restaurants`
  useEffect(() => {
    const ids = Array.from(
      new Set((data?.myOrders || []).map(o => o.restaurantId).filter(Boolean)),
    );
    const missingIds = ids.filter(rid => rid && !restaurants[rid]);
    if (missingIds.length === 0) return;

    (async () => {
      try {
        const promises = missingIds.map(rid =>
          client.query<{ restaurant: RestaurantInfo }>({
            query: GET_RESTAURANT,
            variables: { id: rid },
            fetchPolicy: 'network-only',
          }),
        );

        const results = await Promise.all(promises);
        const found: Record<string, RestaurantInfo> = {};
        results.forEach((resp, idx) => {
          const rid = missingIds[idx];
          const r = resp?.data?.restaurant;
          if (r && rid) {
            found[rid] = { name: r.name || '' };
          }
        });

        if (Object.keys(found).length > 0) {
          setRestaurants(prev => ({ ...prev, ...found }));
        }
      } catch (e) {
        console.log('Fetch restaurants error', e);
      }
    })();
  }, [data, restaurants]);

  // Gộp dữ liệu restaurant vào từng order để dễ render và xử lý
  const enrichedOrders = useMemo(() => {
    const orders = data?.myOrders || [];
    return orders.map(o => {
      const rid = o.restaurantId;
      const r = rid ? restaurants[rid] : undefined;
      if (r) {
        return { ...o, restaurantUser: { name: r.name } };
      }
      return o;
    });
  }, [data, restaurants]);

  useEffect(() => {
    if (isFocused) refetch();
  }, [isFocused]);

  // Lọc đơn hàng theo Tab
  const filteredData = useMemo(() => {
    const orders = enrichedOrders || [];
    if (activeTab === 'Current') {
      return orders.filter(o =>
        ['pending', 'preparing', 'shipping', 'delivered'].includes(
          o.status?.toLowerCase(),
        ),
      );
    } else {
      return orders.filter(o =>
        ['completed', 'cancelled'].includes(o.status?.toLowerCase()),
      );
    }
  }, [data, activeTab]);

  const handleComplete = (orderId: string) => {
    Alert.alert('Xác nhận', 'Bạn đã nhận được hàng và muốn hoàn tất đơn này?', [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await completeOrder({ variables: { orderId } });
            Alert.alert('Thành công', 'Cảm ơn bạn đã mua hàng!');
            refetch();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  // Áp dụng Interface cho item
  const renderItem = ({ item }: { item: Order }) => {
    const status = item.status?.toLowerCase();
    const restInfo = restaurants[item.restaurantId];
    console.log('Rendering order item with status:', item);
    // Màu sắc trạng thái
    let statusColor = '#888';
    let statusText = item.status;

    switch (status) {
      case 'pending':
        statusColor = 'orange';
        statusText = 'Chờ xác nhận';
        break;
      case 'preparing':
        statusColor = '#9370DB';
        statusText = 'Đang chuẩn bị';
        break;
      case 'shipping':
        statusColor = '#1E90FF';
        statusText = 'Đang giao';
        break;
      case 'delivered':
        statusColor = '#20B2AA';
        statusText = 'Đã đến nơi';
        break;
      case 'completed':
        statusColor = 'green';
        statusText = 'Hoàn tất';
        break;
      case 'cancelled':
        statusColor = 'red';
        statusText = 'Đã hủy';
        break;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.restName}>{restInfo?.name || 'Nhà hàng'}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        <Text style={styles.date}>
          {new Date(parseInt(item.createdAt)).toLocaleString()}
        </Text>

        <View style={styles.divider} />

        <View>
          {item.items.map((food, idx) => (
            <Text key={idx} style={styles.foodText}>
              {food.quantity}x {food.name}
            </Text>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>
            {item.totalAmount?.toLocaleString()}đ
          </Text>
        </View>

        {/* NÚT HOÀN TẤT */}
        {status === 'delivered' && (
          <TouchableOpacity
            style={styles.btnComplete}
            onPress={() => handleComplete(item.id)}
          >
            <Text style={styles.btnCompleteText}>ĐÃ NHẬN ĐƯỢC HÀNG</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Current' && styles.activeTab]}
          onPress={() => setActiveTab('Current')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Current' && styles.activeTabText,
            ]}
          >
            Đang xử lý
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'History' && styles.activeTab]}
          onPress={() => setActiveTab('History')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'History' && styles.activeTabText,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
            Không có đơn hàng nào
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#181C2E' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: { marginRight: 20, paddingBottom: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: '#9DA8C5', fontWeight: '600' },
  activeTabText: { color: colors.primary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  restName: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  status: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, color: '#A0A5BA', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#EDEDED', marginVertical: 10 },
  foodText: { fontSize: 14, color: '#181C2E', marginBottom: 5 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: '#A0A5BA' },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: colors.primary },

  btnComplete: {
    marginTop: 15,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCompleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
