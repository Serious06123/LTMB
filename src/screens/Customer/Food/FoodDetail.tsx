import React, { useState, useEffect } from 'react';
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
import { useQuery, useMutation } from '@apollo/client/react';

// --- 1. INTERFACES ---
interface FoodDetailResponse {
  getFood: {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    rating: number;
    reviews: number;
    category: string;
    isAvailable: boolean;
    restaurant: {
      _id: string;
      name: string;
      deliveryTime: string;
      deliveryFee: number;
      image: string;
    };
  };
  getFoodReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      name: string;
      avatar: string;
    };
  }>;
}

interface CartItemInput {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface MyCartResponse {
  myCart: {
    restaurantId: string;
    items: CartItemInput[];
  } | null;
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
  query GetMyCart {
    myCart {
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

const UPDATE_CART_MUTATION = gql`
  mutation UpdateCart($restaurantId: ID!, $items: [CartItemInput]!) {
    updateCart(restaurantId: $restaurantId, items: $items) {
      _id
      restaurantId
      items {
        foodId
        quantity
      }
    }
  }
`;

const FoodDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { foodId, food: initialFood } = (route.params as { foodId?: string; food?: any }) || {};
  const idToFetch = foodId || initialFood?.id || initialFood?._id;

  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSelected, setIsSelected] = useState<string | null>(null);

  // --- 3. GỌI API ---
  // Lấy chi tiết món ăn
  const { data, loading, error } = useQuery<FoodDetailResponse>(GET_FOOD_DETAIL_QUERY, {
    variables: { id: idToFetch },
    skip: !idToFetch,
  });

  // Lấy giỏ hàng hiện tại để thực hiện merge
  const { data: cartData, refetch: refetchCart } = useQuery<MyCartResponse>(GET_MY_CART, {
    fetchPolicy: 'network-only',
  });

  // Mutation cập nhật giỏ hàng
  const [updateCart, { loading: isUpdating }] = useMutation(UPDATE_CART_MUTATION);

  const foodData = data?.getFood;
  const reviewsData = data?.getFoodReviews || [];

  // --- 4. LOGIC XỬ LÝ ---
  const handleAddToCart = async () => {
    if (!foodData) return;

    try {
      const restaurantId = foodData.restaurant._id;
      let finalItems: CartItemInput[] = [];

      // Logic Merge dữ liệu
      if (cartData?.myCart && cartData.myCart.restaurantId === restaurantId) {
        // Cùng nhà hàng: Gộp món
        finalItems = cartData.myCart.items.map(it => ({
          foodId: it.foodId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        }));

        const existingIdx = finalItems.findIndex(i => i.foodId === foodData.id);
        if (existingIdx >= 0) {
          finalItems[existingIdx].quantity += quantity;
        } else {
          finalItems.push({
            foodId: foodData.id,
            name: foodData.name,
            price: foodData.price,
            quantity: quantity,
            image: foodData.image || '',
          });
        }
      } else {
        // Giỏ trống hoặc khác nhà hàng: Thay thế bằng giỏ mới của nhà hàng này
        finalItems = [{
          foodId: foodData.id,
          name: foodData.name,
          price: foodData.price,
          quantity: quantity,
          image: foodData.image || '',
        }];
      }

      // Gửi lên Database
      await updateCart({
        variables: {
          restaurantId: restaurantId,
          items: finalItems,
        },
      });

      Alert.alert('Thành công', 'Đã cập nhật giỏ hàng trên hệ thống');
      await refetchCart(); // Cập nhật lại cache giỏ hàng
      navigation.navigate('Cart');

    } catch (err) {
      console.error('Lỗi Add To Cart:', err);
      Alert.alert('Lỗi', 'Không thể lưu giỏ hàng vào database');
    }
  };

  const handleIncrease = () => setQuantity(q => q + 1);
  const handleDecrease = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (error || !foodData) return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <View style={[styles.container, styles.center]}>
      <Text>Có lỗi xảy ra khi tải dữ liệu.</Text>
    </View>
    </TouchableOpacity>
  );

  const totalPrice = (foodData.price * quantity).toFixed(1);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <Image
            source={foodData.image ? { uri: foodData.image } : IMAGES.pizza1}
            style={styles.imagePlaceholder}
            resizeMode="cover"
          />
          <Pressable onPress={() => setIsFavorite(!isFavorite)} style={styles.favoriteButton}>
            <AntDesign name={isFavorite ? "heart" : "hearto"} color={isFavorite ? "#ff0000" : "#888"} size={24} />
          </Pressable>
        </View>

        {/* INFO */}
        <View style={styles.infoContainer}>
          <Text style={styles.foodTitle}>{foodData.name}</Text>
          <Text style={styles.foodDescription}>{foodData.description || 'Chưa có mô tả.'}</Text>

          <View style={styles.restaurantMeta}>
            <View style={styles.restaurantMetaDetails}>
              <AntDesign name="star" color={colors.primary} size={20} />
              <Text style={{ fontWeight: 'bold' }}>{foodData.rating}</Text>
            </View>
            <View style={styles.restaurantMetaDetails}>
              <MaterialCommunityIcons name="truck-delivery-outline" color={colors.primary} size={20} />
              <Text style={{ color: '#9796A1' }}>${foodData.restaurant?.deliveryFee}</Text>
            </View>
          </View>

          {/* REVIEWS */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>REVIEWS ({reviewsData.length})</Text>
            {reviewsData.slice(0, 3).map((review: any) => (
              <View key={review.id} style={styles.reviewItem}>
                <Image source={review.user?.avatar ? { uri: review.user.avatar } : IMAGES.introman1} style={styles.reviewerAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{review.user?.name}</Text>
                  <Text style={styles.reviewContent}>{review.comment}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>${totalPrice}</Text>
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

        <TouchableOpacity
          style={[styles.addToCartButton, (!foodData.isAvailable || isUpdating) && { backgroundColor: '#ccc' }]}
          onPress={handleAddToCart}
          disabled={!foodData.isAvailable || isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>{foodData.isAvailable ? "THÊM VÀO GIỎ" : "HẾT HÀNG"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... Styles giữ nguyên từ file gốc của bạn ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingTop: 40 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 25 },
  backButton: { marginRight: 15, width: 45, height: 45, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECF0F4' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.black },
  imageContainer: { marginBottom: 10, position: 'relative', paddingHorizontal: 25 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: colors.gray, borderRadius: 20 },
  favoriteButton: { backgroundColor: '#fff', borderRadius: 50, width: 45, height: 45, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 10, right: 35, elevation: 5 },
  infoContainer: { paddingHorizontal: 25 },
  foodTitle: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginBottom: 10 },
  foodDescription: { fontSize: 14, color: '#858992', marginBottom: 20, lineHeight: 22 },
  restaurantMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  restaurantMetaDetails: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.black, marginBottom: 15, textTransform: 'uppercase' },
  reviewsContainer: { marginTop: 10 },
  reviewItem: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#F6F6F6', padding: 10, borderRadius: 12 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  reviewerName: { fontWeight: 'bold', fontSize: 14, color: '#181C2E' },
  reviewContent: { fontSize: 13, color: '#5B5B5E', marginTop: 4 },
  priceContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F0F5FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceText: { fontSize: 28, fontWeight: 'bold', color: colors.black },
  quantityContainer: { backgroundColor: '#121223', borderRadius: 30, flexDirection: 'row', alignItems: 'center', padding: 5 },
  quantityButton: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 17.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  quantityText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginHorizontal: 15 },
  addToCartButton: { backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 18, alignItems: 'center' },
  addToCartText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
});

export default FoodDetailScreen;