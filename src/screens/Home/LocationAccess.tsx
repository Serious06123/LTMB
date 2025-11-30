import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
const LocationAccessScreen = () => {
  const navigation = useNavigation();
  const goToHome = () => {
    navigation.navigate('Home' as never);
  }
  return (
    <View style={styles.container}>
      {/* Map Icon */}
      <View style={styles.mapContainer}>
        <Image
          source={require('../../assets/images/location-map.jpg')}
          style={styles.mapImage}
        />
      </View>

      {/* Access Location Button */}
      <TouchableOpacity style={styles.accessButton} onPress={goToHome}>
        <Text style={styles.accessButtonText}>ACCESS LOCATION</Text>
        <View style={styles.accessButtonIcon}> 
          <EvilIcons name="location" color="#ffffffff" size={24} />
        </View>
      </TouchableOpacity>

      {/* Description */}
      <Text style={styles.description}>
        DFOOD WILL ACCESS YOUR LOCATION ONLY WHILE USING THE APP
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  mapContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  mapImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F6F6F6',
  },
  mapMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  accessButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  accessButtonIcon: {
    backgroundColor: '#dcdcdc6a',
    borderRadius: 15,
    padding: 5,
  },
  description: {
    color: colors.gray,
    marginHorizontal: 40,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LocationAccessScreen;
