import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme'; //
import { IMAGES } from '../../../constants/images';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// 1. Định nghĩa các trạng thái đơn hàng (Bỏ 'Trả hàng' theo yêu cầu)
const TABS = [
  { id: 'Processing', title: 'Đang xử lý' },
  { id: 'Delivering', title: 'Đang giao' },
  { id: 'Completed', title: 'Đã giao' },
  { id: 'Cancelled', title: 'Đã hủy' },
];

// 2. Mock Data (Dữ liệu giả lập để test giao diện)
const MOCK_ORDERS = [
  {
    id: 'ORD001',
    restaurantName: 'Rose Garden Restaurant',
    image: IMAGES.pizza1, //
    items: '2x Chicken Burger, 1x Coca Cola',
    totalPrice: 15.50,
    status: 'Processing',
    date: '15 Dec, 10:30 AM',
    itemCount: 3,
  },
  {
    id: 'ORD002',
    restaurantName: 'Cà phê Ông Bầu',
    image: IMAGES.pizza2, //
    items: '1x Cà phê sữa đá, 1x Bánh mì',
    totalPrice: 5.20,
    status: 'Delivering',
    date: '15 Dec, 09:15 AM',
    itemCount: 2,
  },
  {
    id: 'ORD003',
    restaurantName: 'KFC Chicken',
    image: IMAGES.pizza1,
    items: '1x Combo Gà Rán',
    totalPrice: 12.00,
    status: 'Completed',
    date: '14 Dec, 08:00 PM',
    itemCount: 1,
  },
  {
    id: 'ORD004',
    restaurantName: 'Pizza Hut',
    image: IMAGES.pizza1,
    items: '1x Pizza Hải Sản',
    totalPrice: 20.00,
    status: 'Cancelled',
    date: '10 Dec, 12:00 PM',
    itemCount: 1,
  },
];

const OrderHistoryScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('Processing');

  // Lọc đơn hàng theo tab đang chọn
  const filteredOrders = MOCK_ORDERS.filter(order => order.status === activeTab);

  // Render từng thẻ đơn hàng
  const renderOrderItem = ({ item }: { item: any }) => {
    // Màu sắc trạng thái
    let statusColor = colors.primary;
    let statusText = '';
    
    switch(item.status) {
        case 'Processing': statusColor = '#FFA500'; statusText = 'Đang chuẩn bị'; break;
        case 'Delivering': statusColor = '#1E90FF'; statusText = 'Đang giao hàng'; break;
        case 'Completed': statusColor = '#28a745'; statusText = 'Giao thành công'; break;
        case 'Cancelled': statusColor = '#dc3545'; statusText = 'Đã hủy'; break;
    }

    return (
      <View style={styles.card}>
        {/* Header của Card: Tên quán + Trạng thái */}
        <View style={styles.cardHeader}>
            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        <View style={styles.divider} />

        {/* Body của Card: Ảnh + Thông tin món */}
        <View style={styles.cardBody}>
            <Image source={item.image} style={styles.foodImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.itemsText} numberOfLines={2}>{item.items}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
                <View style={styles.priceRow}>
                     <Text style={styles.itemCount}>{item.itemCount} món</Text>
                     <Text style={styles.totalPrice}>${item.totalPrice.toFixed(2)}</Text>
                </View>
            </View>
        </View>

        <View style={styles.divider} />

        {/* Footer của Card: Nút bấm */}
        <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Chi tiết</Text>
            </TouchableOpacity>
            
            {item.status === 'Completed' || item.status === 'Cancelled' ? (
                 <TouchableOpacity style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Đặt lại</Text>
                 </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('TrackOrder')}>
                    <Text style={styles.primaryButtonText}>Theo dõi</Text>
                 </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Header Trang */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
      </View>

      {/* Thanh Tabs Trạng Thái */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === item.id && styles.activeTabItem
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === item.id && styles.activeTabText
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Danh sách đơn hàng */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    backgroundColor: colors.white,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingLeft: 10,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabItem: {
    backgroundColor: '#FFF0F0', // Màu nền nhạt của primary
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  cardBody: {
    flexDirection: 'row',
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemsText: {
    fontSize: 14,
    color: '#32343E',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#A0A5BA',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#999',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});

export default OrderHistoryScreen;