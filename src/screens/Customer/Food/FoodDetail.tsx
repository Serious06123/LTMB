import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const FoodDetailScreen = () => {
  const navigation = useNavigation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const goBack = () => {
    navigation.goBack();
  };
  const goToCart = () => {
    navigation.navigate('Cart' as never);
  };
  const handleIncrease = () => setQuantity(quantity + 1);
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.searchTitle}>Details</Text>
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
        <View style={styles.restaurantLabel}>
          <Image
            source={IMAGES.pizza1}
            style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
          />
          <Text>Uttora Coffee House</Text>
        </View>
      </View>

      {/* Food Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.foodTitle}>Burger Bistro</Text>

        <Text style={styles.foodDescription}>
          Macenas sed diam eget risus varius blandit sit amet non magna. Integer
          posuere erat a ante venenatis dapibus posuere velit aliquet.
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

        {/* Size Options */}
        <View style={styles.sizeContainer}>
          <Text style={styles.sizeTitle}>SIZE:</Text>
          <View style={[styles.sizeOptionsRow]}>
            {['10"', '14"', '16"'].map((size, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sizeOption,
                  isSelected === size && { backgroundColor: colors.primary },
                ]}
                onPress={() => setIsSelected(size)}
              >
                <Text
                  style={[
                    styles.sizeOptionText,
                    isSelected === size && {
                      color: '#fff',
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsTitle}>INGREDIENTS</Text>
          <View style={styles.ingredientsRow}>
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <View key={index} style={styles.ingredientIcon} />
              ))}
          </View>
        </View>

        {/* Price and Quantity */}
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>$32</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecrease}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrease}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.addToCartButton} onPress={goToCart}>
            <Text style={styles.addToCartText}>ADD TO CART</Text>
          </TouchableOpacity>
        </View>

        {/* Add to Cart Button */}
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
    paddingLeft: 25,
    paddingRight: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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
    marginBottom: 10,
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
    bottom: 75,
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
    marginBottom: 20,
  },
  infoContainer: {
    flex: 1,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  foodSubtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 10,
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
  foodDescription: {
    fontSize: 14,
    color: '#A0A5BA',
    marginBottom: 20,
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sizeTitle: {
    fontSize: 13,
    // fontWeight: 'bold',
    color: colors.black,
    marginBottom: 30,
    marginTop: 30,
  },
  sizeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sizeOption: {
    backgroundColor: '#F0F5FA',
    borderRadius: 50,
    padding: 15,
  },
  sizeOptionText: {
    color: colors.black,
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  ingredientsTitle: {
    fontSize: 13,
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
});

export default FoodDetailScreen;
