import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors } from '../../../theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { IMAGES } from '../../../constants/images';
import SeeAllModal from '../../../components/SeeAllModal';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BASE_URL } from '../../../constants/config';

const { width } = Dimensions.get('window');

// --- QUERIES ---
const GET_FOODS = gql`
  query GetFoods($category: String) {
    getFoods(category: $category) {
      id
      name
      price
      description
      image
      rating
      restaurant {
        name
      }
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

// --- INTERFACES ---
interface Food {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description?: string;
  restaurant?: { name: string };
}
interface GetFoodsData { getFoods: Food[]; }

interface Restaurant {
  _id: string;
  name: string;
  rating: number;
  reviews?: number;
  image?: string;
  deliveryTime?: string;
  deliveryFee?: number;
  isOpen?: boolean;
}
interface GetRestaurantsData { getRestaurants: Restaurant[]; }

const FoodScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
 const { category } = (route.params as { category?: string }) || {};
  
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState('');
  const [seeAllItems, setSeeAllItems] = useState<any[]>([]);
  const [type, setType] = useState<'restaurant' | 'food'>('restaurant');

  // --- QUERY DATA ---
  const { data: foodData, loading: foodLoading } = useQuery<GetFoodsData>(GET_FOODS, {
    variables: { category: category || 'All' },
    fetchPolicy: 'cache-and-network',
  });

  const { data: restData, loading: restLoading } = useQuery<GetRestaurantsData>(GET_RESTAURANTS, {
    variables: { category: category || 'All' },
    fetchPolicy: 'cache-and-network',
  });

  // --- XỬ LÝ DATA ---
  const foodsFromDB = (foodData?.getFoods || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    restaurant: item.restaurant?.name || '',
    price: `$${item.price}`,
    image: item.image ? { uri: item.image } : IMAGES.pizza1,
    description: item.description,
    raw: item,
  }));

  const openRestaurantsData = (restData?.getRestaurants || []).map((r: any) => {
    // Xử lý ảnh (online vs local)
    let finalUri = IMAGES.pizza1;
    if (r.image) {
       finalUri = r.image.startsWith('http') ? { uri: r.image } : { uri: `${BASE_URL}${r.image}` };
    }

    return {
      id: r._id,
      name: r.name,
      image: finalUri,
      rating: r.rating ? String(r.rating) : '4.5',
      delivery: r.deliveryFee && r.deliveryFee > 0 ? `$${r.deliveryFee}` : 'Free',
      time: r.deliveryTime || '30 min',
      raw: r,
    };
  });

  // --- NAVIGATIONS ---
  const goBack = () => navigation.goBack();
  const goToSearch = () => navigation.navigate('Search' as never);
  const goToFoodDetail = (foodItem: any) => navigation.navigate('FoodDetail', { food: foodItem });
  const goToRestaurantDetail = (item: any) => {
    navigation.navigate('RestaurantView', { 
        restaurant: item.raw,
        initialCategory: category 
    }); 
  };

  // --- RENDER HEADER (Chứa Header Top + List Restaurants) ---
  const renderHeader = () => (
    <View>
      {/* 1. Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={goBack}>
          <AntDesign name="left" color="#000" size={20} />
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category || 'All'}</Text>
          <FontAwesome name="caret-down" color={colors.primary} size={16} />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: '#181C2E', marginRight: 10 }]} onPress={goToSearch}>
            <AntDesign name="search1" color="#fff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn}>
            <MaterialCommunityIcons name="tune-vertical" color={colors.primary} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Restaurants Section (Horizontal List) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restaurants ({category})</Text>
          <TouchableOpacity onPress={() => {
              setSeeAllTitle('Open Restaurants');
              setType('restaurant');
              setSeeAllItems(openRestaurantsData);
              setSeeAllVisible(true);
          }}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>

        {restLoading ? (
           <ActivityIndicator color={colors.primary} />
        ) : openRestaurantsData.length === 0 ? (
           <Text style={styles.emptyText}>No restaurants found for this category.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={openRestaurantsData}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 5 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.restaurantCardH} 
                onPress={() => goToRestaurantDetail(item)}
              >
                <Image source={item.image} style={styles.restaurantImageH} />
                <Text style={styles.restaurantNameH} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                   <View style={styles.metaItem}>
                      <AntDesign name="star" color={colors.primary} size={12} />
                      <Text style={styles.metaText}>{item.rating}</Text>
                   </View>
                   <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="truck-delivery-outline" color="#888" size={12} />
                      <Text style={styles.metaText}>{item.delivery}</Text>
                   </View>
                   <View style={styles.metaItem}>
                      <Feather name="clock" color="#888" size={12} />
                      <Text style={styles.metaText}>{item.time}</Text>
                   </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* 3. Foods Title */}
      <View style={[styles.sectionHeader, { marginTop: 10, marginBottom: 10 }]}>
         <Text style={styles.sectionTitle}>Popular {category} </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {foodLoading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={foodsFromDB}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader} // Gắn Header vào đây để cuộn chung
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { marginTop: 50, textAlign: 'center' }]}>
                No foods found.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.foodCard} 
                onPress={() => goToFoodDetail(item.raw)}
            >
              <Image source={item.image} style={styles.foodImage} />
              <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.foodRest} numberOfLines={1}>{item.restaurant}</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{item.price}</Text>
                <View style={styles.addBtn}>
                  <AntDesign name="plus" color="#fff" size={16} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

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
    backgroundColor: '#fff',
    paddingTop: 40, // StatusBar height
    paddingHorizontal: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header Styles
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  circleBtn: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#EDEDED', borderRadius: 25,
    paddingHorizontal: 15, paddingVertical: 10,
  },
  categoryText: { fontWeight: '600', color: '#181C2E', fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },

  // Section Styles
  sectionContainer: { marginBottom: 15 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#32343E' },
  seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  emptyText: { color: '#A0A5BA', fontStyle: 'italic', fontSize: 13 },

  // Restaurant Card Horizontal
  restaurantCardH: {
    width: width * 0.7, // Chiều rộng thẻ nhà hàng
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingBottom: 10,
    // Shadow
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  restaurantImageH: {
    width: '100%', height: 130, borderRadius: 15, marginBottom: 10, backgroundColor: '#f0f0f0'
  },
  restaurantNameH: {
    fontSize: 16, fontWeight: 'bold', color: '#181C2E', paddingHorizontal: 10, marginBottom: 5
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 12
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#181C2E' },

  // Food Card Vertical (Grid)
  foodCard: {
    width: (width - 55) / 2, // Chia 2 cột, trừ padding
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 15,
    // Shadow
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  foodImage: {
    width: '100%', height: 100, borderRadius: 15, marginBottom: 10, backgroundColor: '#f0f0f0', resizeMode: 'cover'
  },
  foodName: { fontSize: 15, fontWeight: 'bold', color: '#32343E', marginBottom: 2 },
  foodRest: { fontSize: 12, color: '#9796A1', marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 16, fontWeight: 'bold', color: '#32343E' },
  addBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center'
  }
});

export default FoodScreen;