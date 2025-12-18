import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

const { width } = Dimensions.get('window');

// --- 1. CẤU HÌNH TABS TRẠNG THÁI ---
const TABS = [
    { id: 'Pending', title: 'Mới', dbStatus: ['pending'] },
    { id: 'Processing', title: 'Đang làm', dbStatus: ['confirmed', 'preparing'] },
    { id: 'Delivering', title: 'Đang giao', dbStatus: ['shipping'] },
    { id: 'Delivered', title: 'Đã giao', dbStatus: ['delivered'] },
    { id: 'Completed', title: 'Hoàn tất', dbStatus: ['completed'] },
    { id: 'Cancelled', title: 'Đã hủy', dbStatus: ['cancelled'] },
];

// --- 2. INTERFACES (ĐỊNH NGHĨA KIỂU DỮ LIỆU) ---
interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image: string;
}

interface CustomerUser {
    id: string;
    name: string;
    avatar: string | null;
    address?: {
        street: string;
        city: string;
    };
}

// Dữ liệu thô từ GraphQL trả về
interface OrderRaw {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
    customerUser: CustomerUser | null;
    shipperId?: string;
}

// Dữ liệu đã xử lý để hiển thị lên UI (thêm các field như displayDate, image...)
interface ProcessedOrder extends OrderRaw {
    customerImage: any;
    displayDate: string;
    itemSummary: string;
}

interface RestaurantOrdersData {
    myRestaurantOrders: OrderRaw[];
}

// --- 3. GRAPHQL QUERY ---
const GET_RESTAURANT_ORDERS = gql`
  query GetRestaurantOrders {
    myRestaurantOrders {
      id
      totalAmount
      status
      createdAt
      shipperId
      items {
        name
        quantity
        price
        image
      }
      customerUser {
        id
        name
        avatar
        address {
            street
            city
        }
      }
    }
  }
`;
interface UpdateOrderStatusData {
    updateOrderStatus: {
        id: string;
        status: string;
    }
}

interface UpdateOrderStatusVars {
    orderId: string;
    status: string;
}

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;
// --- 4. HELPER FUNCTIONS ---
const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
        preparing: 'Đang nấu',
        shipping: 'Đang giao',
        delivered: 'Đã đến nơi',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy'
    };
    return map[status?.toLowerCase()] || status;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    if (!isNaN(Number(dateString)) && dateString.length > 10) {
        return new Date(parseInt(dateString)).toLocaleString('vi-VN');
    }
    return new Date(dateString).toLocaleString('vi-VN');
};

export default function RestaurantDashboard() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);

    const { data, loading, error, refetch } = useQuery<RestaurantOrdersData>(GET_RESTAURANT_ORDERS, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        if (isFocused) {
            refetch();
        }
    }, [isFocused]);

    // --- XỬ LÝ & LỌC DỮ LIỆU ---
    const filteredOrders = useMemo(() => {
        const orders = data?.myRestaurantOrders || [];
        const currentTab = TABS.find(t => t.id === activeTabId);
        const targetStatuses = currentTab ? currentTab.dbStatus : [];

        // Lọc và Map dữ liệu sang kiểu ProcessedOrder
        const result: ProcessedOrder[] = orders
            .filter((order) => targetStatuses.includes(order.status?.toLowerCase()))
            .map((order) => ({
                ...order,
                customerImage: order.customerUser?.avatar
                    ? { uri: order.customerUser.avatar }
                    : IMAGES.introman1,
                displayDate: formatDate(order.createdAt),
                itemSummary: order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ') || 'Chi tiết đơn hàng',
            }));

        // Sắp xếp mới nhất lên đầu
        return result.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [data, activeTabId]);

    // --- COMPONENT: CHART ---
    const Chart = () => {
        const pathData = `M0,90 C60,80 80,30 140,50 S200,80 260,60 S340,20 400,40 L400,150 L0,150 Z`;
        const lineData = `M0,90 C60,80 80,30 140,50 S200,80 260,60 S340,20 400,40`;
        return (
            <View style={styles.chartContainer}>
                <Svg height="140" width="100%" style={{ borderRadius: 15 }}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <Path d={pathData} fill="url(#grad)" />
                    <Path d={lineData} stroke={colors.primary} strokeWidth="3" fill="none" />
                    <Circle cx="140" cy="50" r="5" fill="#fff" stroke={colors.primary} strokeWidth={2} />
                </Svg>
            </View>
        );
    };
    const [updateStatusMutation] = useMutation<UpdateOrderStatusData, UpdateOrderStatusVars>(UPDATE_ORDER_STATUS);

    // 2. Hàm xử lý khi ấn vào đơn hàng
    const handlePressOrder = (order: ProcessedOrder) => {
        const currentStatus = order.status?.toLowerCase();
        let nextStatus = '';
        let titleAlert = '';
        let messageAlert = '';

        if (currentStatus === 'pending') {
            nextStatus = 'preparing';
            titleAlert = 'Xác nhận đơn hàng';
            messageAlert = 'Chuyển trạng thái sang "Đang làm" (Preparing)?';
        } else if (currentStatus === 'preparing') {
            // --- KIỂM TRA ĐIỀU KIỆN Ở FRONTEND (UX tốt hơn) ---
            if (!order.shipperId) {
                Alert.alert(
                    "Chưa có tài xế", 
                    "Đơn hàng này chưa có Shipper nhận. Bạn chưa thể giao hàng."
                );
                return; // Dừng lại, không cho gọi API
            }

            nextStatus = 'shipping';
            titleAlert = 'Giao hàng cho Shipper';
            messageAlert = 'Đã có tài xế nhận! Xác nhận giao món cho tài xế?';
        } else {
            return;
        }

        Alert.alert(
            titleAlert,
            messageAlert,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            await updateStatusMutation({
                                variables: {
                                    orderId: order.id,
                                    status: nextStatus
                                }
                            });
                            refetch(); 
                        } catch (err) {
                            // Xử lý lỗi từ Backend trả về (ví dụ trường hợp hy hữu check ở FE ok nhưng BE fail)
                            const msg = (err as Error).message;
                            Alert.alert("Lỗi", msg);
                        }
                    },
                },
            ]
        );
    };

    // --- RENDER MỘT ĐƠN HÀNG ---
    const renderOrderItem = (item: ProcessedOrder) => (
        <TouchableOpacity
            key={item.id}
            style={styles.orderCard}
            onPress={() => handlePressOrder(item)}
        >
            <View style={styles.orderHeader}>
                <Image source={item.customerImage} style={styles.customerAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.customerName}>{item.customerUser?.name || 'Khách lẻ'}</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>#{item.id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderBody}>
                <Text style={styles.itemsText} numberOfLines={2}>
                    {item.itemSummary}
                </Text>
                <View style={styles.priceRow}>
                    <Text style={styles.dateText}>{item.displayDate}</Text>
                    <Text style={styles.totalPrice}>
                        {item.totalAmount?.toLocaleString('vi-VN')}đ
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.primary]} />}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBtn}>
                        <Feather name="menu" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.locationWrap}>
                        <Text style={styles.locationTitle}>QUẢN LÝ</Text>
                        <Text style={styles.locationText}>Nhà hàng của tôi</Text>
                    </View>
                    <Image source={IMAGES.introman3} style={styles.avatar} />
                </View>

                {/* THỐNG KÊ NHANH */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{data?.myRestaurantOrders?.length || 0}</Text>
                        <Text style={styles.statLabel}>TỔNG ĐƠN</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {(data?.myRestaurantOrders || [])
                                .reduce((sum, od) => sum + (od.status === 'completed' ? od.totalAmount : 0), 0)
                                .toLocaleString('en-US', { notation: "compact", compactDisplay: "short" })
                            }
                        </Text>
                        <Text style={styles.statLabel}>DOANH THU</Text>
                    </View>
                </View>

                {/* BIỂU ĐỒ */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Doanh thu tuần này</Text>
                            <Text style={styles.revenueAmount}>2,500,000đ</Text>
                        </View>
                    </View>
                    <Chart />
                </View>

                {/* DANH SÁCH ĐƠN HÀNG */}
                <View style={styles.sectionCardNobg}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleBlack}>Đơn hàng</Text>
                        <TouchableOpacity onPress={() => refetch()}>
                            <Text style={styles.seeAllLink}>Làm mới</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={{ marginBottom: 15 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

                    {/* Render List */}
                    {loading && !data ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                    ) : error ? (
                        <View style={styles.emptyState}>
                            <Text style={{ color: 'red' }}>Lỗi: {error.message}</Text>
                        </View>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((item) => renderOrderItem(item))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={{ color: '#888', fontStyle: 'italic' }}>
                                Không có đơn hàng nào
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    locationWrap: { alignItems: 'center' },
    locationTitle: { fontSize: 12, color: colors.primary, fontWeight: 'bold', letterSpacing: 1 },
    locationText: { fontSize: 14, color: '#666', fontWeight: '500' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { backgroundColor: '#fff', width: (width - 50) / 2, paddingVertical: 20, alignItems: 'center', borderRadius: 15, elevation: 3 },
    statNumber: { fontSize: 28, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#A0A5BA', fontWeight: '700', textTransform: 'uppercase' },
    sectionCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 3 },
    sectionCardNobg: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 14, color: '#A0A5BA', fontWeight: '500' },
    sectionTitleBlack: { fontSize: 18, color: '#181C2E', fontWeight: 'bold' },
    revenueAmount: { fontSize: 24, fontWeight: 'bold', color: '#181C2E', marginTop: 4 },
    seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '500' },
    chartContainer: { marginTop: 10 },
    tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EDEDED' },
    activeTabButton: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 14, color: '#666', fontWeight: '600' },
    activeTabText: { color: '#fff' },
    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    orderHeader: { flexDirection: 'row', alignItems: 'center' },
    customerAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eee' },
    customerName: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
    statusText: { fontSize: 13, marginTop: 4, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    orderBody: {},
    itemsText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#A0A5BA' },
    totalPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    emptyState: { alignItems: 'center', padding: 20 },
});