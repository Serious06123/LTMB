import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

// --- APOLLO CLIENT IMPORTS ---
import { gql } from '@apollo/client';
import { useQuery , useMutation } from '@apollo/client/react';
// --- 1. INTERFACES (ĐỊNH NGHĨA KIỂU DỮ LIỆU) ---

interface RestaurantInfo {
  _id: string;
  name: string;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  accountId: string;
}

interface FoodDetail {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  isAvailable: boolean;
  restaurant: RestaurantInfo;
}

interface ReviewUser {
  name: string;
  avatar: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: ReviewUser;
}

// Dữ liệu trả về từ Query GetFoodDetail
interface FoodDetailResponse {
  getFood: FoodDetail;
  getFoodReviews: Review[];
}

// Interface cho Item trong Giỏ hàng
interface CartItemInput {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// Interface cho Giỏ hàng
interface Cart {
  _id: string;
  restaurantId: string;
  items: CartItemInput[];
}

interface MyCartResponse {
  myCart: Cart | null;
}

// --- 2. GRAPHQL QUERIES & MUTATIONS ---

const GET_FOOD_DETAIL_QUERY = gql`
  query GetFoodDetail($id: ID!) {
    getFood(id: $id) {
      id
      name
      price
      description
      image
      rating
      reviews
      category
      isAvailable
      restaurant {
        _id
        name
        deliveryTime
        deliveryFee
        image
        accountId
      }
    }
    getFoodReviews(foodId: $id) {
      id
      rating
      comment
      createdAt
      user {
        name
        avatar
      }
    }
  }
`;

const GET_MY_CART = gql`
  query MyCart {
    myCart {
      _id
      restaurantId
      items {
        foodId
        name
        price
        quantity
        image
      }
    }
  }
`;

const UPDATE_CART = gql`
  mutation UpdateCart($restaurantId: ID!, $items: [CartItemInput]!) {
    updateCart(restaurantId: $restaurantId, items: $items) {
      _id
      totalAmount
      items {
        foodId
        quantity
      }
    }
  }
`;

// --- 3. COMPONENT CHÍNH ---

const FoodDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Lấy ID từ params
  const { foodId, food: initialFood } =
    (route.params as { foodId?: string; food?: any }) || {};
  const idToFetch = foodId || initialFood?.id || initialFood?._id;

  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Gọi API lấy chi tiết món
  const { data: foodDataResponse, loading: foodLoading } = useQuery<FoodDetailResponse>(
    GET_FOOD_DETAIL_QUERY, 
    {
      variables: { id: idToFetch },
      skip: !idToFetch,
      fetchPolicy: 'network-only',
    }
  );

  // Gọi API lấy giỏ hàng hiện tại (để check trùng quán và merge)
  const { data: cartDataResponse, refetch: refetchCart } = useQuery<MyCartResponse>(
    GET_MY_CART, 
    { fetchPolicy: 'no-cache' }
  );

  // Mutation Update
  const [updateCartMutation, { loading: updatingCart }] = useMutation(UPDATE_CART);

  const foodData = foodDataResponse?.getFood;
  const reviewsData = foodDataResponse?.getFoodReviews || [];

  const goBack = () => navigation.goBack();
  const handleIncrease = () => setQuantity(q => q + 1);
  const handleDecrease = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  // --- LOGIC XỬ LÝ CART ---
  const handleAddToCart = async () => {
    if (!foodData) return;

    // 1. Lấy dữ liệu giỏ hàng hiện tại từ cache hoặc server
    const currentCart = cartDataResponse?.myCart;
    const currentRestaurantId = currentCart?.restaurantId;
    const newRestaurantId = foodData.restaurant?._id; // Hoặc id tùy backend

    // 2. Tạo object cho món mới
    const newItem: CartItemInput = {
      foodId: foodData.id,
      name: foodData.name,
      price: foodData.price,
      quantity: quantity,
      image: foodData.image || '',
    };

    // Helper: Hàm gọi API cập nhật
    const executeUpdateCart = async (finalItems: CartItemInput[]) => {
      try {
        await updateCartMutation({
          variables: {
            restaurantId: newRestaurantId,
            items: finalItems, // Gửi danh sách ĐẦY ĐỦ (Cũ + Mới)
          },
        });
        await refetchCart(); // Cập nhật lại cache giỏ hàng
        (navigation as any).navigate('Cart');
      } catch (err: any) {
        Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng: ' + err.message);
      }
    };

    // 3. Logic Gộp giỏ hàng
    if (currentCart && currentCart.items && currentCart.items.length > 0) {
      
      // A. Nếu khác nhà hàng -> Hỏi có xóa giỏ cũ không?
      if (currentRestaurantId && currentRestaurantId !== newRestaurantId) {
        Alert.alert(
          'Tạo giỏ hàng mới?',
          'Giỏ hàng đang chứa món của quán khác. Bạn có muốn xóa để thêm món này?',
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Đồng ý',
              onPress: () => executeUpdateCart([newItem]), // Gửi list mới -> Xóa cũ
            },
          ]
        );
        return;
      }

      // B. Nếu cùng nhà hàng -> Gộp món cũ và món mới
      // Quan trọng: Phải tạo bản sao mảng cũ để chỉnh sửa
      // Và loại bỏ trường __typename (vì GraphQL không cho gửi ngược lên)
      let mergedItems = currentCart.items.map((item: any) => ({
        foodId: item.foodId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      // Kiểm tra món này đã có trong giỏ chưa
      const existingItemIndex = mergedItems.findIndex(
        (i) => i.foodId === newItem.foodId
      );

      if (existingItemIndex > -1) {
        // Đã có -> Cộng dồn số lượng
        mergedItems[existingItemIndex].quantity += newItem.quantity;
      } else {
        // Chưa có -> Thêm vào danh sách
        mergedItems.push(newItem);
      }

      // Gửi danh sách đã gộp
      await executeUpdateCart(mergedItems);

    } else {
      // 4. Trường hợp giỏ hàng đang rỗng -> Thêm mới luôn
      await executeUpdateCart([newItem]);
    }
  };
  // --- RENDER UI ---
  if (foodLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Đang tải...</Text>
      </View>
    );
  }

  if (!foodData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Không tìm thấy thông tin món ăn.</Text>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPrice = foodData.price * quantity;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết món ăn</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* IMAGE & FAVORITE */}
        <View style={styles.imageContainer}>
          <Image
            source={foodData.image ? { uri: foodData.image } : IMAGES.pizza1}
            style={styles.imagePlaceholder}
            resizeMode="cover"
          />
          <Pressable onPress={() => setIsFavorite(!isFavorite)} style={styles.favoriteButton}>
            {isFavorite ? (
              <AntDesign name="heart" color="#ff0000" size={24} />
            ) : (
              <Feather name="heart" color="#999" size={24} />
            )}
          </Pressable>

          <View style={styles.restaurantLabel}>
            <Image
              source={foodData.restaurant?.image ? { uri: foodData.restaurant.image } : IMAGES.pizza1}
              style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
            />
            <Text style={{ fontWeight: '600' }}>{foodData.restaurant?.name || 'Nhà hàng'}</Text>
          </View>
        </View>

        {/* INFO CONTENT */}
        <View style={styles.infoContainer}>
          <Text style={styles.foodTitle}>{foodData.name}</Text>
          <Text style={styles.foodDescription}>
            {foodData.description || 'Chưa có mô tả cho món ăn này.'}
          </Text>

          {/* Meta Info */}
          <View style={styles.restaurantMeta}>
            <View style={styles.restaurantMetaDetails}>
              <AntDesign name="star" color={colors.primary} size={20} />
              <Text style={{ fontWeight: 'bold' }}>{foodData.rating || 4.5}</Text>
              <Text style={{ color: '#9796A1' }}>({foodData.reviews || 0})</Text>
            </View>
            <View style={styles.restaurantMetaDetails}>
              <MaterialCommunityIcons name="truck-delivery-outline" color={colors.primary} size={20} />
              <Text style={{ color: '#9796A1' }}>
                {foodData.restaurant?.deliveryFee 
                    ? `${foodData.restaurant.deliveryFee.toLocaleString('vi-VN')} ₫` 
                    : 'Free Ship'}
              </Text>
            </View>
            <View style={styles.restaurantMetaDetails}>
              <Feather name="clock" color={colors.primary} size={20} />
              <Text style={{ color: '#9796A1' }}>{foodData.restaurant?.deliveryTime || '20 min'}</Text>
            </View>
          </View>

          {/* REVIEWS LIST */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>ĐÁNH GIÁ ({reviewsData.length})</Text>
            {reviewsData.length === 0 ? (
              <Text style={{ color: '#A0A5BA', fontStyle: 'italic' }}>Chưa có đánh giá nào.</Text>
            ) : (
              reviewsData.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <Image
                    source={review.user?.avatar ? { uri: review.user.avatar } : IMAGES.introman1}
                    style={styles.reviewerAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.reviewerName}>{review.user?.name || 'Ẩn danh'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, marginRight: 2 }}>{review.rating}</Text>
                        <AntDesign name="star" color="#FFD700" size={12} />
                      </View>
                    </View>
                    <Text style={styles.reviewContent}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>
                        {/* Fix lỗi Date Invalid */}
                        {review.createdAt ? new Date(Number(review.createdAt) || review.createdAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM PRICE BAR */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{totalPrice.toLocaleString('vi-VN')} ₫</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={handleDecrease}>
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={handleIncrease}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {foodData.isAvailable ? (
          <TouchableOpacity 
            style={[styles.addToCartButton, updatingCart && { opacity: 0.7 }]} 
            onPress={handleAddToCart}
            disabled={updatingCart}
          >
            {updatingCart ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.addToCartText}>THÊM VÀO GIỎ</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.addToCartButton, { backgroundColor: '#ccc' }]}>
            <Text style={styles.addToCartText}>HẾT HÀNG</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingTop: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 25 },
  backButton: { marginRight: 15, width: 45, height: 45, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECF0F4' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.black },
  imageContainer: { marginBottom: 10, position: 'relative', paddingHorizontal: 25 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: colors.gray, borderRadius: 20, marginBottom: 20 },
  favoriteButton: { backgroundColor: '#ffffffcc', borderRadius: 50, width: 45, height: 45, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 30, right: 35, zIndex: 10 },
  restaurantLabel: { position: 'absolute', top: 15, left: 35, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  infoContainer: { flex: 1, paddingHorizontal: 25 },
  foodTitle: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginBottom: 10 },
  foodDescription: { fontSize: 14, color: '#858992', marginBottom: 20, lineHeight: 22 },
  restaurantMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  restaurantMetaDetails: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.black, marginBottom: 15, textTransform: 'uppercase' },
  reviewsContainer: { marginTop: 10, marginBottom: 20 },
  reviewItem: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#F6F6F6', padding: 10, borderRadius: 12 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  reviewerName: { fontWeight: 'bold', fontSize: 14, color: '#181C2E' },
  reviewContent: { fontSize: 13, color: '#5B5B5E', marginTop: 4, marginBottom: 4 },
  reviewDate: { fontSize: 10, color: '#A0A5BA' },
  priceContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F0F5FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 25, paddingHorizontal: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, elevation: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceText: { fontSize: 28, fontWeight: 'bold', color: colors.black },
  quantityContainer: { backgroundColor: '#121223', borderRadius: 30, flexDirection: 'row', alignItems: 'center', padding: 5 },
  quantityButton: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 17.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: -2 },
  quantityText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginHorizontal: 15 },
  addToCartButton: { backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  addToCartText: { fontSize: 16, fontWeight: 'bold', color: colors.white, textTransform: 'uppercase' },
});

export default FoodDetailScreen;