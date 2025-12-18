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
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import mapService from '../../../services/mapService';
import { GOONG_CONFIG, BASE_URL } from '../../../constants/config';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';

const { width } = Dimensions.get('window');

// --- 1. KHAI BÁO INTERFACES (ĐẦY ĐỦ) ---

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

// Interface cho Params của Route
interface TrackOrderParams {
    orderId: string;
}

// --- 2. QUERY & MUTATION ---

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

// Mutation để Shipper cập nhật trạng thái
const SHIPPER_UPDATE_STATUS = gql`
  mutation ShipperUpdateStatus($orderId: ID!, $status: String!) {
    shipperUpdateStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

// --- 3. COMPONENT CHÍNH ---

const TrackOrderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { orderId } = route.params as TrackOrderParams;

  const goongStyleUrl = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_CONFIG.MAPTILES_KEY}`;

  // State tọa độ: Dùng mảng [longitude, latitude] cho MapLibre
  const [customerCoord, setCustomerCoord] = useState<[number, number] | null>(null); 
  const [shipperCoord, setShipperCoord] = useState<[number, number] | null>(null); 
  
  const [routeFeature, setRouteFeature] = useState<any>(null);
  const [isArrived, setIsArrived] = useState(false);
  const camera = useRef<React.ComponentRef<typeof Camera>>(null);

  // Query dữ liệu đơn hàng
  const { data, loading } = useQuery<GetOrderData>(GET_ORDER_DETAIL, {
    variables: { id: orderId },
    skip: !orderId,
    pollInterval: 5000, // Cập nhật mỗi 5s để đồng bộ trạng thái
  });

  // Mutation cập nhật trạng thái
  const [updateStatus] = useMutation(SHIPPER_UPDATE_STATUS);

  const order = data?.getOrder;

  // --- LOGIC 1: KHỞI TẠO VỊ TRÍ ---
  useEffect(() => {
    if (order) {
        // 1. Set vị trí khách (Đích)
        if (order.shippingAddress?.lat && order.shippingAddress?.lng) {
            setCustomerCoord([order.shippingAddress.lng, order.shippingAddress.lat]);
        }
        
        // 2. Set vị trí Shipper (Xuất phát)
        // Chỉ set lần đầu nếu chưa có, để tránh ghi đè khi đang chạy mô phỏng
        if (!shipperCoord) {
             if (order.restaurant?.address?.lat && order.restaurant?.address?.lng) {
                 setShipperCoord([order.restaurant.address.lng, order.restaurant.address.lat]);
             } else {
                 // Fallback nếu không có tọa độ quán
                 setShipperCoord([
                     (order.shippingAddress?.lng || 106) - 0.01, 
                     (order.shippingAddress?.lat || 10) - 0.01
                 ]);
             }
        }
    }
  }, [order]);

  // --- LOGIC 2: LẤY ĐƯỜNG ĐI (VẼ LINE) ---
  useEffect(() => {
    if (shipperCoord && customerCoord) {
        fetchRouteShipperToCustomer();
    }
  }, [shipperCoord, customerCoord]);

  const fetchRouteShipperToCustomer = async () => {
    if (!shipperCoord || !customerCoord) return;
    
    // Gọi API Map Service
    const reqGoong = {
      origin: shipperCoord,      // [lng, lat]
      destination: customerCoord, // [lng, lat]
      vehicle: 'bike'
    };

    try {
        const res = await mapService.getDirections(reqGoong);
        if (res && res.routes && res.routes.length > 0) {
            const points = polyline.decode(res.routes[0].overview_polyline.points);
            // MapLibre GeoJSON cần [lng, lat], polyline decode ra [lat, lng] -> cần đảo ngược
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

  // --- LOGIC 3: GIẢ LẬP DI CHUYỂN (SIMULATION) ---
  useEffect(() => {
    if (!shipperCoord || !customerCoord || isArrived) return;

    // Chỉ chạy simulation khi status là 'shipping'
    if (order?.status !== 'shipping') return;

    const interval = setInterval(() => {
        setShipperCoord((prev) => {
            if (!prev) return null;
            
            // Tính khoảng cách
            const dLng = customerCoord[0] - prev[0];
            const dLat = customerCoord[1] - prev[1];

            // Nếu gần đến nơi (< 0.0001 độ ~ 10m)
            if (Math.abs(dLng) < 0.0001 && Math.abs(dLat) < 0.0001) {
                setIsArrived(true);
                clearInterval(interval);
                return customerCoord; // Gán cứng bằng vị trí khách
            }

            // Di chuyển 5% quãng đường mỗi bước (0.5s)
            return [
                prev[0] + dLng * 0.05,
                prev[1] + dLat * 0.05
            ];
        });
    }, 500); 

    return () => clearInterval(interval);
  }, [shipperCoord, customerCoord, isArrived, order?.status]);


  // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
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

  const handleFinishOrder = () => {
    Alert.alert(
        "Xác nhận", 
        "Bạn xác nhận đã giao hàng thành công?",
        [
            { text: "Hủy", style: "cancel" },
            { 
                text: "Đồng ý", 
                onPress: async () => {
                    try {
                        await updateStatus({
                            variables: { orderId: order!.id, status: 'delivered' }
                        });
                        Alert.alert("Thành công", "Đơn hàng đã hoàn tất!");
                        navigation.goBack();
                    } catch (e) {
                        Alert.alert("Lỗi", "Không thể cập nhật trạng thái.");
                    }
                } 
            }
        ]
    );
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

  // Xử lý logic hiển thị ảnh (Avatar shipper hoặc quán)
  let displayImage: any = IMAGES.shipper; 
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

  // Tính tâm bản đồ
  const centerCoord = (shipperCoord && customerCoord) 
    ? [(shipperCoord[0] + customerCoord[0]) / 2, (shipperCoord[1] + customerCoord[1]) / 2]
    : [106.68, 10.76];

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
                    centerCoordinate: centerCoord,
                    zoomLevel: 14
                }}
                animationMode="flyTo" 
                animationDuration={2000} 
            />

            {/* Vẽ đường đi */}
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

            {/* Marker Shipper */}
            {shipperCoord && (
                <PointAnnotation id="shipper" coordinate={shipperCoord}>
                    <View style={styles.shipperMarker}>
                        <Image source={IMAGES.shipper} style={{width: 36, height: 36, borderRadius: 18}} resizeMode="contain" />
                    </View>
                    <Callout title="Shipper" />
                </PointAnnotation>
            )}

            {/* Marker Khách hàng */}
            {customerCoord && (
                <PointAnnotation id="customer" coordinate={customerCoord}>
                    <View style={styles.customerMarker}>
                        <Feather name="map-pin" size={20} color="white" />
                    </View>
                    <Callout title="Vị trí của bạn" />
                </PointAnnotation>
            )}
        </MapView>
      </View>

      {/* Bottom Sheet thông tin */}
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
                <Text style={styles.statusTitle}>{getStatusText(order.status || '')}</Text>
                
                {/* HIỂN THỊ NÚT XÁC NHẬN NẾU ĐÃ ĐẾN NƠI VÀ ĐANG GIAO */}
                {isArrived && order.status === 'shipping' ? (
                    <TouchableOpacity style={styles.btnConfirm} onPress={handleFinishOrder}>
                        <Text style={styles.btnConfirmText}>XÁC NHẬN GIAO HÀNG</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <Text style={styles.statusSubtitle}>
                            {order.status === 'shipping' 
                                ? (isArrived ? 'Shipper đã đến nơi!' : 'Tài xế đang trên đường giao đến bạn.') 
                                : 'Vui lòng chờ trong giây lát.'}
                        </Text>
                        
                        <View style={styles.timeInfo}>
                            <AntDesign name="clockcircleo" size={16} color="#666" />
                            <Text style={styles.timeText}>Dự kiến: 15 - 20 phút</Text>
                        </View>
                    </>
                )}

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

  // Style cho nút xác nhận
  btnConfirm: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  btnConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase'
  }
});

export default TrackOrderScreen;