import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import { useNavigation, useRoute } from '@react-navigation/native'; // <--- Đã thêm useRoute
import { useSelector } from 'react-redux';
import DiscountPopup from '../../../components/DiscountPopup';

const categories = [
  {
    id: '1',
    name: 'Hot Dog',
    image: IMAGES.pizza1,
  },
  { id: '2', name: 'Burger', image: IMAGES.pizza1 },
  { id: '3', name: 'Pizza', image: IMAGES.pizza1 },
  { id: '4', name: 'Salad', image: IMAGES.pizza1 },
];

const restaurants = [
  {
    id: '1',
    name: 'Rose Garden Restaurant',
    details: 'Burger - Chicken - Rice - Wings',
    rating: '4.7',
    delivery: 'Free',
    time: '20 min',
    image: IMAGES.pizza1,
  },
  {
    id: '2',
    name: 'Another Restaurant',
    details: 'Pizza - Pasta - Salad',
    rating: '⭐ 4.5',
    delivery: 'Free',
    time: '15 min',
    image: IMAGES.pizza1,
  },
  {
    id: '3',
    name: 'Another Restaurant',
    details: 'Pizza - Pasta - Salad',
    rating: '⭐ 4.5',
    delivery: 'Free',
    time: '15 min',
    image: IMAGES.pizza1,
  },
];

export default function HomeScreen() {
  
  const [showDiscount, setShowDiscount] = useState(false);
  const navigation = useNavigation<any>();
  const currentLocation = useSelector((state: any) => state.general.currentLocation);
  const displayAddress = currentLocation?.address || 'Đang tải vị trí...';
  
  // <--- Code mới thêm
  const route = useRoute();
  // ------------------

  const goToCart = () => {
    navigation.navigate('Cart' as never);
  };

  const goToSearch = () => {
    navigation.navigate('Search' as never);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDiscount(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
                {/* <--- Code mới sửa: Hiển thị địa chỉ động */}
                <Text numberOfLines={1} style={{ maxWidth: 200, fontWeight: 'bold' }}>
                    {displayAddress || 'Current Location'}
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
          <Text style={styles.greetingText}>
            Hey Halal,{' '}
            <Text style={{ fontWeight: 'bold' }}>Good Afternoon!</Text>
          </Text>
          <TouchableOpacity style={styles.searchInput} onPress={goToSearch}>
            <AntDesign name="search1" color="#A0A5BA" size={24} />
            <Text> Search dishes, restaurants</Text>
          </TouchableOpacity>
        </View>
        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Categories</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <AntDesign name="right" color="#A0A5BA" size={15} />
            </TouchableOpacity>
          </View>
          <FlatList
            style={{ marginBottom: 16, paddingLeft: 5 }}
            horizontal
            data={categories}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <View style={styles.categoryContainer}>
                  <Image
                    source={item.image}
                    style={styles.categoryImage}
                  ></Image>
                </View>
                <Text style={styles.categoryText}>{item.name}</Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {/* Open Restaurants Section */}
        <View style={styles.restaurantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Restaurants</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
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
                      <AntDesign
                        name="staro"
                        color={colors.primary}
                        size={20}
                      />
                      <Text>{item.rating}</Text>
                    </View>
                    <View style={styles.restaurantMetaDetails}>
                      <MaterialCommunityIcons
                        name="truck-fast-outline"
                        color={colors.primary}
                        size={20}
                      />
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
      {showDiscount && (
          <DiscountPopup onClose={() => setShowDiscount(false)} />
      )}
    </View>
  );
}

// ... styles giữ nguyên ...
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
    // fontWeight: 'bold',
    // marginLeft: 4,
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
    // fontWeight: 'bold',
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
    // fontWeight: 'bold',
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
    // flex: 1,
    // justifyContent: 'center',
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