import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';
import { gql } from '@apollo/client'; // Import Apollo
import { useQuery } from '@apollo/client/react';

const GET_FOODS = gql`
  query GetFoods($category: String) {
    getFoods(category: $category) {
      id
      name
      price
      image
      rating
      reviews
      category
      status
    }
  }
`;
// Dữ liệu giả lập
const FOOD_DATA = [
  {
    id: '1',
    name: 'Chicken Thai Biriyani',
    category: 'Breakfast',
    rating: 4.9,
    reviews: 10,
    price: 60,
    status: 'Pick UP',
    image: IMAGES.pizza1, // Thay bằng ảnh thật
  },
  {
    id: '2',
    name: 'Chicken Bhuna',
    category: 'Breakfast',
    rating: 4.9,
    reviews: 10,
    price: 30,
    status: 'Pick UP',
    image: IMAGES.pizza2,
  },
  {
    id: '3',
    name: 'Mazalichiken Halim',
    category: 'Breakfast',
    rating: 4.9,
    reviews: 10,
    price: 25,
    status: 'Pick UP',
    image: IMAGES.burger1,
  },
  {
    id: '4',
    name: 'Special Lunch Set',
    category: 'Lunch',
    rating: 4.5,
    reviews: 24,
    price: 45,
    status: 'Delivery',
    image: IMAGES.pizza1,
  },
];

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner'];

export default function MyFoodList() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Logic lọc dữ liệu
  const filteredData = selectedCategory === 'All' 
    ? FOOD_DATA 
    : FOOD_DATA.filter(item => item.category === selectedCategory);

  const renderItem = ({ item }: { item: typeof FOOD_DATA[0] }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => (navigation as any).navigate('FoodDetailRestaurant', { item })}
    >
      {/* 1. Ảnh bên trái */}
      <Image source={item.image} style={styles.image} />
      
      {/* 2. Thông tin ở giữa (Thêm paddingRight để không đè lên nút Menu/Giá) */}
      <View style={styles.infoContainer}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{item.category}</Text>
        </View>

        <View style={styles.ratingRow}>
            <FontAwesome name="star" size={14} color={colors.primary} />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewText}>({item.reviews} Review)</Text>
        </View>
      </View>

      {/* 3. Nút MENU (...) - Dùng Absolute để ghim góc trên phải */}
      <TouchableOpacity style={styles.menuBtnAbsolute}>
          <Entypo name="dots-three-horizontal" size={20} color="#333" />
      </TouchableOpacity>

      {/* 4. Cụm GIÁ TIỀN & STATUS - Dùng Absolute để ghim góc dưới phải */}
      <View style={styles.priceGroupAbsolute}>
        <Text style={styles.priceText}>${item.price}</Text>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Food List</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* CATEGORY TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
            {CATEGORIES.map((cat, index) => (
            <TouchableOpacity 
                key={index} 
                style={[styles.tabItem, selectedCategory === cat && styles.activeTabItem]}
                onPress={() => setSelectedCategory(cat)}
            >
                <Text style={[styles.tabText, selectedCategory === cat && styles.activeTabText]}>
                {cat}
                </Text>
            </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* ITEM COUNT */}
      <Text style={styles.itemCount}>Total {filteredData.length} items</Text>

      {/* LIST */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

       
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Hoặc '#F8F9FE' nếu muốn nền hơi xám
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#181C2E',
  },
  // Tabs
  tabsWrapper: {
      paddingBottom: 10,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabItem: {
    marginRight: 30,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#A0A5BA',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Count
  itemCount: {
      paddingHorizontal: 20,
      fontSize: 14,
      color: '#A0A5BA',
      marginBottom: 15,
  },
  // List & Card
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Tránh bottom bar
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative', // QUAN TRỌNG: Để làm mốc cho absolute
    
    // Shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    // Padding bên phải khoảng 60-70px để chữ không bị đè lên giá tiền/menu
    paddingRight: 70, 
    justifyContent: 'center',
    minHeight: 90, // Đảm bảo chiều cao tối thiểu bằng ảnh
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 6,
    lineHeight: 22,
  },
  tagContainer: {
    backgroundColor: '#FFF2E5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  // ... (giữ nguyên style tagText, ratingRow, ratingText, reviewText)

  // --- STYLE MỚI CHO CÁC PHẦN TỬ "TRONG GÓC" ---
  menuBtnAbsolute: {
    position: 'absolute',
    top: 15, // Cách mép trên
    right: 15, // Cách mép phải
    zIndex: 1,
  },
  priceGroupAbsolute: {
    position: 'absolute',
    bottom: 15, // Cách mép dưới
    right: 15, // Cách mép phải
    alignItems: 'flex-end', // Căn lề phải cho giá và status
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#A0A5BA',
  },
  tagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#181C2E',
    marginLeft: 5,
    marginRight: 5,
  },
  reviewText: {
    fontSize: 12,
    color: '#A0A5BA',
  },
  // Price Column
  priceColumn: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 50, // Căn chỉnh khoảng cách dọc
      marginLeft: 5,
  },
  // Bottom Bar (Copy lại style từ các màn hình trước)
 
  tabIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabWrapper: {
    top: -25,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 6,
  },
});