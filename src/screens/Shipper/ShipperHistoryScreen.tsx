import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../theme';

// --- 1. INTERFACES ---
interface Address {
    street: string;
    city: string;
}

interface UserInfo {
    name: string;
    phone: string;
}

interface RestaurantInfo {
    name: string;
    address: Address;
}

interface OrderItem {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    shippingAddress: Address;
    restaurantUser: RestaurantInfo;
    customerUser: UserInfo;
}

interface GetShipperOrdersData {
    myShipperOrders: OrderItem[];
}

// --- 2. QUERY ---
// Lưu ý: Backend cần resolver myShipperOrders trả về các đơn có shipperId = user hiện tại
const GET_SHIPPER_ORDERS = gql`
  query GetShipperOrders {
    myShippingOrders {
      id
      totalAmount
      status
      createdAt
      shippingAddress {
        street
        city
      }
      restaurantUser {
        name
        address {
            street
        }
      }
      customerUser {
        id        # <--- THÊM ID
        name
        phone
        avatar    # <--- THÊM AVATAR (nếu cần hiển thị)
      }
    }
  }
`;

interface GetShipperOrdersData {
    myShippingOrders: OrderItem[];
}
// --- 3. HELPER FUNCTIONS ---
const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        preparing: 'Chờ quán làm',
        shipping: 'Đang đi giao',
        delivered: 'Đã giao xong',
        cancelled: 'Đã hủy',
    };
    return map[status?.toLowerCase()] || status;
};

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'preparing': return '#FFA500'; // Cam
        case 'shipping': return '#1E90FF'; // Xanh dương
        case 'delivered': return '#32CD32'; // Xanh lá
        case 'cancelled': return '#FF4500'; // Đỏ
        default: return '#888';
    }
};

export default function ShipperHistoryScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    
    // Tab State: 'active' (Đang thực hiện) | 'history' (Đã xong)
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const { data, loading, refetch, error } = useQuery<GetShipperOrdersData>(GET_SHIPPER_ORDERS, {
        fetchPolicy: 'network-only',
    });

    // Auto refresh khi quay lại màn hình
    useEffect(() => {
        if (isFocused) refetch();
    }, [isFocused]);

    // --- LỌC DỮ LIỆU THEO TAB ---
    const filteredOrders = useMemo(() => {
        const orders = data?.myShippingOrders || [];
        if (activeTab === 'active') {
            // Tab Hiện tại: Lấy đơn đang làm (preparing) và đang giao (shipping)
            return orders.filter(o => ['preparing', 'shipping'].includes(o.status?.toLowerCase()));
        } else {
            // Tab Lịch sử: Lấy đơn đã giao hoặc đã hủy
            return orders.filter(o => ['delivered', 'cancelled'].includes(o.status?.toLowerCase()));
        }
    }, [data, activeTab]);

    // --- XỬ LÝ KHI ẤN VÀO ĐƠN ---
    const handlePressOrder = (item: OrderItem) => {
        const status = item.status?.toLowerCase();

        if (status === 'shipping') {
            // Nếu đang giao -> Chuyển qua màn hình theo dõi/bản đồ
            navigation.navigate('TrackOrderScreen', { orderId: item.id });
        } else if (status === 'preparing') {
            // Nếu quán đang làm -> Thông báo
            Alert.alert(
                "Đang chuẩn bị",
                "Nhà hàng đang chuẩn bị món ăn. Vui lòng đợi đến khi trạng thái chuyển sang 'Đang giao' (Shipping) để bắt đầu đi giao."
            );
        } else {
            // Các trạng thái khác (delivered/cancelled) -> Có thể xem chi tiết nếu muốn
            console.log("Xem chi tiết đơn lịch sử:", item.id);
        }
    };

    const renderItem = ({ item }: { item: OrderItem }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => handlePressOrder(item)}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={styles.rowBetween}>
                    <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
                    </View>
                </View>
                <Text style={styles.date}>{new Date(parseInt(item.createdAt)).toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            {/* Thông tin Quán */}
            <View style={styles.infoRow}>
                <View style={styles.iconWrap}>
                    <MaterialIcons name="store" size={20} color="#666" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Lấy hàng tại:</Text>
                    <Text style={styles.infoText} numberOfLines={1}>{item.restaurantUser?.name}</Text>
                    <Text style={styles.subText} numberOfLines={1}>{item.restaurantUser?.address?.street}</Text>
                </View>
            </View>

            {/* Thông tin Khách */}
            <View style={[styles.infoRow, { marginTop: 10 }]}>
                 <View style={styles.iconWrap}>
                    <FontAwesome5 name="map-marker-alt" size={18} color={colors.primary} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Giao đến:</Text>
                    <Text style={styles.infoText} numberOfLines={1}>{item.customerUser?.name} - {item.customerUser?.phone}</Text>
                    <Text style={styles.subText} numberOfLines={2}>
                        {item.shippingAddress?.street}, {item.shippingAddress?.city}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.totalLabel}>Tổng tiền thu:</Text>
                <Text style={styles.totalPrice}>{item.totalAmount?.toLocaleString()}đ</Text>
            </View>

            {/* Hint text để user biết có thể bấm vào */}
            {item.status === 'shipping' && (
                <View style={styles.actionHint}>
                    <Text style={styles.actionText}>Bấm để đi giao hàng ngay</Text>
                    <MaterialIcons name="navigate-next" size={20} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Tabs */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý đơn hàng</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'active' && styles.activeTab]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Hiện tại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Lịch sử</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            {error ? (
                 <View style={styles.center}>
                    <Text style={{color: 'red'}}>Lỗi tải dữ liệu!</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <FontAwesome5 name="clipboard-list" size={50} color="#ddd" />
                            <Text style={{ marginTop: 10, color: '#999' }}>
                                {activeTab === 'active' ? "Bạn chưa nhận đơn nào." : "Chưa có lịch sử đơn hàng."}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    
    header: { backgroundColor: '#fff', padding: 16, paddingBottom: 0, elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    
    tabContainer: { flexDirection: 'row' },
    tabBtn: { flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center' },
    activeTab: { borderBottomColor: colors.primary },
    tabText: { fontSize: 16, fontWeight: '600', color: '#888' },
    activeTabText: { color: colors.primary },

    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 15, elevation: 2 },
    cardHeader: { marginBottom: 10 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    date: { fontSize: 12, color: '#888', marginTop: 4 },
    
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    iconWrap: { width: 30, alignItems: 'center', marginRight: 8, marginTop: 2 },
    label: { fontSize: 12, color: '#aaa' },
    infoText: { fontSize: 14, fontWeight: '600', color: '#333' },
    subText: { fontSize: 13, color: '#666' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    totalLabel: { fontSize: 14, color: '#333' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: colors.primary },

    actionHint: { 
        marginTop: 12, backgroundColor: colors.primary, 
        padding: 10, borderRadius: 8, 
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center' 
    },
    actionText: { color: '#fff', fontWeight: 'bold', marginRight: 5 }
});