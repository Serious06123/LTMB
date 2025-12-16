import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_RUNNING_ORDERS = gql`
  query GetRunningOrders {
    getRunningOrders {
      id
      restaurantUser{
        name
        address { street city }
      }
      restaurantFood { name }     
      totalAmount
      status
    }
  }
`;

export default function ShipperHomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const toggleSwitch = () => setIsOnline(previousState => !previousState);

  const { data, loading, error, refetch } = useQuery(GET_RUNNING_ORDERS, {
    fetchPolicy: 'network-only',
    skip: !isOnline,
  });

  const handleAcceptOrder = (item: any) => {
    navigation.navigate('MapScreen', { orderId: item.id, isShipperMode: true });
  };

  const orders = (data && Array.isArray((data as any).getRunningOrders))
    ? (data as any).getRunningOrders.map((order: any) => ({
        id: order.id,
        restaurant: order.restaurantUser?.name || '',
        foodName: order.restaurantFood?.name || '',
        address: order.restaurantUser?.address ? `${order.restaurantUser.address.street}, ${order.restaurantUser.address.city}` : '',
        price: order.totalAmount ? `${order.totalAmount.toLocaleString('vi-VN')}đ` : '',
        status: order.status,
      }))
    : [];

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.restaurantName} numberOfLines={2}>{item.restaurant}</Text>
      </View>
      <Text style={styles.foodName}>Món ăn: {item.foodName}</Text>
      <Text style={styles.price}>Giá tiền: {item.price}</Text>
      <View style={styles.addressRow}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
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
          onValueChange={() => {
            toggleSwitch();
            if (!isOnline) refetch();
          }}
          value={isOnline}
        />
      </View>

      {/* Danh sách đơn hàng */}
      {isOnline ? (
        loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>Lỗi tải dữ liệu</Text>
            <Text style={[styles.offlineText, { color: 'red', marginTop: 8, fontSize: 13 }]}>{error.message}</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.offlineText}>Không có đơn hàng nào</Text>}
          />
        )
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
  restaurantName: { fontSize: 18, fontWeight: 'bold', color: colors.black, flex: 1, flexWrap: 'wrap' },
  price: { fontSize: 16, color: colors.primary, fontWeight: 'bold', marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  addressIcon: { fontSize: 14, marginRight: 2 },
  address: { color: colors.gray, fontSize: 14 },
  distance: { color: colors.secondary, marginBottom: 10 },
  button: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: 'bold' },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  offlineText: { color: colors.gray, fontSize: 16 },
  foodName: { fontSize: 15, color: colors.black, marginBottom: 2, fontWeight: 'semibold'},
});