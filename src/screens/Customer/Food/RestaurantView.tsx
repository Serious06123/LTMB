import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  FlatList,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Filter from '../../../components/Filter';

const RestaurantViewScreen = () => {
  const navigation = useNavigation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selected, setSelected] = useState<string>('Burger');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const goToFoodDetail = () => {
    navigation.navigate('FoodDetail' as never);
  };
  const goBack = () => {
    navigation.goBack();
  };
  const foodData = [
    {
      id: '1',
      name: 'Burger Bistro',
      restaurant: 'Spicy Restaurant',
      price: '$12.99',
      image: IMAGES.pizza1,
    },
    {
      id: '2',
      name: 'Cheese Burger',
      restaurant: 'Spicy Restaurant',
      price: '$10.99',
      image: IMAGES.pizza1,
    },
    {
      id: '3',
      name: 'Double Burger',
      restaurant: 'Spicy Restaurant',
      price: '$14.99',
      image: IMAGES.pizza1,
    },
    {
      id: '4',
      name: 'Veggie Burger',
      restaurant: 'Spicy Restaurant',
      price: '$9.99',
      image: IMAGES.pizza1,
    },
    {
      id: '5',
      name: 'Chicken Burger',
      restaurant: 'Spicy Restaurant',
      price: '$11.99',
      image: IMAGES.pizza1,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.searchTitle}>Restaurant View</Text>
        <TouchableOpacity
          style={styles.seeMore}
          onPress={() => setIsFilterVisible(true)}
        >
          <AntDesign name="ellipsis1" color="#000" size={24} />
        </TouchableOpacity>
      </View>

      {/* Image Placeholder */}
      <View style={styles.imageContainer}>
        <Image
          source={IMAGES.pizza1}
          style={styles.imagePlaceholder}
        />
        <Pressable
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.favoriteButton}
        >
          {isFavorite ? (
            <AntDesign name="heart" color="#ff0000" size={24} />
          ) : (
            <Feather name="heart" color="#ffffffff" size={24} />
          )}
        </Pressable>
      </View>

      {/* Food Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.restaurantTitle}>Spicy Restaurant</Text>

        <Text style={styles.restaurantDescription}>
          Maecenas sed diam eget risus varius blandit sit amet non magna.
          Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.restaurantMetaDetails}>
            <AntDesign name="staro" color={colors.primary} size={20} />
            <Text>4.7</Text>
          </View>
          <View style={styles.restaurantMetaDetails}>
            <MaterialCommunityIcons
              name="truck-fast-outline"
              color={colors.primary}
              size={20}
            />
            <Text>Free</Text>
          </View>
          <View style={styles.restaurantMetaDetails}>
            <Feather name="clock" color={colors.primary} size={20} />
            <Text>30 mins</Text>
          </View>
        </View>

        <View style={styles.recentFoodContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['Burger', 'Sandwich', 'Pizza', 'Hamburger']}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) =>
              selected === item ? (
                <TouchableOpacity
                  style={[
                    styles.keywordButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.keywordText, { color: colors.white }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.keywordButton,
                    { borderColor: '#EDEDED', borderWidth: 2 },
                  ]}
                  onPress={() => setSelected(item)}
                >
                  <Text style={styles.keywordText}>{item}</Text>
                </TouchableOpacity>
              )
            }
          />
        </View>

        <View style={styles.foodsContainer}>
          <Text style={styles.foodSubtitle}>{selected} (10)</Text>
          <FlatList
            showsVerticalScrollIndicator={false}
            numColumns={2}
            data={foodData.filter(item => item.name.includes(selected))}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.foodItem}>
                <Image source={item.image} style={styles.foodImage} />
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodRestaurant}>{item.restaurant}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.foodPrice}>{item.price}</Text>
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
      </View>
      {isFilterVisible && (
        <View style={styles.filterContainer}>
          <Filter onClose={() => setIsFilterVisible(false)} />
        </View>
      )}
      {isFilterVisible && <View style={styles.overlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 40,
    paddingTop: 40,
    paddingLeft: 25,
    paddingRight: 25,
  },
  headerContainer: {
    flex: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
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
  backIcon: {
    fontSize: 16,
    color: colors.black,
  },
  searchTitle: {
    fontSize: 20,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  favoriteButton: {
    backgroundColor: '#98a8b81a',
    borderRadius: 50,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 15,
    right: 20,
  },
  favoriteIcon: {
    fontSize: 16,
    color: colors.black,
  },
  imagePlaceholder: {
    width: '100%',
    height: 184,
    backgroundColor: colors.gray,
    borderRadius: 10,
  },

  restaurantTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    // color: colors.black,
    // marginBottom: 10,
  },
  foodSubtitle: {
    fontSize: 20,
    // color: colors.gray,
    marginBottom: 20,
  },
  foodDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  foodDetail: {
    fontSize: 14,
    color: colors.gray,
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#A0A5BA',
    marginBottom: 20,
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  ingredientsTitle: {
    fontSize: 20,
    // fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15,
  },
  ingredientsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ingredientIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#FFEBE4',
    borderRadius: 50,
  },
  priceContainer: {
    backgroundColor: '#F0F5FA',
    flexDirection: 'column',
    marginBottom: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  priceText: {
    fontSize: 24,
    // fontWeight: 'bold',
    color: colors.black,
  },
  quantityContainer: {
    backgroundColor: '#121223',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#aaa4a488',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 10,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  restaurantLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
    borderColor: '#E9E9E9',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 8,
    fontSize: 12,
    color: '#888',
  },
  restaurantMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMore: {
    marginLeft: 'auto',
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
  },
  recentFoodContainer: {
    flex: 1,
    marginTop: 20,
    marginBottom: 30,
  },
  keywordButton: {
    width: 102,
    height: 46,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  keywordText: {
    color: colors.black,
  },
  foodItem: {
    width: '45%',
    marginBottom: 20,
    marginRight: '5%',
    elevation: 3,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
  },
  foodImage: {
    width: '100%',
    height: 79,
    borderRadius: 10,
    marginBottom: 10,
  },
  foodName: {
    fontSize: 15,
    color: colors.black,
    marginBottom: 5,
  },
  foodRestaurant: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 5,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  foodsContainer: {
    flex: 6,
  },
  infoContainer: {
    marginTop: 20,
    flex: 3,
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
  filterContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -155 }, { translateY: -250 }],
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    elevation: 5,
    padding: 20,
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 28, 46, 0.8)',
    zIndex: 1,
  },
});

export default RestaurantViewScreen;
