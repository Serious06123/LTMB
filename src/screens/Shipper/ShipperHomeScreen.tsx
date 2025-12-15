import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert } from 'react-native';
import { colors } from '../../theme'; //

const mockOrders = [
  { id: '1', restaurant: 'Pizza Hut', address: '123 Đường A, Quận 1', price: '50.000đ', distance: '2.5km' },
  { id: '2', restaurant: 'Gà Rán KFC', address: '456 Đường B, Quận 3', price: '75.000đ', distance: '1.2km' },
];

export default function ShipperHomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);

  const toggleSwitch = () => setIsOnline(previousState => !previousState);

  const handleAcceptOrder = (item: any) => {
    // Chuyển sang màn hình Map để đi giao hàng
    navigation.navigate('MapScreen', { orderId: item.id, isShipperMode: true });
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.restaurantName}>{item.restaurant}</Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>
      <Text style={styles.address}>📍 {item.address}</Text>
      <Text style={styles.distance}>Khoảng cách: {item.distance}</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleAcceptOrder(item)}
      >
        <Text style={styles.buttonText}>NHẬN ĐƠN</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header trạng thái */}
      <View style={[styles.statusHeader, { backgroundColor: isOnline ? colors.primary : colors.gray }]}>
        <Text style={styles.statusText}>{isOnline ? 'BẠN ĐANG ONLINE' : 'BẠN ĐANG OFFLINE'}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isOnline ? colors.white : '#f4f3f4'}
          onValueChange={toggleSwitch}
          value={isOnline}
        />
      </View>

      {/* Danh sách đơn hàng */}
      {isOnline ? (
        <FlatList
          data={mockOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>Vui lòng bật trạng thái Online để nhận đơn</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50, // Tránh tai thỏ
  },
  statusText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  listContent: { padding: 15 },
  card: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  restaurantName: { fontSize: 18, fontWeight: 'bold', color: colors.black },
  price: { fontSize: 16, color: colors.primary, fontWeight: 'bold' },
  address: { color: colors.gray, marginBottom: 5 },
  distance: { color: colors.secondary, marginBottom: 10 },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: 'bold' },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineText: { color: colors.gray, fontSize: 16 },
});