import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

const { height } = Dimensions.get('window');

// Dữ liệu giả mô phỏng các đơn hàng trong ảnh
const RUNNING_ORDERS = [
  {
    id: '1',
    name: 'Chicken Thai Biriyani',
    tag: '#Breakfast',
    orderId: '32053',
    price: '$60',
    image: IMAGES.pizza1, // Thay ảnh thật của bạn
  },
  {
    id: '2',
    name: 'Chicken Bhuna',
    tag: '#Breakfast',
    orderId: '15253',
    price: '$30',
    image: IMAGES.pizza2,
  },
  {
    id: '3',
    name: 'Vegetarian Poutine',
    tag: '#Breakfast',
    orderId: '21200',
    price: '$35',
    image: IMAGES.introman2,
  },
  {
    id: '4',
    name: 'Turkey Bacon Strips',
    tag: '#Breakfast',
    orderId: '53241',
    price: '$45',
    image: IMAGES.pizza1,
  },
  {
    id: '5',
    name: 'Veggie Burrito',
    tag: '#Breakfast',
    orderId: '58464',
    price: '$25',
    image: IMAGES.introman4,
  },
];

export default function RunningOrders() {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: typeof RUNNING_ORDERS[0] }) => (
    <View style={styles.card}>
      {/* Ảnh món ăn */}
      <Image source={item.image} style={styles.image} />

      {/* Thông tin món */}
      <View style={styles.infoContainer}>
        <Text style={styles.tag}>{item.tag}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.rowDetails}>
            <Text style={styles.orderId}>ID: {item.orderId}</Text>
            <Text style={styles.priceSeparator}>|</Text>
            <Text style={styles.price}>{item.price}</Text>
        </View>

        {/* Nút thao tác */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnDone}>
            <Text style={styles.btnDoneText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancel}>
            <Text style={styles.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header giả lập Bottom Sheet */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <AntDesign name="close" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.dragHandle} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
            {RUNNING_ORDERS.length} Running Orders
        </Text>

        <FlatList
          data={RUNNING_ORDERS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Hoặc '#F8F9FE' nếu muốn giống nền xám
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
      position: 'absolute',
      right: 20,
      top: 10,
      zIndex: 10,
      padding: 5
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E1E1E1',
    borderRadius: 2.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 20,
    marginTop: 10,
  },
  // Card Styles
  card: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    // Nếu muốn đổ bóng nhẹ cho từng item như thiết kế phẳng thì không cần shadow quá đậm
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tag: {
    fontSize: 12,
    color: colors.primary, // Màu cam từ theme
    fontWeight: '500',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
    marginVertical: 2,
  },
  rowDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    color: '#A0A5BA',
  },
  priceSeparator: {
      marginHorizontal: 8,
      color: '#A0A5BA',
  },
  price: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#181C2E'
  },
  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnDone: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDoneText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnCancel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 7, // Trừ đi border width
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF4B4B', // Màu đỏ nhạt cho Cancel
  },
  btnCancelText: {
    color: '#FF4B4B',
    fontWeight: 'bold',
    fontSize: 14,
  },
});