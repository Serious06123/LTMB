import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme';

// --- REDUX & GRAPHQL ---
import { useDispatch } from 'react-redux';
import { logout } from '../../features/general/generalSlice';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
// 1. ĐỊNH NGHĨA INTERFACE
interface UserInfo {
    id: string;
    walletBalance: number;
    name: string;
}

interface OrderSimple {
    id: string;
}

interface RestaurantInfo {
    _id: string;
    rating: number;
    reviews: number;
}

interface RestaurantProfileData {
    me: UserInfo;
    myRestaurantOrders: OrderSimple[]; // Để đếm số lượng
    myRestaurantProfile: RestaurantInfo;
}

// 2. QUERY LẤY DỮ LIỆU TỔNG HỢP
const GET_RESTAURANT_PROFILE_DATA = gql`
  query GetRestaurantProfileData {
    me {
      id
      name
      walletBalance
    }
    # Lấy danh sách đơn hàng để đếm tổng số đơn
    myRestaurantOrders {
      id
    }
    # Lấy thông tin review/rating
    myRestaurantProfile {
      _id
      rating
      reviews
    }
  }
`;

// Component con: Một dòng trong menu
const MenuItem = ({
    icon,
    iconColor,
    title,
    onPress,
    rightElement
}: {
    icon: any,
    iconColor: string,
    title: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
            {icon}
        </View>
        <Text style={styles.menuText}>{title}</Text>
        {rightElement ? rightElement : <MaterialIcons name="keyboard-arrow-right" size={24} color="#A0A5BA" />}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();

    // 3. GỌI API
    const { data, loading, refetch } = useQuery<RestaurantProfileData>(GET_RESTAURANT_PROFILE_DATA, {
        fetchPolicy: 'network-only',
    });

    // Tự động refresh khi quay lại màn hình
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đồng ý',
                onPress: () => {
                    dispatch(logout());
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            }
        ]);
    };

    if (loading && !data) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const walletBalance = data?.me?.walletBalance || 0;
    const totalOrders = data?.myRestaurantOrders?.length || 0;
    const rating = data?.myRestaurantProfile?.rating || 0;
    const reviewCount = data?.myRestaurantProfile?.reviews || 0;

    return (
        <View style={styles.container}>
            {/* --- HEADER CAM --- */}
            <View style={styles.headerBackground}>
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <AntDesign name="left" size={20} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Hồ sơ nhà hàng</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                        <Text style={styles.balanceValue}>
                            {walletBalance.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </Text>

                        <TouchableOpacity style={styles.withdrawButton}>
                            <Text style={styles.withdrawText}>Rút tiền</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            {/* --- BODY CONTENT --- */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >

                {/* Group 1 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="Thông tin cá nhân"
                        icon={<Feather name="user" size={22} color={colors.primary} />}
                        iconColor={colors.primary}
                        onPress={() => navigation.navigate('EditProfileScreen')}
                    />
                    <MenuItem
                        title="Cài đặt cửa hàng"
                        icon={<Feather name="settings" size={22} color="#3E3E3E" />}
                        iconColor="#5B67F6"
                        onPress={() => { }}
                    />
                </View>

                {/* Group 2 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="Lịch sử rút tiền"
                        icon={<MaterialCommunityIcons name="bank-transfer" size={24} color={colors.primary} />}
                        iconColor={colors.primary}
                        onPress={() => { }}
                    />
                    <MenuItem
                        title="Tổng số đơn hàng"
                        icon={<Ionicons name="document-text-outline" size={22} color="#00BCD4" />}
                        iconColor="#00BCD4"
                        rightElement={<Text style={styles.orderCount}>{totalOrders} đơn</Text>}
                    />
                </View>

                {/* Group 3 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="Đánh giá từ khách hàng"
                        icon={<Feather name="star" size={22} color="#FFD700" />}
                        iconColor="#FFD700"
                        rightElement={
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.orderCount}>{rating.toFixed(1)} </Text>
                                <AntDesign name="star" size={14} color="#FFD700" />
                                <Text style={[styles.orderCount, { fontSize: 12, fontWeight: '400' }]}> ({reviewCount})</Text>
                                <MaterialIcons name="keyboard-arrow-right" size={24} color="#A0A5BA" />
                            </View>
                        }
                        onPress={() => navigation.navigate('ReviewsScreen')}
                    />
                </View>

                {/* Group 4 */}
                <View style={[styles.menuGroup, { marginBottom: 30 }]}>
                    <MenuItem
                        title="Đăng xuất"
                        icon={<Feather name="log-out" size={22} color="#FF4B4B" />}
                        iconColor="#FF4B4B"
                        onPress={handleLogout}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header Styles
    headerBackground: {
        backgroundColor: colors.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 30,
        elevation: 5,
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '600', color: '#fff',
    },
    balanceContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 5,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 32, // Giảm size chút nếu số tiền lớn
        fontWeight: 'bold',
        marginBottom: 20,
    },
    withdrawButton: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 25,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    withdrawText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        textTransform: 'uppercase',
    },

    // Body Styles
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 50
    },
    menuGroup: {
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#181C2E',
        fontWeight: '500',
    },
    orderCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#A0A5BA',
    }
});