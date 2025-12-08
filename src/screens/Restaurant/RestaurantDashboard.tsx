import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

// Dữ liệu giả cho món ăn phổ biến
const POPULAR_ITEMS = [
    { id: '1', image: require('../../assets/images/pizza1.png') }, // Thay bằng ảnh thật của bạn
    { id: '2', image: require('../../assets/images/pizza2.png') },
    { id: '3', image: require('../../assets/images/introman2.png') },
];

export default function RestaurantDashboard() {
    const navigation = useNavigation();

    // --- PHẦN VẼ BIỂU ĐỒ (SVG) ---
    const Chart = () => {
        // Đường cong Bézier mô phỏng biểu đồ trong ảnh
        const pathData = `
      M0,90 
      C60,80 80,30 140,50 
      S200,80 260,60 
      S340,20 400,40
      L400,150 L0,150 Z
    `;
        const lineData = `
      M0,90 
      C60,80 80,30 140,50 
      S200,80 260,60 
      S340,20 400,40
    `;

        return (
            <View style={styles.chartContainer}>
                <Svg height="140" width="100%" style={{ borderRadius: 15 }}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    {/* Vùng màu bên dưới */}
                    <Path d={pathData} fill="url(#grad)" />
                    {/* Đường line chính */}
                    <Path d={lineData} stroke={colors.primary} strokeWidth="3" fill="none" />

                    {/* Điểm nổi bật ($500) - Tọa độ ước lượng khớp với đường cong */}
                    <Circle cx="140" cy="50" r="5" fill="#fff" stroke={colors.primary} strokeWidth={2} />
                </Svg>

                {/* Tooltip $500 */}
                <View style={[styles.tooltip, { left: 110, top: 10 }]}>
                    <Text style={styles.tooltipText}>$500</Text>
                    <View style={styles.tooltipArrow} />
                </View>

                {/* Nhãn trục X */}
                <View style={styles.chartLabels}>
                    {['10AM', '11AM', '12PM', '01PM', '02PM', '03PM', '04PM'].map((label, index) => (
                        <Text key={index} style={styles.chartLabelText}>{label}</Text>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBtn}>
                        <Feather name="menu" size={24} color="#000" />
                    </TouchableOpacity>

                    <View style={styles.locationWrap}>
                        <Text style={styles.locationTitle}>LOCATION</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationText}>Halal Lab office</Text>
                            <MaterialIcons name="arrow-drop-down" size={20} color="#000" />
                        </View>
                    </View>

                    <Image
                        source={require('../../assets/images/introman3.png')} // Avatar
                        style={styles.avatar}
                    />
                </View>

                {/* --- THỐNG KÊ ĐƠN HÀNG (2 Cột) --- */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('RunningOrders' as never)} // <--- Thêm dòng này
                    >
                        <Text style={styles.statNumber}>20</Text>
                        <Text style={styles.statLabel}>RUNNING ORDERS</Text>
                    </TouchableOpacity>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>05</Text>
                        <Text style={styles.statLabel}>ORDER REQUEST</Text>
                    </View>
                </View>

                {/* --- BIỂU ĐỒ DOANH THU --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Total Revenue</Text>
                            <Text style={styles.revenueAmount}>$2,241</Text>
                        </View>

                        <View style={styles.filterRow}>
                            <TouchableOpacity style={styles.dropdownSmall}>
                                <Text style={styles.dropdownText}>Daily</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={16} color="#666" />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.seeDetails}>See Details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Chart />
                </View>

                {/* --- ĐÁNH GIÁ (REVIEWS) --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Reviews</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ReviewsScreen' as never)}>
                            <Text style={styles.seeAllLink}>See All Reviews</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.reviewContent}>
                        <FontAwesome5 name="star" size={20} color={colors.primary} solid />
                        <Text style={styles.ratingText}>4.9</Text>
                        <Text style={styles.reviewCount}>Total 20 Reviews</Text>
                    </View>
                </View>

                {/* --- MÓN ĂN PHỔ BIẾN --- */}
                <View style={styles.sectionCardNobg}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Popular Items This Weeks</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllLink}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        horizontal
                        data={POPULAR_ITEMS}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.popularItem}>
                                <Image source={item.image} style={styles.popularImage} />
                            </View>
                        )}
                    />
                </View>

                {/* Padding Bottom để không bị che bởi Bottom Bar giả lập */}
                <View style={{ height: 100 }} />

            </ScrollView>

            
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE', // Màu nền xám xanh nhạt
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    menuBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
    },
    locationWrap: { alignItems: 'center' },
    locationTitle: { fontSize: 12, color: colors.primary, fontWeight: 'bold', letterSpacing: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 14, color: '#666', fontWeight: '500' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd' },

    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#fff',
        width: (width - 55) / 2, // Chia đôi chiều rộng trừ khoảng cách
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 15,
        // Shadow
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
    },
    statNumber: { fontSize: 36, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
    statLabel: { fontSize: 12, color: '#A0A5BA', fontWeight: '700', textTransform: 'uppercase' },

    // Generic Section Card
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
    },
    sectionCardNobg: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15,
    },
    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
    },
    sectionTitle: { fontSize: 14, color: '#A0A5BA', fontWeight: '500' },
    revenueAmount: { fontSize: 24, fontWeight: 'bold', color: '#181C2E', marginTop: 4 },

    filterRow: { alignItems: 'flex-end' },
    dropdownSmall: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8
    },
    dropdownText: { fontSize: 12, color: '#181C2E', marginRight: 4 },
    seeDetails: { color: colors.primary, fontSize: 12, fontWeight: '500' },
    seeAllLink: { color: colors.primary, fontSize: 12, fontWeight: '500' },

    // Chart
    chartContainer: { marginTop: 10, position: 'relative' },
    tooltip: {
        position: 'absolute', backgroundColor: '#181C2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, zIndex: 10
    },
    tooltipText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    tooltipArrow: {
        position: 'absolute', bottom: -4, left: '45%', width: 0, height: 0,
        borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#181C2E'
    },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    chartLabelText: { fontSize: 10, color: '#A0A5BA' },

    // Reviews
    reviewContent: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 20, fontWeight: 'bold', color: '#181C2E', marginLeft: 10, marginRight: 10 },
    reviewCount: { fontSize: 14, color: '#A0A5BA' },

    // Popular Items
    popularItem: {
        width: 140, height: 100, marginRight: 15, borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff',
        elevation: 2
    },
    popularImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    fabWrapper: {
        top: -25, // Đẩy lên trên
        backgroundColor: '#F8F9FE', // Cùng màu nền screen để tạo hiệu ứng cắt
        borderRadius: 50,
        padding: 6,
    },
});