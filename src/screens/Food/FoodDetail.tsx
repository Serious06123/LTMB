import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme';

const FoodDetailScreen = () => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => setQuantity(quantity + 1);
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>❤️</Text>
        </TouchableOpacity>
      </View>

      {/* Image Placeholder */}
      <View style={styles.imagePlaceholder} />

      {/* Food Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.foodTitle}>Burger Bistro</Text>
        <Text style={styles.foodSubtitle}>Rose Garden</Text>

        <View style={styles.foodDetailsRow}>
          <Text style={styles.foodDetail}>⭐ 4.7</Text>
          <Text style={styles.foodDetail}>Free</Text>
          <Text style={styles.foodDetail}>20 min</Text>
        </View>

        <Text style={styles.foodDescription}>
          Macenas sed diam eget risus varius blandit sit amet non magna. Integer
          posuere erat a ante venenatis dapibus posuere velit aliquet.
        </Text>

        {/* Size Options */}
        <View style={styles.sizeContainer}>
          <Text style={styles.sizeTitle}>SIZE:</Text>
          <View style={styles.sizeOptionsRow}>
            {['10"', '14"', '16"'].map((size, index) => (
              <TouchableOpacity key={index} style={styles.sizeOption}>
                <Text style={styles.sizeOptionText}>{size}</Text>
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

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartText}>ADD TO CART</Text>
        </TouchableOpacity>
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
  backButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backIcon: {
    fontSize: 16,
    color: colors.black,
  },
  favoriteButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  favoriteIcon: {
    fontSize: 16,
    color: colors.black,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
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
    color: colors.black,
    marginBottom: 20,
  },
  sizeContainer: {
    marginBottom: 20,
  },
  sizeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  sizeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeOption: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sizeOptionText: {
    color: colors.black,
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  ingredientsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ingredientIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#676767',
    borderRadius: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#676767',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quantityButtonText: {
    fontSize: 16,
    color: colors.black,
  },
  quantityText: {
    fontSize: 16,
    color: colors.black,
    marginHorizontal: 10,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default FoodDetailScreen;
