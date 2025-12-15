import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { 
  MapView, 
  Camera, 
  ShapeSource, 
  LineLayer, 
  PointAnnotation, 
  Callout
} from '@maplibre/maplibre-react-native';
import polyline from '@mapbox/polyline';
import mapService from '../../../services/mapService';
import { GOONG_CONFIG } from '../../../constants/config';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const TrackOrderScreen = () => {
  const navigation = useNavigation();
  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  const [customerCoord] = useState<[number, number]>([106.68213282293183, 10.76144486890968]); 
  const [shipperCoord, setShipperCoord] = useState<[number, number]>([106.69763283207385, 10.773163613529778]); 
  const [routeFeature, setRouteFeature] = useState<any>(null);
  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  useEffect(() => {
    fetchRouteShipperToCustomer();
  }, [shipperCoord]);

  const fetchRouteShipperToCustomer = async () => {
    const req = {
      origin: shipperCoord,
      destination: customerCoord,
      vehicle: 'bike'
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
            geometry: { type: 'LineString', coordinates: coordinates },
          },
        ],
      };
      setRouteFeature(routeGeoJSON);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút Back nằm đè lên Map */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

      {/* Phần Bản Đồ */}
      <View style={styles.mapContainer}>
        <MapView
            mapStyle={goongStyleUrl}
            style={{ flex: 1 }}
            logoEnabled={false}        
            attributionEnabled={false} 
            surfaceView={true}
        >
            <Camera
            ref={camera}
            defaultSettings={{
                centerCoordinate: [
                    (shipperCoord[0] + customerCoord[0]) / 2, 
                    (shipperCoord[1] + customerCoord[1]) / 2
                ],
                zoomLevel: 13
            }}
            animationMode="flyTo" 
            animationDuration={2000} 
            />

            {routeFeature && (
            <ShapeSource id="routeSource" shape={routeFeature}>
                <LineLayer
                    id="routeFill"
                    style={{
                    lineColor: colors.primary,
                    lineWidth: 5,
                    lineCap: 'round',
                    lineJoin: 'round',
                    }}
                />
            </ShapeSource>
            )}

            <PointAnnotation id="shipper" coordinate={shipperCoord}>
            <View style={styles.shipperMarker}>
                <Feather name="circle" size={20} color="white" />
            </View>
            <Callout title="Shipper" />
            </PointAnnotation>

            <PointAnnotation id="customer" coordinate={customerCoord}>
            <View style={styles.customerMarker}>
                <Feather name="map-pin" size={20} color="white" />
            </View>
            <Callout title="Bạn" />
            </PointAnnotation>
        </MapView>
      </View>

      {/* Phần Bottom Sheet - Đặt Absolute ở dưới cùng */}
      <View style={styles.bottomSheet}>
          {/* Thanh kéo nhỏ (Visual handle) */}
          <View style={styles.dragHandle} />

          {/* Hàng 1: Thông tin Shipper + Nút bấm */}
          <View style={styles.shipperRow}>
             <View style={styles.shipperInfo}>
                {/* Avatar Shipper */}
                <Image 
                    source={IMAGES.shipperIcon || IMAGES.shipperIcon} 
                    style={styles.shipperAvatar} 
                />
                <View>
                    <Text style={styles.shipperName}>Robert Fox</Text>
                    <Text style={styles.shipperRole}>Shipper</Text>
                </View>
             </View>
             
             {/* Các nút hành động */}
             <View style={styles.actions}>
                 <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="call" size={24} color={colors.primary} />
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('ChatScreen' as never)}
                 >
                    <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
                 </TouchableOpacity>
             </View>
          </View>

          {/* Dòng kẻ phân cách */}
          {/* <View style={styles.divider} /> */}

          {/* Hàng 2: Thông tin Đơn hàng */}
          <View style={styles.orderStatusContainer}>
              <Text style={styles.statusTitle}>Đơn hàng đang đến!</Text>
              <Text style={styles.statusSubtitle}>Shipper đang cách bạn 2km</Text>
              <View style={styles.timeInfo}>
                <AntDesign name="clockcircleo" size={16} color="#666" />
                <Text style={styles.timeText}>Dự kiến: 5 phút</Text>
              </View>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1 }, // Map chiếm hết không gian còn lại
  backButton: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 5,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4
  },
  shipperMarker: {
    width: 40, height: 40, justifyContent:'center', alignItems:'center', 
    backgroundColor: '#333', borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5
  },
  customerMarker: {
    width: 40, height: 40, justifyContent:'center', alignItems:'center', 
    backgroundColor: colors.primary, borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5
  },
  
  // Bottom Sheet Styles
  bottomSheet: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'white', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
    // Shadow mạnh để nổi lên trên Map
    elevation: 20,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: -5 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
  },
  dragHandle: {
      width: 40, height: 5, backgroundColor: '#E1E1E1', borderRadius: 3, 
      alignSelf: 'center', marginBottom: 20
  },
  shipperRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  shipperInfo: {
      flexDirection: 'row', alignItems: 'center'
  },
  shipperAvatar: {
      width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#eee'
  },
  shipperName: { fontSize: 18, fontWeight: 'bold', color: '#181C2E' },
  shipperRole: { fontSize: 14, color: '#A0A5BA' },
  
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.primary,
  },

  orderStatusContainer: {
      //backgroundColor: '#F6F6F6', // Có thể thêm nền nhẹ nếu muốn tách biệt
      //borderRadius: 15,
      //padding: 15
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
  statusSubtitle: { fontSize: 14, color: '#A0A5BA', marginBottom: 10 },
  timeInfo: { flexDirection: 'row', alignItems: 'center' },
  timeText: { marginLeft: 5, color: '#666', fontSize: 14 },
});

export default TrackOrderScreen;