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
  FlatList,
} from 'react-native';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';

// --- APOLLO CLIENT IMPORTS ---
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// TypeScript interface for query response
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

// Định nghĩa Query lấy chi tiết Món + Nhà hàng + Reviews
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

const FoodDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Lấy ID món ăn từ params (truyền từ màn hình trước)
  const { foodId, food: initialFood } =
    (route.params as { foodId?: string; food?: any }) || {};
  const idToFetch = foodId || initialFood?.id || initialFood?._id;

  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSelected, setIsSelected] = useState<string | null>(null); // Size placeholder

  // --- GỌI API ---
  const { data, loading, error, refetch } = useQuery<FoodDetailResponse>(
    GET_FOOD_DETAIL_QUERY,
    {
      variables: { id: idToFetch },
      skip: !idToFetch, // Không gọi nếu không có ID
      fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất
    },
  );

  // NOTE: we now navigate to Cart with the item in params and let Cart handle merging/saving

  const foodData = data?.getFood;
  const reviewsData = data?.getFoodReviews || [];

  const goBack = () => navigation.goBack();
  const goToCart = () => navigation.navigate('Cart' as never);
  const handleIncrease = () => setQuantity(q => q + 1);
  const handleDecrease = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  // Loading View
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10 }}>Đang tải thông tin món ăn...</Text>
      </View>
    );
  }

  // Error View
  if (error || !foodData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Không tìm thấy thông tin món ăn hoặc có lỗi xảy ra.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
            Quay lại
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate Price
  const totalPrice = (foodData.price * quantity).toFixed(1);

  const handleAddToCart = async () => {
    // Chuẩn bị item theo CartItemInput
    const item = {
      foodId: foodData.id,
      name: foodData.name,
      price: foodData.price,
      quantity,
      image: foodData.image || '',
    };

    // Điều hướng về Cart và truyền item mới để Cart thực hiện merge với DB
    (navigation as any).navigate('Cart', {
      newItems: [item],
      restaurantId: foodData.restaurant?._id || null,
    });
  };

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* --- IMAGE & FAVORITE --- */}
        <View style={styles.imageContainer}>
          <Image
            source={foodData.image ? { uri: foodData.image } : IMAGES.pizza1}
            style={styles.imagePlaceholder}
            resizeMode="cover"
          />
          <Pressable
            onPress={() => setIsFavorite(!isFavorite)}
            style={styles.favoriteButton}
          >
            {isFavorite ? (
              <AntDesign name="heart" color="#ff0000" size={24} />
            ) : (
              <Feather name="heart" color="#ffffffff" size={24} />
            )}
          </Pressable>

          {/* Label Nhà hàng (Lấy từ DB) */}
          <View style={styles.restaurantLabel}>
            <Image
              source={
                foodData.restaurant?.image
                  ? { uri: foodData.restaurant.image }
                  : IMAGES.pizza1
              }
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                marginRight: 8,
              }}
            />
            <Text style={{ fontWeight: '600' }}>
              {foodData.restaurant?.name || 'Nhà hàng'}
            </Text>
          </View>
        </View>

        {/* --- FOOD INFO --- */}
        <View style={styles.infoContainer}>
          <Text style={styles.foodTitle}>{foodData.name}</Text>
          <Text style={styles.foodDescription}>
            {foodData.description || 'Chưa có mô tả cho món ăn này.'}
          </Text>

          {/* Meta Info (Rating, Ship, Time) - Lấy từ DB */}
          <View style={styles.restaurantMeta}>
            <View style={styles.restaurantMetaDetails}>
              <AntDesign name="star" color={colors.primary} size={20} />
              <Text style={{ fontWeight: 'bold' }}>{foodData.rating || 0}</Text>
              <Text style={{ color: '#9796A1' }}>
                ({foodData.reviews || 0})
              </Text>
            </View>
            <View style={styles.restaurantMetaDetails}>
              <MaterialCommunityIcons
                name="truck-delivery-outline"
                color={colors.primary}
                size={20}
              />
              <Text style={{ color: '#9796A1' }}>
                ${foodData.restaurant?.deliveryFee || 0}
              </Text>
            </View>
            <View style={styles.restaurantMetaDetails}>
              <Feather name="clock" color={colors.primary} size={20} />
              <Text style={{ color: '#9796A1' }}>
                {foodData.restaurant?.deliveryTime || '20 min'}
              </Text>
            </View>
          </View>

          {/* Size Options (Hardcode vì DB chưa có) */}
          <View style={styles.sizeContainer}>
            <Text style={styles.sectionTitle}>SIZE:</Text>
            <View style={[styles.sizeOptionsRow]}>
              {['10"', '14"', '16"'].map((size, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sizeOption,
                    isSelected === size && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setIsSelected(size)}
                >
                  <Text
                    style={[
                      styles.sizeOptionText,
                      isSelected === size && {
                        color: '#fff',
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* --- REVIEWS LIST (Dữ liệu thật) --- */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>
              REVIEWS ({reviewsData.length})
            </Text>
            {reviewsData.length === 0 ? (
              <Text style={{ color: '#A0A5BA', fontStyle: 'italic' }}>
                Chưa có đánh giá nào.
              </Text>
            ) : (
              reviewsData.map((review: any) => (
                <View key={review.id} style={styles.reviewItem}>
                  <Image
                    source={
                      review.user?.avatar
                        ? { uri: review.user.avatar }
                        : IMAGES.introman1
                    }
                    style={styles.reviewerAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={styles.reviewerName}>
                        {review.user?.name || 'Người dùng ẩn danh'}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 12, marginRight: 2 }}>
                          {review.rating}
                        </Text>
                        <AntDesign name="star" color="#FFD700" size={12} />
                      </View>
                    </View>
                    <Text style={styles.reviewContent}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(
                        parseInt(review.createdAt),
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM ACTION --- */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>${totalPrice}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrease}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleIncrease}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {foodData.isAvailable ? (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addToCartText}>THÊM VÀO GIỎ</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 25,
  },
  backButton: {
    marginRight: 15,
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black,
  },
  imageContainer: {
    marginBottom: 10,
    position: 'relative',
    paddingHorizontal: 25,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray,
    borderRadius: 20,
    marginBottom: 20,
  },
  favoriteButton: {
    backgroundColor: '#ffffffcc',
    borderRadius: 50,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    right: 35,
    zIndex: 10,
  },
  restaurantLabel: {
    position: 'absolute',
    top: 15,
    left: 35,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
  },
  foodDescription: {
    fontSize: 14,
    color: '#858992',
    marginBottom: 20,
    lineHeight: 22,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  restaurantMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sizeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  sizeOptionsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  sizeOption: {
    backgroundColor: '#F0F5FA',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sizeOptionText: {
    color: colors.black,
    fontSize: 14,
  },
  // Reviews Styles
  reviewsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#F6F6F6',
    padding: 10,
    borderRadius: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewerName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#181C2E',
  },
  reviewContent: {
    fontSize: 13,
    color: '#5B5B5E',
    marginTop: 4,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 10,
    color: '#A0A5BA',
  },
  // Bottom Fixed
  priceContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0F5FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 25,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    elevation: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
  },
  quantityContainer: {
    backgroundColor: '#121223',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  quantityButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: -2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 15,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
  },
});

export default FoodDetailScreen;
