import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../theme';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Food item type
interface Food {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  isAvailable: boolean;
  description: string;
}

// Query response type
interface MyFoodsResponse {
  myFoods: Food[];
}
interface CategoryItem {
  id: string;
  name: string;
}

interface CategoryData {
  getCategories: CategoryItem[];
}
// 1. Định nghĩa Query lấy món ăn của chính nhà hàng
const GET_MY_FOODS = gql`
  query MyFoods($category: String) {
    myFoods(category: $category) {
      id
      name
      price
      image
      rating
      reviews
      category
      isAvailable
      description
    }
  }
`;
const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
    }
  }
`;
// // 2. Danh sách danh mục mới của bạn
// const CATEGORIES = [
//   'All',
//   'Cơm',
//   'Bún-Phở-Cháo',
//   'Trà sữa',
//   'Cà phê-Trà-Sinh tố',
//   'Đồ ăn nhẹ',
//   'Fast Food',
//   'Ăn vặt',
//   'Món chay',
// ];

export default function MyFoodList() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  // 1. Gọi API lấy Categories
  const { data: catData } = useQuery<CategoryData>(GET_CATEGORIES);
  
  // 2. Xử lý danh sách category (Thêm nút 'All' vào đầu)
  const categories = ['All', ...(catData?.getCategories?.map((c: any) => c.name) || [])];
  // 3. Gọi Apollo Hook
  const { data, loading, error, refetch } = useQuery<MyFoodsResponse>(GET_MY_FOODS, {
    variables: { category: selectedCategory },
    fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất từ server
  });

  // Xử lý làm mới danh sách khi kéo xuống
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Render từng món ăn
  const renderItem = ({ item }: { item: any }) => {
    // Xử lý ảnh: Nếu có link ảnh thì dùng uri, không thì dùng ảnh placeholder
    const imageSource = item.image 
      ? { uri: item.image } 
      : require('../../assets/images/pizza1.png'); // Đảm bảo bạn có ảnh default này hoặc đổi đường dẫn

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => (navigation as any).navigate('FoodDetailRestaurant', { item })}
      >
        {/* 1. Ảnh bên trái */}
        <Image source={imageSource} style={styles.image} />

        {/* 2. Thông tin ở giữa */}
        <View style={styles.infoContainer}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>

          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={14} color={colors.primary} />
            <Text style={styles.ratingText}>{item.rating || 5.0}</Text>
            <Text style={styles.reviewText}>
              ({item.reviews || 0} Review)
            </Text>
          </View>
        </View>

        {/* 3. Nút MENU (...) */}
        <TouchableOpacity style={styles.menuBtnAbsolute}>
          <Entypo name="dots-three-horizontal" size={20} color="#333" />
        </TouchableOpacity>

        {/* 4. Giá tiền & Trạng thái */}
        <View style={styles.priceGroupAbsolute}>
          <Text style={styles.priceText}>${item.price}</Text>
          <Text style={[
            styles.statusText, 
            { color: item.isAvailable ? 'green' : 'red' }
          ]}>
            {item.isAvailable ? 'Đang bán' : 'Hết hàng'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh Sách Món Ăn</Text>
        <TouchableOpacity onPress={() => refetch()}>
            <Entypo name="cw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* CATEGORY TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabItem,
                selectedCategory === cat && styles.activeTabItem,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCategory === cat && styles.activeTabText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ITEM COUNT & LOADING STATE */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red' }}>Lỗi: {error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={{marginTop: 10}}>
             <Text style={{color: colors.primary}}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.itemCount}>
            Tổng cộng {data?.myFoods?.length || 0} món
          </Text>

          {/* LIST */}
          <FlatList
            data={data?.myFoods || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có món ăn nào trong danh mục này.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginRight: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
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
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
    // Shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 15,
    backgroundColor: '#eee', // Màu nền khi chưa load ảnh
  },
  infoContainer: {
    flex: 1,
    paddingRight: 70,
    justifyContent: 'center',
    minHeight: 90,
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
  // Absolute items
  menuBtnAbsolute: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  priceGroupAbsolute: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      color: '#A0A5BA',
      fontSize: 16
  }
});