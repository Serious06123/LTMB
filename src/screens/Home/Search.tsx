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
import { colors } from '../../theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/core';
import { useState } from 'react';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const goToCart = () => {
    navigation.navigate('Cart' as never);
  };
  const goBack = () => {
    navigation.goBack();
  }
  const goToFoodSearch = () => {
    navigation.navigate('Food' as never);
  }
  const data = [
    {
      id: '1',
      name: 'Pansi Restaurant',
      rating: 4.7,
      image: require('../../assets/images/pizza1.png'),
    },
    {
      id: '2',
      name: 'American Spicy Burger Shop',
      rating: 4.3,
      image: require('../../assets/images/pizza1.png'),
    },
    {
      id: '3',
      name: 'Cafeteria Coffee Club',
      rating: 4.0,
      image: require('../../assets/images/pizza1.png'),
    },
    {
      id: '4',
      name: 'Cafeteria Club',
      rating: 4.0,
      image: require('../../assets/images/pizza1.png'),
    },
  ];
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
          data={['Burger', 'Sandwich', 'Pizza', 'Sandwich']}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.keywordButton} onPress={goToFoodSearch}>
              <Text style={styles.keywordText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Suggested Restaurants */}
      <View style={styles.suggestedContainer}>
        <Text style={styles.sectionTitle}>Suggested Restaurants</Text>
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.restaurantItem}>
              <Image source={item.image} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AntDesign name="staro" color={colors.primary} size={15} />
                  <Text style={styles.restaurantRating}>{item.rating}</Text>
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Popular Fast Food */}
      <View style={styles.popularContainer}>
        <Text style={styles.sectionTitle}>Popular Fast Food</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              id: '1',
              name: 'European Pizza',
              restaurant: 'Pansi Restaurant',
              image: require('../../assets/images/pizza1.png'),
            },
            {
              id: '2',
              name: 'Buffalo Pizza',
              restaurant: 'Pansi Restaurant',
              image: require('../../assets/images/pizza2.png'),
            },
            {
              id: '3',
              name: 'Buffalo Pizza',
              restaurant: 'Pansi Restaurant',
              image: require('../../assets/images/pizza2.png'),
            },
          ]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.foodItem}>
              <Image source={item.image} style={styles.foodImage} />
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={{ color: '#646982', fontSize: 13 }}>
                {item.restaurant}
              </Text>
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
    // backgroundColor: colors.lightGray,
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
});

export default SearchScreen;
