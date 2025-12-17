import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,        // <--- Mới
  PermissionsAndroid, // <--- Mới
  Alert            // <--- Mới
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux'; // <--- Thêm useDispatch
import DiscountPopup from '../../../components/DiscountPopup';
import SeeAllModal from '../../../components/SeeAllModal';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Categories will be loaded from backend via GraphQL
const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      _id
      name
      image
    }
  }
`;

// GraphQL: fetch restaurants
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
      createdAt
    }
  }
`;

interface Category {
  _id: string;
  name: string;
  image: string;
}
interface GetCategoriesData {
  getCategories: Category[];
}

interface Restaurant {
  id: string;
  name: string;
  details: string;
  rating: string;
  delivery: string;
  time: string;
  image: string | { uri: string };
}
interface GetRestaurantsData {
  getRestaurants: Restaurant[];
}

export default function HomeScreen() {
  const [showDiscount, setShowDiscount] = useState(false);
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState('');
  const [seeAllItems, setSeeAllItems] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch(); // <--- Khởi tạo dispatch

  // Lấy location từ Redux
  const currentLocation = useSelector((state: any) => state.general.currentLocation);
  const displayAddress = currentLocation?.address || 'Đang tải vị trí...';
  
  const route = useRoute();

  const {
    data: catData,
    loading: catLoading,
    error: catError,
  } = useQuery(GET_CATEGORIES);

  const {
    data: restData,
    loading: restLoading,
    error: restError,
  } = useQuery<GetRestaurantsData>(GET_RESTAURANTS);

  const restaurants = (restData?.getRestaurants || []).map((r: any) => ({
    id: r._id,
    name: r.name,
    details: r.categories?.map((c: any) => c.name).join(' - ') || '',
    rating: r.rating ? String(r.rating) : '4.0',
    delivery: r.deliveryFee && r.deliveryFee > 0 ? `${r.deliveryFee}` : 'Free',
    time: r.deliveryTime || '',
    image: r.image || IMAGES.pizza1,
    raw: r,
  }));
  console.log('Restaurants loaded:', restError);
  // Debug logs to help diagnose missing categories
  // useEffect(() => {
  //   console.log('[HomeScreen] GET_CATEGORIES loading:', catLoading);
  //   if (catError) {
  //     console.error('[HomeScreen] GET_CATEGORIES error:', catError);
  //   }
  //   if (catData) {
  //     console.log('[HomeScreen] GET_CATEGORIES data:', catData);
  //   }
  // }, [catData, catLoading, catError]);

  // Fix: Ensure catData is typed to match the GraphQL response

  const categories = (catData as GetCategoriesData)?.getCategories || [];

  const goToCart = () => {
    navigation.navigate('Cart' as never);
  };

  const goToSearch = () => {
    navigation.navigate('Search' as never);
  };

  // --- LOGIC LẤY VỊ TRÍ (Được copy và chỉnh sửa từ LocationAccess) ---
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "App needs access to your location.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return false;
  };

  const fetchCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await mapService.getReverseGeocoding(latitude, longitude);
          if (data && data.results && data.results.length > 0) {
            const currentAddress = data.results[0].formatted_address;
            // Lưu vào Redux để hiển thị
            dispatch(setLocation({
                address: currentAddress,
                coords: { latitude, longitude }
            }));
          }
        } catch (error) {
          console.error("API Error:", error);
        }
      },
      (error) => {
        console.log("GPS Error:", error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  // ------------------------------------------------------------------

  // Effect hiển thị popup giảm giá
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDiscount(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Effect kiểm tra vị trí: Nếu chưa có address thì tự động lấy lại
  useEffect(() => {
    if (!currentLocation?.address) {
      fetchCurrentLocation();
    }
  }, [currentLocation]); // Chạy lại khi currentLocation thay đổi (hoặc khởi tạo)

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={{ flex: 1 }}>
        <View style={styles.headerSection}>
          <View style={styles.deliveryInfo}>
            <TouchableOpacity style={styles.menuButton}>
              <Icon name="menu" size={24} color={colors.black} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'column' }}>
              <Text style={styles.deliveryText}>DELIVER TO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                
                {/* Hiển thị địa chỉ */}
                <Text numberOfLines={1} style={{ maxWidth: 200, fontWeight: 'bold' }}>
                    {displayAddress}
                </Text>

                <AntDesign
                  style={{ marginLeft: 10 }}
                  name="caretdown"
                  color={colors.secondary}
                  size={15}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.cartButton} onPress={goToCart}>
              <MaterialCommunityIcons name="cart" color="#fff" size={24} />
              <View style={styles.notify}>
                <Text style={styles.notifyText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* ... Phần còn lại giữ nguyên ... */}
          <Text style={styles.greetingText}>
            Hey Halal,{' '}
            <Text style={{ fontWeight: 'bold' }}>Good Afternoon!</Text>
          </Text>
          <TouchableOpacity style={styles.searchInput} onPress={goToSearch}>
            <AntDesign name="search1" color="#A0A5BA" size={24} />
            <Text> Search dishes, restaurants</Text>
          </TouchableOpacity>
        </View>

        {/* ... Categories Section giữ nguyên ... */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Categories</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                // Open modal immediately so user sees instant feedback (spinner if loading)
                setSeeAllTitle('All Categories');
                setSeeAllVisible(true);
                setSeeAllItems(categories);
              }}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <AntDesign name="right" color="#A0A5BA" size={15} />
            </TouchableOpacity>
          </View>
          <FlatList
            style={{ marginBottom: 16, paddingLeft: 5 }}
            horizontal
            data={categories}
            keyExtractor={item => (item._id ? item._id : String(item._id))}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <View style={styles.categoryContainer}>
                  <Image
                    source={item.image ? { uri: item.image } : IMAGES.pizza1}
                    style={styles.categoryImage}
                  />
                </View>
                <Text style={styles.categoryText}>{item.name}</Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>
      
      {/* ... Restaurants Section giữ nguyên ... */}
      <View style={{ flex: 1 }}>
         {/* Nội dung Restaurants giữ nguyên như cũ */}
         <View style={styles.restaurantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Restaurants</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                setSeeAllTitle('Open Restaurants');
                setSeeAllItems(restaurants);
                setSeeAllVisible(true);
              }}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <AntDesign name="right" color="#A0A5BA" size={15} />
            </TouchableOpacity>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={restaurants}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.restaurantItem}>
                <View style={styles.restaurantImagePlaceholder}>
                  <Image style={styles.restaurantImage} source={item.image} />
                </View>
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantDetails}>{item.details}</Text>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.restaurantMetaDetails}>
                      <AntDesign name="staro" color={colors.primary} size={20} />
                      <Text>{item.rating}</Text>
                    </View>
                    <View style={styles.restaurantMetaDetails}>
                      <MaterialCommunityIcons name="truck-fast-outline" color={colors.primary} size={20} />
                      <Text>{item.delivery}</Text>
                    </View>
                    <View style={styles.restaurantMetaDetails}>
                      <Feather name="clock" color={colors.primary} size={20} />
                      <Text>{item.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      </View>
      {showDiscount && <DiscountPopup onClose={() => setShowDiscount(false)} />}
      <SeeAllModal
        visible={seeAllVisible}
        title={seeAllTitle}
        items={seeAllItems}
        onClose={() => setSeeAllVisible(false)}
      />
    </View>
  );
}

// ... styles giữ nguyên không thay đổi ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 40,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 30,
    paddingBottom: 30,
  },
  headerSection: {
    marginBottom: 16,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  menuButton: {
    marginRight: 20,
    backgroundColor: '#ECF0F4',
    padding: 8,
    borderRadius: 50,
  },
  deliveryText: {
    fontSize: 12,
    color: colors.primary,
  },
  deliveryLocation: {
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#181C2E',
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 50,
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
  greetingText: {
    fontSize: 18,
    marginBottom: 16,
    marginTop: 8,
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
  categoriesSection: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#32343E',
  },
  seeAllText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContainer: {
    width: 100,
    height: 100,
    borderRadius: 15,
    padding: 8,
    paddingBottom: 16,
    backgroundColor: '#ffffffff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  categoryImage: {
    flex: 1,
    borderRadius: 20,
    width: '100%',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  restaurantsSection: {
    marginBottom: 16,
  },
  restaurantItem: {
    height: 228,
    flexDirection: 'column',
    marginBottom: 16,
  },
  restaurantImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#ccc',
    marginRight: 16,
  },
  restaurantImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  restaurantInfo: {
    marginTop: 12,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  restaurantDetails: {
    fontSize: 14,
    color: '#A0A5BA',
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#888',
  },
  restaurantMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
