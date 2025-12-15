// src/screens/Shipper/ShipperHistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import icon
import { colors } from '../../theme'; //

// ... (Giữ nguyên phần mockHistory)
const mockHistory = [
  { id: 'DH001', date: '15/12/2023 10:30', restaurant: 'Pizza Hut', address: '123 Đường A, Quận 1', total: '50.000đ', status: 'completed' },
  { id: 'DH002', date: '14/12/2023 18:45', restaurant: 'Gà Rán KFC', address: '456 Đường B, Quận 3', total: '120.000đ', status: 'completed' },
  { id: 'DH003', date: '14/12/2023 12:00', restaurant: 'Cơm Tấm Cali', address: '789 Đường C, Quận 5', total: '45.000đ', status: 'cancelled' },
];

export default function ShipperHistoryScreen() {
  const renderItem = ({ item }: any) => {
    const isCompleted = item.status === 'completed';
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
            <Text style={styles.address}>Giao đến: {item.address}</Text>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{item.total}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#E8F5E9' : '#FFEBEE' }]}>
            <Ionicons 
                name={isCompleted ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={isCompleted ? 'green' : 'red'} 
                style={{marginRight: 4}}
            />
            <Text style={[styles.statusText, { color: isCompleted ? 'green' : 'red' }]}>
              {isCompleted ? 'Hoàn thành' : 'Đã hủy'}
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
      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  orderId: { fontWeight: 'bold', color: colors.black, fontSize: 16 },
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