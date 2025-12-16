import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme';

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
            {/* '15' là độ trong suốt (alpha) thêm vào mã hex */}
            {icon}
        </View>
        <Text style={styles.menuText}>{title}</Text>
        {rightElement ? rightElement : <MaterialIcons name="keyboard-arrow-right" size={24} color="#A0A5BA" />}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const navigation = useNavigation();

    const handleLogout = () => {
        // Xử lý logout tại đây (clear token, reset state...)
        navigation.navigate('Login' as never);
    };

    return (
        <View style={styles.container}>
            {/* --- HEADER CAM --- */}
            <View style={styles.headerBackground}>
                <SafeAreaView edges={['top', 'left', 'right']}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <AntDesign name="left" size={20} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <Text style={styles.balanceValue}>$500.00</Text>

                        <TouchableOpacity style={styles.withdrawButton}>
                            <Text style={styles.withdrawText}>Withdraw</Text>
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
                        title="Personal Info"
                        icon={<Feather name="user" size={22} color={colors.primary} />}
                        iconColor={colors.primary}
                        onPress={() => (navigation as any).navigate('EditProfileScreen')}
                    />
                    <MenuItem
                        title="Settings"
                        icon={<Feather name="settings" size={22} color="#3E3E3E" />} // Xanh tím than giả lập
                        iconColor="#5B67F6"
                        onPress={() => { }}
                    />
                </View>

                {/* Group 2 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="Withdrawal History"
                        icon={<MaterialCommunityIcons name="bank-transfer" size={24} color={colors.primary} />}
                        iconColor={colors.primary}
                        onPress={() => { }}
                    />
                    <MenuItem
                        title="Number of Orders"
                        icon={<Ionicons name="document-text-outline" size={22} color="#00BCD4" />}
                        iconColor="#00BCD4"
                        rightElement={<Text style={styles.orderCount}>29K</Text>}
                    />
                </View>

                {/* Group 3 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="User Reviews"
                        icon={<Feather name="star" size={22} color="#00BCD4" />}
                        iconColor="#00BCD4"
                        onPress={() => (navigation as any).navigate('ReviewsScreen')} // Link đến màn hình Review đã làm
                    />
                </View>

                {/* Group 4 */}
                <View style={styles.menuGroup}>
                    <MenuItem
                        title="Log Out"
                        icon={<Feather name="log-out" size={22} color="#FF4B4B" />}
                        iconColor="#FF4B4B"
                        onPress={handleLogout}
                    />
                </View>

                {/* Padding bottom cho Bottom Tabs */}
                <View style={{ height: 100 }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE', // Màu nền xám nhạt
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
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    withdrawButton: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 25,
        paddingVertical: 10,
        backgroundColor: 'transparent',
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
    },
    menuGroup: {
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 15,
        marginBottom: 20,
        // Shadow nhẹ
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