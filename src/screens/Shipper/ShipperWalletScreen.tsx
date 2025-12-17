import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../theme';

// --- 1. KHAI BÁO INTERFACE ---

interface UserWallet {
    id: string;
    name: string;
    walletBalance: number;
}

interface GetMyWalletData {
    me: UserWallet;
}

// --- 2. QUERY ---
const GET_MY_WALLET = gql`
  query GetMyWallet {
    me {
      id
      name
      walletBalance
    }
  }
`;

export default function ShipperWalletScreen() {
    const isFocused = useIsFocused();
    const navigation = useNavigation();
    
    // Áp dụng Interface vào useQuery
    const { data, loading, refetch } = useQuery<GetMyWalletData>(GET_MY_WALLET, {
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (isFocused) refetch();
    }, [isFocused]);

    const balance = data?.me?.walletBalance || 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ví Tài Xế</Text>
            </View>

            <ScrollView 
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.primary]} />}
                contentContainerStyle={{ padding: 20 }}
            >
                {/* Thẻ ATM ảo */}
                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <Text style={styles.cardLabel}>Số dư khả dụng</Text>
                        <FontAwesome5 name="wallet" size={24} color="#fff" />
                    </View>
                    <Text style={styles.balance}>{balance.toLocaleString()}đ</Text>
                    <Text style={styles.cardName}>{data?.me?.name?.toUpperCase() || 'SHIPPER'}</Text>
                </View>

                {/* Các nút chức năng */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                            <MaterialIcons name="add-card" size={28} color="#1E88E5" />
                        </View>
                        <Text style={styles.actionText}>Nạp tiền</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialIcons name="account-balance-wallet" size={28} color="#43A047" />
                        </View>
                        <Text style={styles.actionText}>Rút tiền</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                         <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialIcons name="history" size={28} color="#FB8C00" />
                        </View>
                        <Text style={styles.actionText}>Lịch sử</Text>
                    </TouchableOpacity>
                </View>

                {/* Lịch sử giao dịch gần đây (Giả lập) */}
                <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
                <View style={styles.transactionList}>
                    <View style={styles.transactionItem}>
                        <View style={[styles.transIcon, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialIcons name="arrow-downward" size={20} color="green" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.transTitle}>Thu nhập đơn hàng</Text>
                            <Text style={styles.transTime}>Hôm nay, 10:30</Text>
                        </View>
                        <Text style={[styles.transAmount, { color: 'green' }]}>+15,000đ</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    header: { padding: 20, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#181C2E' },
    
    card: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 25,
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        marginBottom: 30
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    balance: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 15 },
    cardName: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1 },

    actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    actionBtn: { alignItems: 'center', width: '30%' },
    iconBox: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionText: { color: '#333', fontWeight: '500' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    transactionList: { backgroundColor: '#fff', borderRadius: 15, padding: 5 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    transIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    transTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    transTime: { fontSize: 12, color: '#999', marginTop: 2 },
    transAmount: { fontSize: 16, fontWeight: 'bold' }
});