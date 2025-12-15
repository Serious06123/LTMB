import React, { useState, useRef, useEffect } from 'react'; // Thêm useEffect
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  FlatList,
  Keyboard,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/AntDesign'; // Dùng AntDesign cho tiện

import { 
  MapView, 
  Camera, 
  PointAnnotation, 
  Callout, 
  ShapeSource, 
  LineLayer
} from '@maplibre/maplibre-react-native';

import polyline from '@mapbox/polyline'; 
import mapService from '../../../services/mapService';
import { GOONG_CONFIG } from '../../../constants/config';

interface LocationMarker {
  key: string;
  coord: [number, number]; 
  title?: string;
}

const MapScreen = () => {
  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  // 1. Dùng Ref để theo dõi vị trí thực tế (Không gây render lại khi lướt map)
  const currentCenterRef = useRef<[number, number]>([106.68213282293183, 10.76144486890968]);
  const currentZoomRef = useRef<number>(14);

  // 2. Chỉ dùng State để khởi tạo map lần đầu hoặc khi Search xong
  // (Không update cái này khi lướt map)
  const [initialCenter] = useState<[number, number]>([106.68213282293183, 10.76144486890968]); 

  const [txtLng, setTextLng] = useState('');
  const [txtLat, setTextLat] = useState('');
  const [search, setSearch] = useState('');
  const [description, setDescription] = useState<any[]>([]);
  
  const [locations, setLocations] = useState<LocationMarker[]>([
    { key: 'curr', coord: [106.68213282293183, 10.76144486890968], title: 'Vị trí của bạn' }
  ]);

  const [routeFeature, setRouteFeature] = useState<any>(null);

  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  // --- HÀM ZOOM MỚI (Dùng setCamera trực tiếp) ---
  const handleZoomIn = () => {
    const newZoom = currentZoomRef.current + 1;
    if (newZoom > 20) return;
    
    // Gọi lệnh trực tiếp vào Camera, không thông qua State
    camera.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
      animationMode: 'easeTo'
    });
    currentZoomRef.current = newZoom; // Cập nhật ref thủ công
  };

  const handleZoomOut = () => {
    const newZoom = currentZoomRef.current - 1;
    if (newZoom < 0) return;
    
    camera.current?.setCamera({
      zoomLevel: newZoom,
      animationDuration: 300,
      animationMode: 'easeTo'
    });
    currentZoomRef.current = newZoom;
  };

  // --- SỬA HÀM NÀY: Chỉ update Ref, KHÔNG set state ---
  const onRegionDidChange = (feature: any) => {
    if (feature.properties && feature.properties.zoomLevel) {
      currentZoomRef.current = feature.properties.zoomLevel;
    }
    if (feature.geometry && feature.geometry.coordinates) {
      currentCenterRef.current = feature.geometry.coordinates;
    }
  };

  const onDrawRoute = async (destinationCoord: [number, number]) => {
    const req = {
      origin: currentCenterRef.current, // Lấy từ Ref
      destination: destinationCoord,
      vehicle: 'car'
    };

    const res = await mapService.getDirections(req);

    if (res && res.routes && res.routes.length > 0) {
      const points = polyline.decode(res.routes[0].overview_polyline.points);
      const coordinates = points.map(point => [point[1], point[0]]);

      const routeGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
          },
        ],
      };
      
      setRouteFeature(routeGeoJSON);
    } else {
      Alert.alert("Thông báo", "Không tìm thấy đường đi");
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

      setTextLng(loc.lng.toString());
      setTextLat(loc.lat.toString());

      setLocations([
        { key: 'curr', coord: currentCenterRef.current, title: 'Vị trí của bạn' },
        { key: 'dest', coord: newCoord, title: item.description }
      ]);

      // Khi Search xong: Dùng setCamera để bay đến đó
      camera.current?.setCamera({
          centerCoordinate: newCoord,
          zoomLevel: 14,
          animationDuration: 1000,
          animationMode: 'flyTo' 
      });
      
      // Update Ref để đồng bộ
      currentCenterRef.current = newCoord;
      currentZoomRef.current = 14;

      onDrawRoute(newCoord);
    }
  };

  const updateSearch = (text: string) => {
    setSearch(text);
    if (text.length > 2) {
      mapService.getPlacesAutocomplete({ search: encodeURIComponent(text) })
        .then((res: any) => {
            if (res && res.predictions) setDescription(res.predictions);
        });
    } else {
        setDescription([]);
    }
  };

  const handleAddMarker = () => {
     if (!txtLng || !txtLat) return;
     const newCoord: [number, number] = [parseFloat(txtLng), parseFloat(txtLat)];
     setLocations(prev => [...prev, { key: `manual-${Date.now()}`, coord: newCoord, title: 'Điểm mới' }]);
     
     camera.current?.setCamera({ 
         centerCoordinate: newCoord, 
         zoomLevel: 14,
         animationDuration: 500,
         animationMode: 'easeTo'
     });
  };
  
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => _handleSubmit(item)} style={styles.itemSelect}>
      <Text style={{color: '#333'}}>{item.description}</Text>
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
        {/* QUAN TRỌNG: 
           - Bỏ centerCoordinate={currentLocation} 
           - Chỉ dùng defaultSettings để set vị trí ban đầu.
           - Sau đó Camera sẽ tự do di chuyển (Uncontrolled).
        */}
        <Camera
          ref={camera}
          defaultSettings={{
             centerCoordinate: initialCenter,
             zoomLevel: 14
          }}
          animationMode="flyTo" 
          animationDuration={2000} 
        />

        {routeFeature && (
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

        {locations.map((item) => (
          <PointAnnotation
            key={item.key}
            id={item.key}
            coordinate={item.coord}
          >
            <View style={styles.markerContainer}>
               <View style={[styles.markerDot, item.key === 'curr' ? {backgroundColor: '#34C759'} : {backgroundColor: '#FF3B30'}]} />
            </View>
            <Callout title={item.title || "Vị trí"} />
          </PointAnnotation>
        ))}
      </MapView>

      {/* --- ZOOM BUTTONS --- */}
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
                  keyExtractor={(item) => item.place_id}
                  keyboardShouldPersistTaps="handled"
              />
            </View>
        )}

        <View style={styles.manualRow}>
            <TextInput style={styles.inputSmall} placeholder="Lng" onChangeText={setTextLng} value={txtLng} keyboardType="numeric" />
            <TextInput style={styles.inputSmall} placeholder="Lat" onChangeText={setTextLat} value={txtLat} keyboardType="numeric" />
            <TouchableOpacity onPress={handleAddMarker} style={styles.btnAdd}><Text style={{color:'white'}}>+</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ... (Giữ nguyên phần styles)
const styles = StyleSheet.create({
  containerInput: {
    position: 'absolute', top: 50, left: 15, right: 15,
    backgroundColor: 'transparent', zIndex: 10
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 5
  },
  searchBar: {
    flex: 1, backgroundColor: 'white', borderRadius: 8, height: 46, elevation: 4
  },
  searchInputText: {
    fontSize: 14, minHeight: 46, textAlignVertical: 'center'
  },
  autocompleteList: {
    backgroundColor: '#FFF', maxHeight: 200, borderRadius: 8, elevation: 4, marginTop: 5
  },
  itemSelect: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  manualRow: {
      flexDirection: 'row', marginTop: 10, display: 'none'
  },
  inputSmall: {
      backgroundColor: 'white', height: 40, width: 80, borderRadius: 5, marginRight: 5, paddingHorizontal: 5
  },
  btnAdd: {
      backgroundColor: 'blue', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 5
  },
  markerContainer: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center', elevation: 2, shadowOpacity: 0.3
  },
  markerDot: {
    width: 16, height: 16, borderRadius: 8
  },
  zoomContainer: {
    position: 'absolute',
    right: 15,
    bottom: 100, 
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
  }
});

export default MapScreen;