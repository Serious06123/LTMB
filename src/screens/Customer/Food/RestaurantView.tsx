import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Filter from '../../../components/Filter';

// --- GRAPHQL ---
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BASE_URL } from '../../../constants/config';

// 1. INTERFACES
interface Category {
  _id: string;
  name: string;
}
interface GetCategoriesData {
  getCategories: Category[];
}
interface FoodItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  rating: number;
}
interface GetFoodsByRestaurantData {
  getFoodsByRestaurant: FoodItem[];
}

// 2. QUERY: Lấy TOÀN BỘ món ăn của nhà hàng (không truyền category để lấy hết)
const GET_ALL_FOODS_BY_RESTAURANT = gql`
  query GetFoodsByRestaurant($restaurantId: ID!) {
    getFoodsByRestaurant(restaurantId: $restaurantId) {
      id
      name
      price
      image
      description
      category
      rating
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      _id
      name
    }
  }
`;

const RestaurantViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  // Nhận thêm initialCategory từ FoodScreen
  const { restaurant, initialCategory } =
    (route.params as { restaurant: any; initialCategory?: string }) || {};

  const [isFavorite, setIsFavorite] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // State quản lý danh mục đang chọn. Mặc định ưu tiên initialCategory, nếu không có thì là 'All'
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || 'All',
  );

  // --- FETCH DATA ---

  // A. Lấy tất cả danh mục hệ thống (để sắp xếp thứ tự cho đẹp nếu cần)
  const { data: catData } = useQuery<GetCategoriesData>(GET_CATEGORIES);

  // B. Lấy TOÀN BỘ món ăn của nhà hàng
  const restaurantIdToFetch = restaurant?.accountId || restaurant?._id;
  const { data: foodData, loading: foodLoading } =
    useQuery<GetFoodsByRestaurantData>(GET_ALL_FOODS_BY_RESTAURANT, {
      variables: { restaurantId: restaurantIdToFetch }, // Không truyền category để lấy tất cả
      skip: !restaurantIdToFetch,
      fetchPolicy: 'cache-and-network',
    });

  // --- XỬ LÝ LOGIC HIỂN THỊ (Client-side) ---

  // 1. Chuẩn hóa danh sách món ăn
  const allFoods = useMemo(() => {
    return (foodData?.getFoodsByRestaurant || []).map(item => ({
      ...item,
      image: item.image
        ? item.image.startsWith('http')
          ? { uri: item.image }
          : { uri: `${BASE_URL}${item.image}` }
        : IMAGES.pizza1,
    }));
  }, [foodData]);

  // 2. Tính toán "Active Categories" (Chỉ hiện danh mục có món)
  const activeCategories = useMemo(() => {
    if (!allFoods.length) return ['All'];

    // Lấy danh sách các category có trong list món ăn
    const existingCategories = new Set(allFoods.map(f => f.category));

    // Lấy danh sách gốc từ server để giữ đúng thứ tự (nếu muốn)
    const systemCategories = (catData?.getCategories || []).map(c => c.name);

    // Lọc: Chỉ lấy những category hệ thống CÓ TỒN TẠI trong món ăn của quán này
    const filtered = systemCategories.filter(cat =>
      existingCategories.has(cat),
    );

    // Luôn thêm 'All' vào đầu
    return ['All', ...filtered];
  }, [allFoods, catData]);

  // 3. Lọc món ăn để hiển thị theo selectedCategory
  const displayedFoods = useMemo(() => {
    if (selectedCategory === 'All') return allFoods;
    return allFoods.filter(item => item.category === selectedCategory);
  }, [selectedCategory, allFoods]);

  // 4. Effect: Nếu initialCategory thay đổi hoặc load xong data, đảm bảo selectedCategory hợp lệ
  useEffect(() => {
    if (initialCategory && activeCategories.includes(initialCategory)) {
      setSelectedCategory(initialCategory);
    } else if (
      !activeCategories.includes(selectedCategory) &&
      selectedCategory !== 'All'
    ) {
      // Nếu danh mục đang chọn không còn tồn tại (do filter), reset về All
      setSelectedCategory('All');
    }
  }, [initialCategory, activeCategories]);

  // --- NAVIGATIONS ---
  const goBack = () => navigation.goBack();
  const goToFoodDetail = (foodItem: any) => {
    const foodWithRestaurant = { ...foodItem, restaurant: restaurant };
    navigation.navigate('FoodDetail', { food: foodWithRestaurant });
  };

  if (!restaurant) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Text style={{ color: 'red', marginBottom: 10 }}>
          Lỗi: Không tìm thấy dữ liệu nhà hàng!
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, backgroundColor: '#eee', borderRadius: 8 }}
        >
          <Text>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let restaurantImage: any = IMAGES.pizza1;
  if (restaurant.image) {
    // restaurant.image may be a string (path or url) or already an object like { uri: '...' }
    if (typeof restaurant.image === 'string') {
      restaurantImage = restaurant.image.startsWith('http')
        ? { uri: restaurant.image }
        : { uri: `${BASE_URL}${restaurant.image}` };
    } else if (typeof restaurant.image === 'object' && restaurant.image.uri) {
      restaurantImage = restaurant.image;
    } else {
      restaurantImage = IMAGES.pizza1;
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restaurant View</Text>
        <TouchableOpacity
          style={styles.seeMore}
          onPress={() => setIsFilterVisible(true)}
        >
          <AntDesign name="ellipsis1" color="#000" size={24} />
        </TouchableOpacity>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantHeaderWrapper}>
        <View style={styles.imageContainer}>
          <Image
            source={restaurantImage}
            style={styles.imagePlaceholder}
            resizeMode="cover"
          />
          <Pressable
            onPress={() => setIsFavorite(!isFavorite)}
            style={styles.favoriteButton}
          >
            {isFavorite ? (
              <AntDesign name="heart" color="#ff0000" size={20} />
            ) : (
              <Feather name="heart" color="#ffffffff" size={20} />
            )}
          </Pressable>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.restaurantTitle}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription} numberOfLines={2}>
            {restaurant.description || 'The best food in town awaiting you.'}
          </Text>
          <View style={styles.restaurantMeta}>
            <View style={styles.metaItem}>
              <AntDesign name="star" color={colors.primary} size={16} />
              <Text style={styles.metaText}>{restaurant.rating || 4.5}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                color={colors.primary}
                size={16}
              />
              <Text style={styles.metaText}>
                {restaurant.deliveryFee ? `$${restaurant.deliveryFee}` : 'Free'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" color={colors.primary} size={16} />
              <Text style={styles.metaText}>
                {restaurant.deliveryTime || '30 min'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Categories Horizontal List (Chỉ hiện các mục có món) */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={activeCategories} // Dùng list đã lọc
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.keywordButton,
                selectedCategory === item && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.keywordText,
                  selectedCategory === item && {
                    color: colors.white,
                    fontWeight: 'bold',
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Foods Grid */}
      <View style={styles.foodsContainer}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All'
            ? 'Full Menu'
            : `${selectedCategory} Menu`}{' '}
          ({displayedFoods.length})
        </Text>

        {foodLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            data={displayedFoods} // Hiển thị list đã lọc client-side
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <Text
                style={{ textAlign: 'center', marginTop: 20, color: '#999' }}
              >
                No foods found.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.foodItem}
                onPress={() => goToFoodDetail(item)}
              >
                <Image source={item.image} style={styles.foodImage} />
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.foodCat} numberOfLines={1}>
                  {item.category}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.foodPrice}>${item.price}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AntDesign name="staro" color={colors.primary} size={15} />
                    <Text> {item.rating} </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {isFilterVisible && (
        <>
          <View style={styles.overlay} />
          <View style={styles.filterContainer}>
            <Filter onClose={() => setIsFilterVisible(false)} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Giữ nguyên Styles cũ của bạn
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  seeMore: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantHeaderWrapper: { marginBottom: 20 },
  imageContainer: {
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  imagePlaceholder: { width: '100%', height: '100%' },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {},
  restaurantTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 5,
  },
  restaurantDescription: {
    fontSize: 13,
    color: '#A0A5BA',
    marginBottom: 10,
    lineHeight: 18,
  },
  restaurantMeta: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontWeight: '600', color: '#181C2E' },
  categoriesContainer: { marginBottom: 20, height: 50 },
  keywordButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#EDEDED',
    marginRight: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  keywordText: { color: '#181C2E', fontSize: 14, fontWeight: '500' },
  foodsContainer: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#32343E',
  },
  foodItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  foodImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  foodName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#32343E',
    marginBottom: 3,
  },
  foodCat: { fontSize: 12, color: '#A0A5BA', marginBottom: 10 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPrice: { fontSize: 16, fontWeight: 'bold', color: '#32343E' },
  addButton: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  filterContainer: {
    position: 'absolute',
    top: '20%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    zIndex: 2,
    elevation: 5,
  },
});

export default RestaurantViewScreen;
