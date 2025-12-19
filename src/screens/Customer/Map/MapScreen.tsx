import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  FlatList,
  Keyboard,
  ActivityIndicator, // Thêm cái này để hiện loading khi lấy tên đường
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Thêm icon định vị
import { useNavigation, useRoute } from '@react-navigation/native'; // Thêm useRoute
import { useDispatch } from 'react-redux';
import { setDeliveryLocation } from '../../../features/cart/cartSlice';

import {
  MapView,
  Camera,
  PointAnnotation,
  Callout,
  ShapeSource,
  LineLayer,
} from '@maplibre/maplibre-react-native';

import polyline from '@mapbox/polyline';
import mapService from '../../../services/mapService';
import { GOONG_CONFIG } from '../../../constants/config';
import { colors } from '../../../theme'; // Import màu nếu cần

interface LocationMarker {
  key: string;
  coord: [number, number];
  title?: string;
}

// Helper Debounce: Tránh gọi API liên tục khi kéo map
const debounce = (func: Function, delay: number) => {
  let timeoutId: any;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const MapScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>(); // Lấy params
  const dispatch = useDispatch();

  // Kiểm tra xem có phải đang ở chế độ chọn địa chỉ không
  const isPickingMode = route.params?.isPickingMode || false;
  const returnScreen = route.params?.returnScreen || null;

  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  const currentCenterRef = useRef<[number, number]>([
    106.68213282293183, 10.76144486890968,
  ]);
  const currentZoomRef = useRef<number>(14);
  const [initialCenter] = useState<[number, number]>([
    106.68213282293183, 10.76144486890968,
  ]);

  // State hiển thị địa chỉ đang chọn
  const [addressText, setAddressText] = useState('Đang xác định vị trí...');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [txtLng, setTextLng] = useState('');
  const [txtLat, setTextLat] = useState('');
  const [search, setSearch] = useState('');
  const [description, setDescription] = useState<any[]>([]);

  const [locations, setLocations] = useState<LocationMarker[]>([
    {
      key: 'curr',
      coord: [106.68213282293183, 10.76144486890968],
      title: 'Vị trí của bạn',
    },
  ]);

  const [routeFeature, setRouteFeature] = useState<any>(null);

  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  // --- LOGIC MỚI: LẤY TÊN ĐƯỜNG TỪ TỌA ĐỘ (Reverse Geocoding) ---
  const fetchAddress = async (lng: number, lat: number) => {
    setLoadingAddress(true);
    try {
      // Gọi API Reverse (lưu ý thứ tự lat, lng tùy API, Goong thường là lat, lng)
      const res = await mapService.getReverseGeocoding(lat, lng);
      if (res && res.results && res.results.length > 0) {
        setAddressText(res.results[0].formatted_address);
      } else {
        setAddressText('Vị trí chưa xác định');
      }
    } catch (error) {
      console.log('Reverse geocode error:', error);
      setAddressText('Không thể lấy tên đường');
    }
    setLoadingAddress(false);
  };

  // Tạo hàm debounce để không spam API
  const debouncedFetchAddress = useCallback(debounce(fetchAddress, 500), []);

  const handleZoomIn = () => {
    const newZoom = currentZoomRef.current + 1;
    if (newZoom > 20) return;
    camera.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
      animationMode: 'easeTo',
    });
    currentZoomRef.current = newZoom;
  };

  const handleZoomOut = () => {
    const newZoom = currentZoomRef.current - 1;
    if (newZoom < 0) return;
    camera.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
      animationMode: 'easeTo',
    });
    currentZoomRef.current = newZoom;
  };

  // --- CẬP NHẬT: Gọi lấy địa chỉ khi map dừng di chuyển ---
  const onRegionDidChange = (feature: any) => {
    if (feature.properties && feature.properties.zoomLevel) {
      currentZoomRef.current = feature.properties.zoomLevel;
    }
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates;
      currentCenterRef.current = coords;

      // GỌI HÀM LẤY ĐỊA CHỈ MỚI
      debouncedFetchAddress(coords[0], coords[1]);
    }
  };

  // --- LOGIC MỚI: XÁC NHẬN CHỌN VỊ TRÍ ---
  const handleConfirmLocation = () => {
    if (!returnScreen) return;

    const selectedData = {
      street: addressText.split(',')[0], // Lấy phần đầu làm tên đường
      city: 'Hồ Chí Minh',
      lat: currentCenterRef.current[1],
      lng: currentCenterRef.current[0],
    };
    // Dispatch location to Redux store so PaymentScreen can read it later.
    try {
      dispatch(setDeliveryLocation(selectedData));
    } catch (err) {
      // fallback: navigate back with params if dispatch fails
      navigation.navigate({
        name: returnScreen,
        params: { selectedAddress: selectedData },
        merge: true,
      } as any);
      return;
    }

    navigation.goBack();
  };

  const onDrawRoute = async (destinationCoord: [number, number]) => {
    // ... (Giữ nguyên logic cũ của bạn)
    // Code vẽ đường...
    const req = {
      origin: currentCenterRef.current,
      destination: destinationCoord,
      vehicle: 'car',
    };
    const res = await mapService.getDirections(req);
    if (res && res.routes && res.routes.length > 0) {
      const points = polyline.decode(res.routes[0].overview_polyline.points);
      const coordinates = points.map(point => [point[1], point[0]]);
      setRouteFeature({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coordinates },
          },
        ],
      });
    }
  };

  const _handleSubmit = async (item: any) => {
    setSearch(item.description);
    setDescription([]);
    Keyboard.dismiss();

    let geocoding = await mapService.getGeocoding({
      description: encodeURIComponent(item.description),
    });

    if (geocoding.status === 'OK' && geocoding.results.length > 0) {
      const loc = geocoding.results[0].geometry.location;
      const newCoord: [number, number] = [loc.lng, loc.lat];

      setAddressText(item.description); // Cập nhật text hiển thị

      setLocations([
        { key: 'curr', coord: currentCenterRef.current, title: 'Vị trí cũ' },
        { key: 'dest', coord: newCoord, title: item.description },
      ]);

      camera.current?.setCamera({
        centerCoordinate: newCoord,
        zoomLevel: 14,
        animationDuration: 1000,
        animationMode: 'flyTo',
      });

      currentCenterRef.current = newCoord;

      // Nếu không phải chế độ pick, mới vẽ đường
      if (!isPickingMode) {
        onDrawRoute(newCoord);
      }
    }
  };

  const updateSearch = (text: string) => {
    setSearch(text);
    if (text.length > 2) {
      mapService
        .getPlacesAutocomplete({ search: encodeURIComponent(text) })
        .then((res: any) => {
          if (res && res.predictions) setDescription(res.predictions);
        });
    } else {
      setDescription([]);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => _handleSubmit(item)}
      style={styles.itemSelect}
    >
      <Text style={{ color: '#333' }}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        mapStyle={goongStyleUrl}
        style={{ flex: 1 }}
        logoEnabled={false}
        attributionEnabled={false}
        surfaceView={true}
        onRegionDidChange={onRegionDidChange}
      >
        <Camera
          ref={camera}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: 14,
          }}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {routeFeature && !isPickingMode && (
          <ShapeSource id="routeSource" shape={routeFeature}>
            <LineLayer
              id="routeFill"
              style={{
                lineColor: '#007AFF',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {/* Chỉ hiện các marker cũ nếu KHÔNG phải chế độ picking (vì picking dùng center pin) */}
        {!isPickingMode &&
          locations.map(item => (
            <PointAnnotation
              key={item.key}
              id={item.key}
              coordinate={item.coord}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerDot,
                    item.key === 'curr'
                      ? { backgroundColor: '#34C759' }
                      : { backgroundColor: '#FF3B30' },
                  ]}
                />
              </View>
              <Callout title={item.title || 'Vị trí'} />
            </PointAnnotation>
          ))}
      </MapView>

      {/* --- MARKER CỐ ĐỊNH Ở GIỮA (CHO CHẾ ĐỘ PICKING) --- */}
      {isPickingMode && (
        <View style={styles.centerMarkerContainer} pointerEvents="none">
          <MaterialIcons
            name="location-on"
            size={40}
            color="#FF3B30"
            style={{ marginBottom: 20 }}
          />
        </View>
      )}

      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Icon name="plus" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Icon name="minus" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.containerInput}>
        <View style={styles.searchRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginRight: 10,
              padding: 5,
              backgroundColor: 'white',
              borderRadius: 8,
              elevation: 2,
            }}
          >
            <Icon name="arrowleft" size={24} color="#333" />
          </TouchableOpacity>
          <Searchbar
            placeholder="Tìm địa điểm..."
            onChangeText={updateSearch}
            value={search}
            style={styles.searchBar}
            inputStyle={styles.searchInputText}
            elevation={0}
          />
        </View>

        {description.length > 0 && (
          <View style={styles.autocompleteList}>
            <FlatList
              data={description}
              renderItem={renderItem}
              keyExtractor={item => item.place_id}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>

      {/* --- BOTTOM SHEET XÁC NHẬN (CHO CHẾ ĐỘ PICKING) --- */}
      {isPickingMode && (
        <View style={styles.bottomSheet}>
          <Text style={styles.label}>Vị trí đang chọn:</Text>
          <View style={styles.addressRow}>
            {loadingAddress ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {addressText}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmLocation}
            disabled={loadingAddress}
          >
            <Text style={styles.confirmBtnText}>XÁC NHẬN VỊ TRÍ NÀY</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerInput: {
    position: 'absolute',
    top: 40,
    left: 15,
    right: 15,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    height: 46,
    elevation: 4,
  },
  searchInputText: {
    fontSize: 14,
    minHeight: 46,
    textAlignVertical: 'center',
  },
  autocompleteList: {
    backgroundColor: '#FFF',
    maxHeight: 200,
    borderRadius: 8,
    elevation: 4,
    marginTop: 5,
  },
  itemSelect: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.3,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  zoomContainer: {
    position: 'absolute',
    right: 15,
    bottom: 200, // Đẩy lên cao hơn chút để tránh BottomSheet
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
    alignItems: 'center',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    width: 30,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  // --- Style Mới ---
  centerMarkerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    paddingBottom: 20, // Để đầu kim trỏ đúng giữa
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    minHeight: 40,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  confirmBtn: {
    backgroundColor: '#007AFF', // Hoặc colors.primary
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default MapScreen;
