import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import { BASE_URL } from '../../../constants/config';

// --- APOLLO CLIENT ---
import { gql } from '@apollo/client';

import { useQuery, useApolloClient } from '@apollo/client/react';

// 1. ĐỊNH NGHĨA INTERFACE (TYPESCRIPT)
interface RestaurantInfo {
  id: string;
  name: string;
  avatar: string;
}

interface OrderItem {
  id: string;
  status: string;
  createdAt: string;
  shipperId?: string;
  restaurantId?: string;
  restaurant?: RestaurantInfo;
}

interface MyOrdersData {
  myOrders: OrderItem[];
}

// 2. QUERY LẤY DANH SÁCH ĐƠN HÀNG (DÙNG LÀM DANH SÁCH CHAT)
const GET_CHAT_ORDERS = gql`
  query GetChatOrders {
    myOrders {
      id
      status
      createdAt
      shipperId
      restaurantId
    }
  }
`;

export default function MessageListScreen() {
  const navigation = useNavigation<any>();

  const client = useApolloClient();
  const [restaurants, setRestaurants] = React.useState<
    Record<string, { name: string; avatar?: string }>
  >({});

  // 3. GỌI API LẤY DỮ LIỆU
  const { data, loading, error, refetch } = useQuery<MyOrdersData>(
    GET_CHAT_ORDERS,
    {
      fetchPolicy: 'network-only', // Luôn lấy mới để cập nhật trạng thái đơn
      pollInterval: 10000, // Tự động cập nhật mỗi 10s (để xem có đơn mới ko)
    },
  );

  const orders = data?.myOrders || [];

  // Merge fetched restaurant info into each order for display/navigation
  const enrichedOrders = React.useMemo(() => {
    return orders.map(o => {
      const rid =
        o.restaurantId ||
        (o.restaurant && (o.restaurant.id || (o.restaurant as any)._id)) ||
        null;
      const cached = rid ? restaurants[rid] : undefined;
      if (cached) {
        return {
          ...o,
          restaurant: {
            id: rid,
            name: cached.name,
            avatar: cached.avatar ?? '', // Ensure avatar is always a string
          },
        };
      }
      // Ensure avatar is always a string if restaurant exists
      if (o.restaurant) {
        return {
          ...o,
          restaurant: {
            ...o.restaurant,
            avatar: o.restaurant.avatar ?? '',
          },
        };
      }
      return o;
    });
  }, [orders, restaurants]);

  const GET_RESTAURANT = gql`
    query GetRestaurant($id: ID!) {
      restaurant(id: $id) {
        _id
        name
        image
      }
    }
  `;

  // Fetch missing restaurant info (name + image) for orders
  useEffect(() => {
    const ids = Array.from(
      new Set(orders.map(o => o.restaurantId).filter(Boolean)),
    );
    const missingIds = ids.filter(id => id && !restaurants[id]);
    if (missingIds.length === 0) return;

    (async () => {
      try {
        const promises = missingIds.map(id =>
          client.query<{
            restaurant: { _id: string; name: string; image?: string };
          }>({
            query: GET_RESTAURANT,
            variables: { id },
            fetchPolicy: 'network-only',
          }),
        );
        const results = await Promise.all(promises);
        const found: Record<string, { name: string; avatar?: string }> = {};
        results.forEach((res, idx) => {
          const id = missingIds[idx];
          const r = res?.data?.restaurant;
          if (r && id) {
            found[id] = { name: r.name || '', avatar: r.image || '' };
          }
        });
        if (Object.keys(found).length)
          setRestaurants(prev => ({ ...prev, ...found }));
      } catch (err) {
        console.log('Fetch restaurants error', err);
      }
    })();
  }, [orders, restaurants]);

  const goBack = () => navigation.goBack();

  // Hàm điều hướng tới ChatScreen
  const goToChat = (item: OrderItem) => {
    // Logic xác định người nhận:
    // Nếu đơn đang giao (shipping) hoặc đã giao (delivered) và có shipperId -> Chat với Shipper
    // Ngược lại -> Chat với Nhà hàng
    const isShipperChat =
      item.shipperId &&
      ['shipping', 'delivered', 'completed'].includes(item.status);

    const receiverId = isShipperChat
      ? item.shipperId
      : item.restaurantId || item.restaurant?.id;
    const receiverName = isShipperChat
      ? 'Tài xế Baemin'
      : item.restaurant?.name;

    navigation.navigate('ChatScreen', {
      orderId: item.id,
      receiverId: receiverId,
      receiverName: receiverName,
    });
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Chờ xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy',
    };
    return map[status] || status;
  };

  const renderItem = ({ item }: { item: OrderItem }) => {
    const rid =
      item.restaurantId || (item.restaurant && item.restaurant.id) || null;
    const cached = rid ? restaurants[rid] : undefined;
    // Xử lý ảnh đại diện (Ưu tiên ảnh nhà hàng)
    let avatarSource: any = IMAGES.pizza1; // Mặc định

    // Nếu đang chat với shipper (theo logic hiển thị) thì hiện icon shipper
    if (item.shipperId && ['shipping', 'delivered'].includes(item.status)) {
      avatarSource = IMAGES.shipperIcon || IMAGES.shipper; // Icon shipper
    } else if (cached?.avatar || item.restaurant?.avatar) {
      const avatar = cached?.avatar || item.restaurant?.avatar;
      const uri =
        avatar && avatar.startsWith && avatar.startsWith('http')
          ? avatar
          : `${BASE_URL}${avatar}`;
      avatarSource = { uri };
    }

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => goToChat(item)}>
        <Image source={avatarSource} style={styles.avatar} />

        <View style={styles.contentContainer}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {cached?.name || item.restaurant?.name || 'Nhà hàng'}
            </Text>
            <Text style={styles.time}>
              {new Date(parseInt(item.createdAt)).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.rowBottom}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              Đơn hàng #{item.id.slice(-6)} - {getStatusLabel(item.status)}
            </Text>
            {/* Indicator trạng thái đơn hàng (Màu sắc) */}
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    item.status === 'cancelled'
                      ? 'red'
                      : item.status === 'completed'
                      ? 'green'
                      : colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* CONTENT */}
      {loading && !orders.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={enrichedOrders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={{ color: '#888', marginTop: 10 }}>
                Chưa có cuộc trò chuyện nào
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#A0A5BA',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#A0A5BA',
    flex: 1,
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
