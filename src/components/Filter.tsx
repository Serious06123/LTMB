import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/index';
import AntDesign from 'react-native-vector-icons/AntDesign';

const Filter = ({ onClose }: { onClose: () => void }) => {
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('10-15 min');
  const [selectedPricing, setSelectedPricing] = useState('$');
  const [selectedRating, setSelectedRating] = useState(4);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Filter your search</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <AntDesign name="close" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Offers */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>OFFERS</Text>
        <View style={styles.optionsRow}>
          {['Delivery', 'Pick Up', 'Offer', 'Online payment available'].map(
            (offer, index) => (
              <TouchableOpacity key={index} style={styles.optionButton}>
                <Text style={styles.optionText}>{offer}</Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      {/* Delivery Time */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>DELIVER TIME</Text>
        <View style={styles.optionsRow}>
          {['10-15 min', '20 min', '30 min'].map((time, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedDeliveryTime === time
                  ? styles.selectedOption
                  : { borderWidth: 1, borderColor: '#E0E0E0' },
              ]}
              onPress={() => setSelectedDeliveryTime(time)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDeliveryTime === time && styles.selectedOptionText,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>PRICING</Text>
        <View style={styles.optionsRow}>
          {['$', '$$', '$$$'].map((price, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedPricing === price && styles.selectedOption,
              ]}
              onPress={() => setSelectedPricing(price)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedPricing === price && styles.selectedOptionText,
                ]}
              >
                {price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rating */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>RATING</Text>
        <View style={styles.optionsRow}>
          {[1, 2, 3, 4, 5].map((rating, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.ratingButton]}
              onPress={() => setSelectedRating(rating)}
            >
              <AntDesign
                name="star"
                size={20}
                color={selectedRating >= rating ? colors.primary : colors.gray}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterButtonText}>FILTER</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    // fontWeight: 'bold',
    color: colors.black,
  },
  closeButton: {
    backgroundColor: '#ECF0F4',
    borderRadius: 50,
    padding: 5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F6F6F6',
    borderRadius: 50,
  },
  optionText: {
    fontSize: 14,
    color: colors.black,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  selectedOptionText: {
    color: colors.white,
  },
  ratingButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 50,
    padding: 10,
    marginHorizontal: 5,
  },
  filterButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  filterButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Filter;
