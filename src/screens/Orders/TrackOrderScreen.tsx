import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { 
  MapView, 
  Camera, 
  ShapeSource, 
  LineLayer, 
  PointAnnotation, 
  Callout
} from '@maplibre/maplibre-react-native';
import polyline from '@mapbox/polyline';
import MapAPi from '../../core/api/MapAPI';
import { GOONG_CONFIG } from '../../core/api/constant';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import * as IMAGES from '../../constants/images';
// Import hình ảnh shipper (nếu có)

const TrackOrderScreen = () => {
  const navigation = useNavigation();
  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  // 1. Tọa độ Khách hàng (Cố định)
  const [customerCoord] = useState<[number, number]>([106.68213282293183, 10.76144486890968]); // Ví dụ: Lăng Bác
  
  // 2. Tọa độ Shipper (Giả lập đang di chuyển)
  const [shipperCoord, setShipperCoord] = useState<[number, number]>([106.69763283207385, 10.773163613529778]); 
  const [routeFeature, setRouteFeature] = useState<any>(null);
  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  useEffect(() => {
    // Gọi hàm tìm đường ngay khi mở màn hình
    fetchRouteShipperToCustomer();
    
    // (Tuỳ chọn) Thiết lập interval để cập nhật vị trí shipper mỗi 10s
    // const interval = setInterval(fetchRouteShipperToCustomer, 10000);
    // return () => clearInterval(interval);
  }, [shipperCoord]); // Chạy lại khi vị trí shipper thay đổi

  const fetchRouteShipperToCustomer = async () => {
    const req = {
      origin: shipperCoord,   // Điểm bắt đầu: Shipper
      destination: customerCoord, // Điểm đến: Khách hàng
      vehicle: 'bike'
    };

    const res = await MapAPi.getDirections(req);

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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

      <MapView
        mapStyle={goongStyleUrl}
        style={{ flex: 1 }}
        logoEnabled={false}        
        attributionEnabled={false} 
        surfaceView={true}
      >
        <Camera
          ref={camera}
          // Căn chỉnh camera để thấy cả Shipper và Khách
          defaultSettings={{
             centerCoordinate: [
                (shipperCoord[0] + customerCoord[0]) / 2, 
                (shipperCoord[1] + customerCoord[1]) / 2
             ],
             zoomLevel: 14 // Zoom gần hơn để thấy rõ đoạn đường ngắn
          }}
          animationMode="flyTo" 
          animationDuration={2000} 
        />

        {/* Vẽ đường đi từ Shipper -> Khách */}
        {routeFeature && (
           <ShapeSource id="routeSource" shape={routeFeature}>
              <LineLayer
                id="routeFill"
                style={{
                  lineColor: colors.primary, // Màu chủ đạo
                  lineWidth: 5,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
           </ShapeSource>
        )}

        {/* Marker 1: SHIPPER (Xe máy) */}
        <PointAnnotation id="shipper" coordinate={shipperCoord}>
           <View style={styles.shipperMarker}>
              {/* Bạn có thể thay bằng Icon xe máy */}
              <AntDesign name="car" size={20} color="white" />
           </View>
           <Callout title="Shipper" />
        </PointAnnotation>

        {/* Marker 2: KHÁCH HÀNG (Nhà) */}
        <PointAnnotation id="customer" coordinate={customerCoord}>
           <View style={styles.customerMarker}>
              <AntDesign name="home" size={20} color="white" />
           </View>
           <Callout title="Bạn" />
        </PointAnnotation>

      </MapView>

      <View style={styles.bottomSheet}>
          <Text style={styles.title}>Đơn hàng đang đến!</Text>
          <Text style={styles.subTitle}>Shipper đang cách bạn 2km</Text>
          <View style={styles.timeInfo}>
             <AntDesign name="clockcircleo" size={16} color="#666" />
             <Text style={{marginLeft: 5, color: '#666'}}>Dự kiến: 5 phút</Text>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 5,
  },
  // Style cho Marker Shipper (Hình tròn màu đen/xanh đậm)
  shipperMarker: {
    width: 40, height: 40, 
    justifyContent:'center', alignItems:'center', 
    backgroundColor: '#333', 
    borderRadius: 20,
    borderWidth: 2, borderColor: 'white',
    elevation: 5
  },
  // Style cho Marker Khách (Hình tròn màu cam/đỏ)
  customerMarker: {
    width: 40, height: 40, 
    justifyContent:'center', alignItems:'center', 
    backgroundColor: colors.primary, 
    borderRadius: 20,
    borderWidth: 2, borderColor: 'white',
    elevation: 5
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 24, 
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#181C2E' },
  subTitle: { fontSize: 16, color: '#A0A5BA', marginBottom: 15 },
  timeInfo: { flexDirection: 'row', alignItems: 'center' },
});

export default TrackOrderScreen;