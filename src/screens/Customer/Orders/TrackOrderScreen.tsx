import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Dimensions, 
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import { 
  MapView, 
  Camera, 
  ShapeSource, 
  LineLayer, 
  PointAnnotation, 
  Callout 
} from '@maplibre/maplibre-react-native';
import polyline from '@mapbox/polyline';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import mapService from '../../../services/mapService';
import { GOONG_CONFIG, BASE_URL } from '../../../constants/config';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const { width } = Dimensions.get('window');

// 1. INTERFACES
interface Address {
  lat: number;
  lng: number;
  street: string;
  city: string;
}

interface RestaurantInfo {
  id: string;
  name: string;
  avatar: string;
  address: Address;
}

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  shippingAddress: Address;
  shipperId?: string;
  restaurant: RestaurantInfo;
}

interface GetOrderData {
  getOrder: OrderDetail;
}

// 2. QUERY
const GET_ORDER_DETAIL = gql`
  query GetOrder($id: ID!) {
    getOrder(id: $id) {
      id
      status
      totalAmount
      createdAt
      shippingAddress {
        street
        city
        lat
        lng
      }
      shipperId
      restaurant {
        id
        name
        avatar
        address {
            lat
            lng
            street
        }
      }
    }
  }
`;

const TrackOrderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  const [customerCoord, setCustomerCoord] = useState<[number, number]>([106.682132, 10.761444]); 
  const [shipperCoord, setShipperCoord] = useState<[number, number]>([106.697632, 10.773163]); 
  const [routeFeature, setRouteFeature] = useState<any>(null);
  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  // 3. SỬA LỖI 1: BỎ onCompleted VÀ DÙNG useEffect
  const { data, loading, error } = useQuery<GetOrderData>(GET_ORDER_DETAIL, {
    variables: { id: orderId },
    skip: !orderId,
    pollInterval: 10000,
  });

  // Effect thay thế cho onCompleted
  useEffect(() => {
    if (data?.getOrder) {
        const orderData = data.getOrder;
        
        // Cập nhật vị trí khách hàng
        if (orderData.shippingAddress?.lat && orderData.shippingAddress?.lng) {
            setCustomerCoord([orderData.shippingAddress.lng, orderData.shippingAddress.lat]);
        }
        
        // Cập nhật vị trí Shipper (hoặc quán nếu chưa có shipper)
        if (!orderData.shipperId && orderData.restaurant?.address?.lat && orderData.restaurant?.address?.lng) {
             setShipperCoord([orderData.restaurant.address.lng, orderData.restaurant.address.lat]);
        }
    }
  }, [data]);

  const order = data?.getOrder;

  useEffect(() => {
    fetchRouteShipperToCustomer();
  }, [shipperCoord, customerCoord]);

  const fetchRouteShipperToCustomer = async () => {
    const req = {
      origin: shipperCoord,
      destination: customerCoord,
      vehicle: 'bike'
    };

    try {
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
    } catch (err) {
        console.log("Lỗi lấy đường đi:", err);
    }
  };

  const handleCall = () => Alert.alert("Gọi điện", "Đang kết nối tới tài xế...");
  
  const handleMessage = () => {
    if (!order) return;
    const receiverId = order.shipperId || order.restaurant?.id; 
    navigation.navigate('ChatScreen', { 
        orderId: order.id,
        receiverId: receiverId,
        receiverName: order.shipperId ? "Tài xế" : order.restaurant?.name
    });
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        pending: 'Chờ xác nhận',
        preparing: 'Đang chuẩn bị món',
        shipping: 'Tài xế đang giao',
        delivered: 'Đã giao thành công',
        cancelled: 'Đã hủy',
    };
    return map[status?.toLowerCase()] || status;
  };

  if (loading && !order) {
    return (
        <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
  }

  // Logic ảnh
  let displayImage = IMAGES.shipper; 
  if (!order?.shipperId) {
      if (order?.restaurant?.avatar) {
          const uri = order.restaurant.avatar.startsWith('http') 
              ? order.restaurant.avatar 
              : `${BASE_URL}${order.restaurant.avatar}`;
          displayImage = { uri: uri };
      } else {
          displayImage = IMAGES.pizza1;
      }
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
         <AntDesign name="arrowleft" size={24} color="#000" />
      </TouchableOpacity>

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
                    <Image source={IMAGES.shipper} style={{width: 36, height: 36, borderRadius: 18}} />
                </View>
                <Callout title="Shipper" />
            </PointAnnotation>

            <PointAnnotation id="customer" coordinate={customerCoord}>
                <View style={styles.customerMarker}>
                    <Feather name="map-pin" size={20} color="white" />
                </View>
                <Callout title="Vị trí của bạn" />
            </PointAnnotation>
        </MapView>
      </View>

      {order && (
        <View style={styles.bottomSheet}>
            <View style={styles.dragHandle} />

            <View style={styles.shipperRow}>
                <View style={styles.shipperInfo}>
                    <Image 
                        source={displayImage} 
                        style={styles.shipperAvatar} 
                    />
                    <View>
                        <Text style={styles.shipperName}>
                            {order.shipperId ? "Tài xế Baemin" : order.restaurant?.name}
                        </Text>
                        <Text style={styles.shipperRole}>
                            {order.shipperId ? "Shipper" : "Nhà hàng"}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                        <Ionicons name="call" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
                        <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.orderStatusContainer}>
                {/* 4. SỬA LỖI 2: Thêm || '' để đảm bảo luôn truyền string */}
                <Text style={styles.statusTitle}>{getStatusText(order.status || '')}</Text>
                <Text style={styles.statusSubtitle}>
                    {order.status === 'shipping' 
                        ? 'Tài xế đang trên đường giao đến bạn.' 
                        : 'Vui lòng chờ trong giây lát.'}
                </Text>
                
                <View style={styles.timeInfo}>
                    <AntDesign name="clockcircleo" size={16} color="#666" />
                    <Text style={styles.timeText}>Dự kiến: 15 - 20 phút</Text>
                </View>

                <View style={{flexDirection: 'row', marginTop: 10, alignItems: 'center'}}>
                    <MaterialIcons name="location-on" size={16} color={colors.primary} />
                    <Text style={{marginLeft: 5, color: '#333', flex: 1}} numberOfLines={1}>
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}
                    </Text>
                </View>
            </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1 }, 
  
  backButton: {
    position: 'absolute', top: 50, left: 20, zIndex: 10,
    backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 5,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4
  },
  
  shipperMarker: {
    width: 40, height: 40, justifyContent:'center', alignItems:'center', 
    backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, borderColor: colors.primary, elevation: 5
  },
  customerMarker: {
    width: 40, height: 40, justifyContent:'center', alignItems:'center', 
    backgroundColor: colors.primary, borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5
  },
  
  bottomSheet: {
    position: 'absolute', 
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', 
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, paddingTop: 10, paddingBottom: 30,
    elevation: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10,
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
  shipperName: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  shipperRole: { fontSize: 13, color: '#A0A5BA' },
  
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: {
      width: 45, height: 45, borderRadius: 22.5,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.primary,
  },

  orderStatusContainer: {
      marginTop: 5
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
  statusSubtitle: { fontSize: 14, color: '#A0A5BA', marginBottom: 10 },
  timeInfo: { flexDirection: 'row', alignItems: 'center' },
  timeText: { marginLeft: 5, color: '#666', fontSize: 14 },
});

export default TrackOrderScreen;