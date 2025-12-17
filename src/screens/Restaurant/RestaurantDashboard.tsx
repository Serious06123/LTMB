import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';
import { BASE_URL } from '../../constants/config';

const { width } = Dimensions.get('window');

// --- 1. CẤU HÌNH TABS (Giống OrderHistoryScreen) ---
const TABS = [
    { id: 'Pending', title: 'Mới', dbStatus: ['pending'] },
    { id: 'Processing', title: 'Đang làm', dbStatus: ['confirmed', 'preparing'] },
    { id: 'Delivering', title: 'Đang giao', dbStatus: ['shipping', 'delivering'] },
    { id: 'Completed', title: 'Hoàn tất', dbStatus: ['completed'] },
    { id: 'Cancelled', title: 'Đã hủy', dbStatus: ['cancelled'] },
];

// --- 2. INTERFACES ---
interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image: string;
}

interface CustomerInfo {
    id: string;
    name: string;
    avatar: string;
    address?: {
        street: string;
        city: string;
    }
}

interface OrderRaw {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
    customerUser: CustomerInfo; // Ở Dashboard nhà hàng, ta quan tâm ai là người mua
}

interface ProcessedOrder extends OrderRaw {
    customerName: string;
    customerImage: any;
    date: string;
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

export default function RestaurantDashboard() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);

    // Fetch dữ liệu
    const { data, loading, error, refetch } = useQuery<RestaurantOrdersData>(GET_RESTAURANT_ORDERS, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        if (isFocused) {
            refetch();
        }
    }, [isFocused]);

    // --- 4. XỬ LÝ & LỌC DỮ LIỆU ---
    const filteredOrders = useMemo(() => {
        const orders = data?.myRestaurantOrders || [];

        const currentTab = TABS.find(t => t.id === activeTabId);
        const targetStatuses = currentTab ? currentTab.dbStatus : [];

        const result: ProcessedOrder[] = [];

        orders.forEach((order) => {
            if (targetStatuses.includes(order.status.toLowerCase())) {
                const mappedOrder: ProcessedOrder = {
                    ...order,
                    customerName: order.customerUser?.name || 'Khách hàng',
                    customerImage: order.customerUser?.avatar
                        ? (order.customerUser.avatar.startsWith('http')
                            ? { uri: order.customerUser.avatar }
                            : { uri: `${BASE_URL}${order.customerUser.avatar}` })
                        : IMAGES.introman1, // Avatar mặc định nếu null
                    date: new Date(parseInt(order.createdAt)).toLocaleString(),
                    itemSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
                };
                result.push(mappedOrder);
            }
        });

        // Sắp xếp đơn mới nhất lên đầu
        return result.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
    }, [data, activeTabId]);

    // Helper functions cho UI
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
            confirmed: 'Đã nhận đơn',
            preparing: 'Đang nấu',
            shipping: 'Đang giao',
            delivering: 'Đang giao',
            delivered: 'Đã giao',
            completed: 'Hoàn tất',
            cancelled: 'Đã hủy'
        };
        return map[status.toLowerCase()] || status;
    };

    // --- CHART COMPONENT ---
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
                <View style={[styles.tooltip, { left: 110, top: 10 }]}>
                    <Text style={styles.tooltipText}>$500</Text>
                    <View style={styles.tooltipArrow} />
                </View>
                <View style={styles.chartLabels}>
                    {['10AM', '11AM', '12PM', '01PM', '02PM', '03PM', '04PM'].map((label, index) => (
                        <Text key={index} style={styles.chartLabelText}>{label}</Text>
                    ))}
                </View>
            </View>
        );
    };

    // --- RENDER ORDER ITEM ---
    const renderOrderItem = ({ item }: { item: ProcessedOrder }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {
                // Điều hướng tới chi tiết đơn (nếu có) hoặc trang RunningOrders
                // Ở đây ta tạm thời log ra id
                console.log("View Order:", item.id);
            }}
        >
            <View style={styles.orderHeader}>
                <Image source={item.customerImage} style={styles.customerAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.customerName}>{item.customerName}</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>#{item.id.slice(-6)}</Text>
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
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Text style={styles.totalPrice}>${item.totalAmount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            >
                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBtn}>
                        <Feather name="menu" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.locationWrap}>
                        <Text style={styles.locationTitle}>DASHBOARD</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationText}>Quản lý nhà hàng</Text>
                        </View>
                    </View>
                    <Image source={require('../../assets/images/introman3.png')} style={styles.avatar} />
                </View>

                {/* --- THỐNG KÊ NHANH --- */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('RunningOrders' as never)}
                    >
                        <Text style={styles.statNumber}>{data?.myRestaurantOrders.length || 0}</Text>
                        <Text style={styles.statLabel}>TỔNG ĐƠN</Text>
                    </TouchableOpacity>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>$2.2k</Text>
                        <Text style={styles.statLabel}>DOANH THU</Text>
                    </View>
                </View>

                {/* --- BIỂU ĐỒ --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Doanh thu tuần này</Text>
                            <Text style={styles.revenueAmount}>$2,241</Text>
                        </View>
                        <View style={styles.filterRow}>
                            <TouchableOpacity style={styles.dropdownSmall}>
                                <Text style={styles.dropdownText}>Daily</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Chart />
                </View>

                {/* --- LỊCH SỬ ĐƠN HÀNG (MỚI THÊM) --- */}
                <View style={styles.sectionCardNobg}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleBlack}>Quản lý đơn hàng</Text>
                        <TouchableOpacity onPress={() => console.log('See all')}>
                            <Text style={styles.seeAllLink}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs ScrollView */}
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

                    {/* Danh sách đơn hàng */}
                    {loading ? (
                         <ActivityIndicator size="small" color={colors.primary} />
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map(item => (
                            <View key={item.id}>
                                {renderOrderItem({ item })}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={{ color: '#888' }}>Không có đơn hàng ở trạng thái này</Text>
                        </View>
                    )}
                </View>
                
                {/* Padding Bottom */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    locationWrap: { alignItems: 'center' },
    locationTitle: { fontSize: 12, color: colors.primary, fontWeight: 'bold', letterSpacing: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 14, color: '#666', fontWeight: '500' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { backgroundColor: '#fff', width: (width - 55) / 2, paddingVertical: 20, paddingHorizontal: 15, borderRadius: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    statNumber: { fontSize: 36, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#A0A5BA', fontWeight: '700', textTransform: 'uppercase' },

    // Chart & Section
    sectionCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    sectionCardNobg: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 14, color: '#A0A5BA', fontWeight: '500' },
    sectionTitleBlack: { fontSize: 18, color: '#181C2E', fontWeight: 'bold' },
    revenueAmount: { fontSize: 24, fontWeight: 'bold', color: '#181C2E', marginTop: 4 },
    filterRow: { alignItems: 'flex-end' },
    dropdownSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dropdownText: { fontSize: 12, color: '#181C2E', marginRight: 4 },
    seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '500' },

    // Chart SVG
    chartContainer: { marginTop: 10, position: 'relative' },
    tooltip: { position: 'absolute', backgroundColor: '#181C2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, zIndex: 10 },
    tooltipText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    tooltipArrow: { position: 'absolute', bottom: -4, left: '45%', width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#181C2E' },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    chartLabelText: { fontSize: 10, color: '#A0A5BA' },

    // Tabs
    tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EDEDED' },
    activeTabButton: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { fontSize: 14, color: '#666', fontWeight: '600' },
    activeTabText: { color: '#fff' },

    // Order List Item
    orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
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