import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
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
const FoodScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = (route.params as { category?: string }) || {};
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState('');
  const [seeAllItems, setSeeAllItems] = useState<any[]>([]);
  const goBack = () => {
    navigation.goBack();
  };
  const goToSearch = () => {
    navigation.navigate('Search' as never);
  };
  const goToFoodDetail = () => {
    navigation.navigate('FoodDetail' as never);
  };
  const popularBurgers = [
    {
      id: 1,
      name: 'Burger Bistro',
      restaurant: 'Rose Garden',
      price: '$40',
      image: IMAGES.pizza1,
    },
    {
      id: 2,
      name: 'Smokin’ Burger',
      restaurant: 'Cafeteria Restaurant',
      price: '$60',
      image: IMAGES.pizza1,
    },
    {
      id: 3,
      name: 'Buffalo Burgers',
      restaurant: 'Kaiji Firm Kitchen',
      price: '$75',
      image: IMAGES.pizza1,
    },
    {
      id: 4,
      name: 'Bullseye Burgers',
      restaurant: 'Kabab Restaurant',
      price: '$94',
      image: IMAGES.pizza1,
    },
    {
      id: 5,
      name: 'Kimmi Burgers',
      restaurant: 'Kabab Restaurant',
      price: '$94',
      image: IMAGES.pizza1,
    },
    {
      id: 6,
      name: 'Charset Burgers',
      restaurant: 'Kabab Restaurant',
      price: '$94',
      image: IMAGES.pizza1,
    },
  ];

  const openRestaurants = [
    // will be replaced by backend data
  ];

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

  const { data: restData } = useQuery(GET_RESTAURANTS);
  const openRestaurantsData = (restData?.getRestaurants || []).map(
    (r: any, idx: number) => ({
      id: idx + 1,
      name: r.name,
      image: r.image || IMAGES.pizza1,
      rating: r.rating ? String(r.rating) : '4.5',
      delivery:
        r.deliveryFee && r.deliveryFee > 0 ? `${r.deliveryFee}` : 'Free',
      time: r.deliveryTime || '',
      raw: r,
    }),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.foodSearchInfo}>
        <TouchableOpacity style={styles.pressButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>

        <View style={styles.keywordButton}>
          <Text style={styles.keywordText}>{category || 'Burger'}</Text>
          <FontAwesome name="caret-down" color={colors.primary} size={24} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginLeft: 'auto',
          }}
        >
          <Pressable
            onPress={goToSearch}
            style={[styles.pressButton, { backgroundColor: '#000' }]}
          >
            <AntDesign name="search1" color="#ffffffff" size={24} />
          </Pressable>
          <View style={styles.pressButton}>
            <MaterialCommunityIcons
              name="tune-vertical"
              color={colors.primary}
              size={30}
            />
          </View>
        </View>
      </View>

      {/* Popular Burgers */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Popular Burgers</Text>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={popularBurgers}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image} style={styles.imagePlaceholder} />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.restaurant}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text style={styles.cardPrice}>{item.price}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={goToFoodDetail}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* Open Restaurants */}
      <View style={[styles.sectionContainer, { flex: 3 }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.sectionTitle}>Open Restaurants</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Open Restaurants');
              setSeeAllItems(openRestaurants);
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={openRestaurantsData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.restaurantCard}>
              <Image source={item.image} style={styles.restaurantImage} />
              <Text style={styles.restaurantName}>{item.name}</Text>
              <View style={styles.restaurantMeta}>
                <View style={styles.restaurantMetaDetails}>
                  <AntDesign name="staro" color={colors.primary} size={20} />
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
  pressButton: {
    marginRight: 15,
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.black,
  },
  sortButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortIcon: {
    fontSize: 16,
    color: colors.black,
  },
  sectionContainer: {
    flex: 7,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    // fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 8,
    margin: 8,
    elevation: 5,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.gray,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    // marginTop: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 10,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  restaurantCard: {
    width: '100%',
    borderRadius: 11,
    marginBottom: 20,
    // alignItems: 'center',
    // marginRight: 20,
    // marginLeft: 15,
  },
  restaurantImage: {
    width: 360,
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 20,
    color: colors.black,
  },
  foodSearchInfo: {
    // flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  keywordButton: {
    // backgroundColor: colors.lightGray,
    flexDirection: 'row',
    gap: 10,
    width: 102,
    height: 46,
    borderWidth: 2,
    borderColor: '#EDEDED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  keywordText: {
    color: colors.black,
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
  seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default FoodScreen;
