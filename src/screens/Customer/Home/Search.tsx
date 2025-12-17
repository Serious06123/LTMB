import React, { use } from 'react';
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
  const goToCart = () => {
    navigation.navigate('Cart');
  };
  const goBack = () => {
    navigation.goBack();
  };
  const goToFoodSearch = (categoryName?: string) => {
    navigation.navigate('Food', { category: categoryName });
  };
  const data = [
    {
      id: '1',
      name: 'Pansi Restaurant',
      rating: 4.7,
      image: IMAGES.pizza1,
    },
    {
      id: '2',
      name: 'American Spicy Burger Shop',
      rating: 4.3,
      image: IMAGES.pizza1,
    },
    {
      id: '3',
      name: 'Cafeteria Coffee Club',
      rating: 4.0,
      image: IMAGES.pizza1,
    },
    {
      id: '4',
      name: 'Cafeteria Club',
      rating: 4.0,
      image: IMAGES.pizza1,
    },
  ];
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
  const restaurants = (restData?.getRestaurants || []).map((r: any) => ({
    id: r._id,
    name: r.name,
    rating: r.rating ? r.rating : 4.0,
    image: r.image || IMAGES.pizza1,
    categories: r.categories,
    address: r.address,
    raw: r,
  }));
  console.log('[Search] fetched foods:', foodsData);

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
          <Text style={styles.searchTitle}>Search</Text>
          <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
            <MaterialCommunityIcons name="cart" color="#fff" size={24} />
            <View style={styles.notify}>
              <Text style={styles.notifyText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.searchInput}>
            <AntDesign name="search1" color="#A0A5BA" size={24} />
            <TextInput
              placeholder={`Search dishes, restaurants`}
              onChangeText={setSearch}
              value={search}
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

      {/* Recent Keywords */}
      <View style={styles.recentKeywordsContainer}>
        <Text style={styles.sectionTitle}>Recent Keywords</Text>
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
          <Text style={styles.sectionTitle}>Suggested Restaurants</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Suggested Restaurants');
              setSeeAllItems(data);
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={restaurants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
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
          <Text style={styles.sectionTitle}>Popular Fast Food</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Popular Fast Food');
              // open modal immediately and pass fetched foods
              setSeeAllItems(foods);
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          // show fetched foods; fall back to empty array while loading
          data={foods.slice(0, 10)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
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
          )}
        />
      </View>
      <SeeAllModal
        visible={seeAllVisible}
        title={seeAllTitle}
        items={seeAllItems}
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
