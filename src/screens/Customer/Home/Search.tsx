import React, { use, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import SeeAllModal from '../../../components/SeeAllModal';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BASE_URL } from '../../../constants/config';

interface Food {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  isAvailable?: boolean;
}
interface getFoodsData {
  getFoods: Food[];
}
interface Category {
  _id: string;
  name: string;
  image?: string;
}
interface getCategoriesData {
  getCategories: Category[];
}

interface Restaurant {
  _id: string;
  name: string;
  rating: number;
  reviews?: number;
  image?: string;
  deliveryTime?: number;
  deliveryFee?: number;
  isOpen?: boolean;
  categories: Category[];
  address: {
    street: string;
    city: string;
    lat: number;
    lng: number;
  };
}

interface getRestaurantsData {
  getRestaurants: Restaurant[];
}

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState('');
  const [seeAllItems, setSeeAllItems] = useState<any[]>([]);
  const [type, setType] = useState<'restaurant' | 'food' | 'category'>(
    'restaurant',
  );
  const goToCart = () => {
    navigation.navigate('Cart');
  };
  const goBack = () => {
    navigation.goBack();
  };
  const goToFoodSearch = (categoryName?: string) => {
    navigation.navigate('Food', { category: categoryName });
  };
  // GraphQL: fetch foods from backend
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
        isAvailable
      }
    }
  `;

  const GET_CATEGORIES = gql`
    query GetCategories {
      getCategories {
        _id
        name
        image
      }
    }
  `;

  const GET_RESTAURANTS = gql`
    query GetRestaurants($category: String) {
      getRestaurants(category: $category) {
        _id
        name
        rating
        reviews
        image
        deliveryTime
        deliveryFee
        isOpen
        categories {
          _id
          name
        }
        address {
          street
          city
          lat
          lng
        }
      }
    }
  `;

  const {
    data: foodsData,
    loading: foodsLoading,
    error: foodsError,
  } = useQuery<getFoodsData>(GET_FOODS);
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useQuery<getCategoriesData>(GET_CATEGORIES);
  const categories = categoriesData?.getCategories || [];
  const foods = foodsData?.getFoods || [];

  const {
    data: restData,
    loading: restLoading,
    error: restError,
  } = useQuery<getRestaurantsData>(GET_RESTAURANTS);
  const restaurants = (restData?.getRestaurants || []).map((r: any) => {
    // 1. Lấy link gốc từ database
    const originalImage = r.image;

    // 2. Xử lý logic đường dẫn
    let finalUri = IMAGES.pizza1; // Mặc định là ảnh pizza nếu không có ảnh

    if (originalImage) {
      if (originalImage.startsWith('http')) {
        // Nếu ảnh đã là link online (Cloudinary, Firebase...) -> Giữ nguyên
        finalUri = { uri: originalImage };
      } else {
        // Nếu là ảnh upload local (vd: /uploads/abc.png) -> Ghép thêm BASE_URL
        finalUri = { uri: `${BASE_URL}${originalImage}` };
      }
    }
    return {
      id: r._id,
      name: r.name,
      details: r.categories?.map((c: any) => c.name).join(' - ') || '',
      rating: r.rating ? String(r.rating) : '4.0',
      delivery: r.deliveryFee && r.deliveryFee > 0 ? `${r.deliveryFee}` : 'Free',
      time: r.deliveryTime || '',
      image: finalUri, // Gán URL đã xử lý chuẩn vào đây
      raw: r,
    };
  });

  // Lọc món ăn theo từ khóa
  const filteredFoods = useMemo(() => {
    if (search.trim().length === 0) return foods;
    return foods.filter(f =>
      f.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search, foods]);

  const filteredRestaurants = useMemo(() => {
    if (search.trim().length === 0) return restaurants;
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search, restaurants]);

  if (foodsError) {
    console.log('[Search] GET_FOODS error:', foodsError);
  }
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.deliveryInfo}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <AntDesign name="left" color="#000" size={24} />
          </TouchableOpacity>
          <Text style={styles.searchTitle}>Tìm kiếm</Text>
          <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
            <MaterialCommunityIcons name="cart" color="#fff" size={24} />
            <View style={styles.notify}>
              <Text style={styles.notifyText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.searchInput}>
            <AntDesign name="search1" color="#A0A5BA" size={24} />
            <TextInput
              placeholder={`Tìm kiếm món ăn, nhà hàng...`}
              onChangeText={setSearch}
              value={search}
              autoCorrect={false}
              keyboardType='default'
            />
            {search.length > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={() => setSearch('')}
              >
                <Text style={styles.clearText}>X</Text>
              </Pressable>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={styles.recentKeywordsContainer}>
        <Text style={styles.sectionTitle}>Từ khóa gần đây</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.keywordButton}
              onPress={() => goToFoodSearch(item.name)}
            >
              <Text style={styles.keywordText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Suggested Restaurants */}
      <View style={styles.suggestedContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.sectionTitle}>Quán ăn nổi tiếng</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Suggested Restaurants');
              setType('restaurant');
              setSeeAllItems(restaurants);
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredRestaurants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('RestaurantView', { restaurant: item.raw })
              }
            >
              <View style={styles.restaurantItem}>
                <Image source={item.image} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AntDesign name="staro" color={colors.primary} size={15} />
                    <Text style={styles.restaurantRating}>
                      {String(item.rating)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Popular Fast Food */}
      <View style={styles.popularContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.sectionTitle}>Món ăn phổ biến</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Popular Food');
              // open modal immediately and pass fetched foods
              setType('food');
              setSeeAllItems(foods);
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          // show filtered foods; fall back to empty array while loading
          data={filteredFoods.slice(0, 10)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('FoodDetail', { food: item })}
            >
              <View style={styles.foodItem}>
                <Image
                  source={
                    typeof item.image === 'string'
                      ? { uri: item.image }
                      : item.image
                  }
                  style={styles.foodImage}
                />
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={{ color: '#646982', fontSize: 13 }}>
                  {
                    // item.restaurant ||
                    item.category || ''
                  }
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      <SeeAllModal
        visible={seeAllVisible}
        title={seeAllTitle}
        items={seeAllItems}
        itemType={type}
        onClose={() => setSeeAllVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 40,
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 30,
  },
  searchBarContainer: {
    flex: 1.25,
    flexDirection: 'column',
    marginBottom: 20,
  },
  notificationBadge: {
    color: colors.white,
    fontWeight: 'bold',
  },
  recentKeywordsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.black,
    marginBottom: 15,
  },
  keywordButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
    minWidth: 40,
  },
  keywordText: {
    color: colors.black,
    fontSize: 14,
  },
  suggestedContainer: {
    flex: 3,
    marginBottom: 20,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#EBEBEB',
    marginTop: 4,
  },
  restaurantImage: {
    width: 60,
    height: 50,
    borderRadius: 15,
    marginRight: 10,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: colors.black,
  },
  restaurantRating: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 5,
  },
  popularContainer: {
    flex: 2,
    marginBottom: 30,
  },
  foodItem: {
    width: 153,
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    marginBottom: 10,
  },
  foodImage: {
    width: 122,
    height: 84,
    borderRadius: 10,
    marginBottom: 10,
  },
  foodName: {
    fontSize: 14,
    color: colors.black,
  },
  cartButton: {
    backgroundColor: '#181C2E',
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 50,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  notify: {
    position: 'absolute',
    top: -7,
    right: -3,
    width: 25,
    height: 25,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 15,
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
  },
  searchTitle: {
    fontSize: 20,
    // fontWeight: 'bold',
  },
  searchInput: {
    height: 62,
    width: '100%',
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    paddingHorizontal: 25,
    margin: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#CDCDCF',
    borderRadius: 50,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  clearText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    backgroundColor: '#EBEBEB',
    height: 14,
    width: '100%',
  },
  seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default SearchScreen;
