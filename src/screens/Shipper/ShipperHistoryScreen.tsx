// src/screens/Shipper/ShipperHistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import icon
import { colors } from '../../theme'; //
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_HISTORY_ORDERS = gql`
  query GetHistoryOrders {
    myShippingOrders {
      id
      createdAt
      totalAmount
      status
      restaurantUser{name}
      shippingAddress {street city}
    }
  }
`;

export default function ShipperHistoryScreen() {
  const { data, loading, error } = useQuery(GET_HISTORY_ORDERS, { fetchPolicy: 'network-only' });
  const orders = (data && Array.isArray((data as any).myShippingOrders))
    ? (data as any).myShippingOrders.map((order: any) => ({
        id: order.id,
        date: order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '',
        restaurant: order.restaurantUser?.name || '',
        customerAddress: order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : '',
        total: order.totalAmount ? `${order.totalAmount.toLocaleString('vi-VN')}đ` : '',
        status: order.status,
      }))
    : [];

  const renderItem = ({ item }: any) => {
    // Xác định style và text cho từng trạng thái
    let statusText = '';
    let statusColor = '';
    let statusBg = '';
    let statusIcon = '';
    switch (item.status) {
      case 'completed':
        statusText = 'Hoàn thành';
        statusColor = 'green';
        statusBg = '#E8F5E9';
        statusIcon = 'checkmark-circle';
        break;
      case 'delivered':
        statusText = 'Đã giao';
        statusColor = '#1976D2';
        statusBg = '#E3F2FD';
        statusIcon = 'cube-outline';
        break;
      case 'shipping':
        statusText = 'Đang giao';
        statusColor = '#F9A825';
        statusBg = '#FFF8E1';
        statusIcon = 'bicycle-outline';
        break;
      case 'cancelled':
      default:
        statusText = 'Đã hủy';
        statusColor = 'red';
        statusBg = '#FFEBEE';
        statusIcon = 'close-circle';
        break;
    }
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <View style={styles.dateRow}>
             <Ionicons name="calendar-outline" size={14} color={colors.gray} style={{marginRight: 4}} />
             <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={16} color={colors.secondary} style={{marginRight: 8}} />
            <Text style={styles.restaurantName}>{item.restaurant}</Text>
        </View>
        <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.gray} style={{marginRight: 8}} />
            <Text style={styles.address}>Giao đến: {item.customerAddress}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{item.total}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}> 
            <Ionicons 
                name={statusIcon} 
                size={16} 
                color={statusColor} 
                style={{marginRight: 4}}
            />
            <Text style={[styles.statusText, { color: statusColor }]}> 
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử hoạt động</Text>
      </View>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 30 }}>Đang tải...</Text>
      ) : error ? (
        <Text style={{ textAlign: 'center', marginTop: 30, color: 'red' }}>Lỗi tải dữ liệu: {error.message}</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: colors.white, padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.black },
  listContent: { padding: 15 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontWeight: 'bold', color: colors.black, fontSize: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { color: colors.gray, fontSize: 13 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  restaurantName: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  address: { color: colors.gray, fontSize: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  price: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
});