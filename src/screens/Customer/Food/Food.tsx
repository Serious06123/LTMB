import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator, // Thêm để hiển thị loading
} from 'react-native';
import { colors } from '../../../theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { IMAGES } from '../../../constants/images';
import SeeAllModal from '../../../components/SeeAllModal';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const FoodScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { category } = (route.params as { category?: string }) || {};
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState('');
  const [seeAllItems, setSeeAllItems] = useState<any[]>([]);

  const goBack = () => {
    navigation.goBack();
  };
  const goToSearch = () => {
    navigation.navigate('Search' as never);
  };
  const goToFoodDetail = (foodItem: any) => {
    // Truyền dữ liệu món ăn sang màn hình chi tiết
    navigation.navigate('FoodDetail', { food: foodItem });
  };

  // --- 1. Query lấy danh sách món ăn ---
  const GET_FOODS = gql`
    query GetFoods($category: String) {
      getFoods(category: $category) {
        id
        name
        price
        description
        image
        rating
        # Lưu ý: Backend hiện tại chưa trả về tên Restaurant trong query getFoods
        # nên tạm thời chúng ta sẽ để trống hoặc ẩn đi.
      }
    }
  `;

  // --- 2. Query lấy danh sách nhà hàng (Giữ nguyên của bạn) ---
  const GET_RESTAURANTS = gql`
    query GetRestaurants($category: String) {
      getRestaurants(category: $category) {
        _id
        name
        rating
        reviews
        image
        deliveryTime
        deliveryFee
        isOpen
        categories {
          _id
          name
        }
        address {
          street
          city
          lat
          lng
        }
      }
    }
  `;
  interface Food {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description?: string;
}

interface GetFoodsData {
  getFoods: Food[];
}

interface Restaurant {
  _id: string;
  name: string;
  rating: number;
  reviews?: number;
  image?: string;
  deliveryTime?: number;
  deliveryFee?: number;
  isOpen?: boolean;
  categories: Array<{ _id: string; name: string }>;
  address: {
    street: string;
    city: string;
    lat: number;
    lng: number;
  };
}

interface GetRestaurantsData {
  getRestaurants: Restaurant[];
}

  // --- 3. Thực thi Query ---
  const { data: foodData, loading: foodLoading } = useQuery<GetFoodsData>(GET_FOODS, {
    variables: { category: category || 'All' },
    fetchPolicy: 'cache-and-network', // Đảm bảo luôn lấy dữ liệu mới nhất
  });

  const { data: restData } = useQuery<GetRestaurantsData>(GET_RESTAURANTS, {
    variables: { category: category || 'All' },
  });

  // --- 4. Xử lý dữ liệu Món ăn (Foods) ---
  const foodsFromDB = (foodData?.getFoods || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    // Backend chưa populate restaurant nên tạm thời để chuỗi rỗng hoặc tên mặc định
    restaurant: '',
    price: `$${item.price}`,
    // Kiểm tra nếu có link ảnh online thì dùng uri, không thì dùng ảnh mặc định local
    image: item.image ? { uri: item.image } : IMAGES.pizza1,
    description: item.description,
    raw: item, // Giữ lại dữ liệu gốc nếu cần
  }));

  // --- 5. Xử lý dữ liệu Nhà hàng (Restaurants) ---
  const openRestaurantsData = (restData?.getRestaurants || []).map(
    (r: any, idx: number) => ({
      id: r._id || idx + 1,
      name: r.name,
      image: r.image ? { uri: r.image } : IMAGES.pizza1,
      rating: r.rating ? String(r.rating) : '4.5',
      delivery:
        r.deliveryFee && r.deliveryFee > 0 ? `${r.deliveryFee}` : 'Free',
      time: r.deliveryTime || '30 min',
      raw: r,
    }),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.foodSearchInfo}>
        <TouchableOpacity style={styles.pressButton} onPress={goBack}>
          <AntDesign name="left" color="#000" size={24} />
        </TouchableOpacity>

        <View style={styles.keywordButton}>
          <Text style={styles.keywordText}>{category || 'All'}</Text>
          <FontAwesome name="caret-down" color={colors.primary} size={24} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginLeft: 'auto',
          }}
        >
          <Pressable
            onPress={goToSearch}
            style={[styles.pressButton, { backgroundColor: '#000' }]}
          >
            <AntDesign name="search1" color="#ffffffff" size={24} />
          </Pressable>
          <View style={styles.pressButton}>
            <MaterialCommunityIcons
              name="tune-vertical"
              color={colors.primary}
              size={30}
            />
          </View>
        </View>
      </View>

      {/* --- Section: Popular Foods (Lấy từ DB) --- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          {category ? `${category} Menu` : 'Popular Foods'}
        </Text>

        {foodLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={foodsFromDB} // Sử dụng dữ liệu đã map từ DB
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }} // Căn đều 2 cột
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.gray }}>
                No foods found.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image source={item.image} style={styles.imagePlaceholder} />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                {/* Tạm ẩn subtitle nếu không có tên nhà hàng */}
                {item.restaurant ? (
                  <Text style={styles.cardSubtitle}>{item.restaurant}</Text>
                ) : null}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    marginTop: 5,
                  }}
                >
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => goToFoodDetail(item.raw)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* --- Section: Open Restaurants (Lấy từ DB) --- */}
      <View style={[styles.sectionContainer, { flex: 3 }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={styles.sectionTitle}>Open Restaurants</Text>
          <TouchableOpacity
            onPress={() => {
              setSeeAllTitle('Open Restaurants');
              setSeeAllItems(openRestaurantsData); // Cập nhật dữ liệu cho Modal
              setSeeAllVisible(true);
            }}
          >
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={openRestaurantsData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.restaurantCard}>
              <Image source={item.image} style={styles.restaurantImage} />
              <Text style={styles.restaurantName}>{item.name}</Text>
              <View style={styles.restaurantMeta}>
                <View style={styles.restaurantMetaDetails}>
                  <AntDesign name="staro" color={colors.primary} size={20} />
                  <Text>{item.rating}</Text>
                </View>
                <View style={styles.restaurantMetaDetails}>
                  <MaterialCommunityIcons
                    name="truck-fast-outline"
                    color={colors.primary}
                    size={20}
                  />
                  <Text>{item.delivery}</Text>
                </View>
                <View style={styles.restaurantMetaDetails}>
                  <Feather name="clock" color={colors.primary} size={20} />
                  <Text>{item.time}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
      <SeeAllModal
        visible={seeAllVisible}
        title={seeAllTitle}
        items={seeAllItems}
        onClose={() => setSeeAllVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 40,
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 20, // Chỉnh lại paddingRight cho cân đối
  },
  pressButton: {
    marginRight: 15,
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
  },
  sectionContainer: {
    flex: 7,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.black,
    marginBottom: 10,
    fontWeight: '600',
  },
  card: {
    flex: 0.5, // Để chia đều 2 cột
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    margin: 5,
    elevation: 4, // Đổ bóng cho Android
    shadowColor: '#000', // Đổ bóng cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.gray,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.black,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  restaurantCard: {
    width: '100%',
    borderRadius: 11,
    marginBottom: 20,
  },
  restaurantImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  foodSearchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  keywordButton: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    height: 46,
    borderWidth: 2,
    borderColor: '#EDEDED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  keywordText: {
    color: colors.black,
    fontWeight: '500',
  },
  restaurantMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  restaurantMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default FoodScreen;