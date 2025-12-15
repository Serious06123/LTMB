import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { useNavigation } from '@react-navigation/native';
import mapService from '../../services/mapService';
import { useDispatch } from 'react-redux';
import { setLocation } from '../../features/general/generalSlice'; // Import action
// Import thư viện mới
import Geolocation from 'react-native-geolocation-service';

const LocationAccessScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  // Hàm xin quyền truy cập vị trí
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
            message: "App needs access to your location to set delivery address.",
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

  const handleAccessLocation = async () => {
    setLoading(true);

    // 1. Xin quyền
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setLoading(false);
      Alert.alert('Permission Denied', 'You need to allow location access to use this feature.');
      return;
    }

    // 2. Lấy tọa độ
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Coords:", latitude, longitude);

        try {
          // 3. Gọi API lấy địa chỉ
          const data = await mapService.getReverseGeocoding(latitude, longitude);

          if (data && data.results && data.results.length > 0) {
            const currentAddress = data.results[0].formatted_address;
            console.log("🏡 Address:", currentAddress);

            // 4. Chuyển màn hình với dữ liệu
            navigation.navigate('CustomerTabs', {
              screen: 'HomeTab', // <--- Phải chỉ rõ tên màn hình con bên trong Tab
              params: {       // <--- Dữ liệu phải bọc trong object params này
                address: currentAddress,
                coords: { latitude, longitude }
              }
            });
          } else {
            Alert.alert('Error', 'Could not find address from these coordinates.');
          }
        } catch (error) {
          console.error("API Error:", error);
          Alert.alert('Error', 'Failed to connect to map service.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        // Xử lý lỗi khi lấy vị trí thất bại
        console.log("GPS Error:", error.code, error.message);
        setLoading(false);
        Alert.alert('Location Error', 'Unable to get current location. Please check your GPS.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

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
      <TouchableOpacity
        style={styles.accessButton}
        onPress={handleAccessLocation}
        disabled={loading} // Khóa nút khi đang load
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.accessButtonText}>ACCESS LOCATION</Text>
            <View style={styles.accessButtonIcon}>
              <EvilIcons name="location" color="#ffffffff" size={24} />
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Description */}
      <Text style={styles.description}>
        DFOOD WILL ACCESS YOUR LOCATION ONLY WHILE USING THE APP
      </Text>
    </View>
  );
};

// ... Styles giữ nguyên không đổi ...
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
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 20,
    minWidth: 200,
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