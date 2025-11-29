import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors } from '../../theme';

const FoodScreen = () => {
  const popularBurgers = [
    { name: 'Burger Bistro', restaurant: 'Rose Garden', price: '$40' },
    {
      name: 'Smokin’ Burger',
      restaurant: 'Cafeteria Restaurant',
      price: '$60',
    },
    { name: 'Buffalo Burgers', restaurant: 'Kaiji Firm Kitchen', price: '$75' },
    { name: 'Bullseye Burgers', restaurant: 'Kabab Restaurant', price: '$94' },
  ];

  const openRestaurants = [
    {
      name: 'Open Restaurant 1',
      image: require('../../assets/images/pizza1.png'),
    },
    {
      name: 'Open Restaurant 2',
      image: require('../../assets/images/pizza1.png'),
    },
  ];

  const tastyTreatGallery = [
    {
      name: 'Tasty Treat 1',
      rating: 4.7,
      image: require('../../assets/images/pizza1.png'),
    },
    {
      name: 'Tasty Treat 2',
      rating: 4.3,
      image: require('../../assets/images/pizza1.png'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>BURGER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Burgers */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Popular Burgers</Text>
        <FlatList
          data={popularBurgers}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imagePlaceholder} />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.restaurant}</Text>
              <Text style={styles.cardPrice}>{item.price}</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Open Restaurants */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Open Restaurants</Text>
        <FlatList
          horizontal
          data={openRestaurants}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.restaurantCard}>
              <Image source={item.image} style={styles.restaurantImage} />
              <Text style={styles.restaurantName}>{item.name}</Text>
            </View>
          )}
        />
      </View>

      {/* Tasty Treat Gallery */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Tasty Treat Gallery</Text>
        <FlatList
          horizontal
          data={tastyTreatGallery}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.treatCard}>
              <Image source={item.image} style={styles.treatImage} />
              <Text style={styles.treatName}>{item.name}</Text>
              <Text style={styles.treatRating}>⭐ {item.rating}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#676767',
    borderRadius: 10,
    padding: 16,
    margin: 8,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray,
    borderRadius: 40,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  restaurantCard: {
    alignItems: 'center',
    marginRight: 20,
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.black,
  },
  treatCard: {
    alignItems: 'center',
    marginRight: 20,
  },
  treatImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  treatName: {
    fontSize: 14,
    color: colors.black,
  },
  treatRating: {
    fontSize: 14,
    color: colors.primary,
  },
});

export default FoodScreen;
