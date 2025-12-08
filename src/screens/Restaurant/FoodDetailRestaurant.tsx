import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

const { width } = Dimensions.get('window');

// Dữ liệu giả cho Ingredients (Thành phần)
const INGREDIENTS = [
  { id: '1', name: 'Salt', icon: 'shaker-outline' },
  { id: '2', name: 'Chicken', icon: 'food-drumstick-outline' },
  { id: '3', name: 'Onion', icon: 'seed-outline' }, 
  { id: '4', name: 'Garlic', icon: 'leaf' }, 
  { id: '5', name: 'Peppers', icon: 'chili-mild' },
  { id: '6', name: 'Ginger', icon: 'food-variant' }, 
  { id: '7', name: 'Broccoli', icon: 'tree' },
  { id: '8', name: 'Orange', icon: 'fruit-citrus' },
  { id: '9', name: 'Walnut', icon: 'peanut-outline' },
];

export default function FoodDetailRestaurant() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Lấy dữ liệu món ăn được truyền từ màn hình MyFoodList
  // Nếu không có (chạy test), dùng dữ liệu mặc định
  const item = (route.params as any)?.item || {
      name: 'Chicken Thai Biriyani',
      image: IMAGES.pizza1,
      rating: 4.9,
      reviews: 10,
      price: 60,
  };

  const renderIngredient = (ing: any) => (
    <View key={ing.id} style={styles.ingItem}>
      <View style={styles.ingIconCircle}>
        <MaterialCommunityIcons name={ing.icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.ingText}>{ing.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <AntDesign name="left" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Details</Text>
          <TouchableOpacity>
             <Text style={styles.editBtn}>EDIT</Text>
          </TouchableOpacity>
        </View>

        {/* --- FOOD IMAGE & TAGS --- */}
        <View style={styles.imageContainer}>
             <Image source={item.image} style={styles.foodImage} />
             {/* Overlay Tags: Breakfast, Delivery */}
             <View style={styles.tagOverlay}>
                 <View style={styles.tag}>
                     <Text style={styles.tagText}>Breakfast</Text>
                 </View>
                 <View style={[styles.tag, {marginLeft: 'auto'}]}>
                     <Text style={styles.tagText}>Delivery</Text>
                 </View>
             </View>
        </View>

        {/* --- INFO --- */}
        <View style={styles.infoRow}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodPrice}>${item.price}</Text>
        </View>

        <View style={styles.subInfoRow}>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color={colors.gray} />
                <Text style={styles.locationText}>Kentucky 39495</Text>
            </View>
            <View style={styles.ratingRow}>
                 <AntDesign name="star" size={16} color={colors.primary} />
                 <Text style={styles.ratingText}>{item.rating}</Text>
                 
                 {/* Bọc Text review bằng TouchableOpacity và thêm onPress */}
                 <TouchableOpacity onPress={() => navigation.navigate('ReviewsScreen' as never)}>
                    <Text style={styles.reviewText}>({item.reviews} Reviews)</Text>
                 </TouchableOpacity>
            </View>
        </View>

        {/* --- INGREDIENTS --- */}
        <Text style={styles.sectionTitle}>INGREDIENTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ingList}>
            {INGREDIENTS.map(renderIngredient)}
        </ScrollView>

        {/* --- DESCRIPTION --- */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descText}>
            Lorem ipsum dolor sit amet, consetetur Maton adipiscing elit. Bibendum in vel, mattis et amet dui mauris turpis.
        </Text>

        {/* Khoảng trống để không bị che bởi Bottom Bar */}
        <View style={{height: 100}} />

      </ScrollView>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
      paddingHorizontal: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  backButton: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: '#ECF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#181C2E',
  },
  editBtn: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
      textDecorationLine: 'underline'
  },
  // Image
  imageContainer: {
      marginTop: 10,
      marginBottom: 20,
      position: 'relative',
  },
  foodImage: {
      width: '100%',
      height: 200,
      borderRadius: 20,
  },
  tagOverlay: {
      position: 'absolute',
      bottom: 15,
      left: 15,
      right: 15,
      flexDirection: 'row',
  },
  tag: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  tagText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000',
  },
  // Info
  infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5
  },
  foodName: { fontSize: 20, fontWeight: 'bold', color: '#181C2E' },
  foodPrice: { fontSize: 24, fontWeight: 'bold', color: '#181C2E' },
  
  subInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  locationText: { color: colors.gray, marginLeft: 4, fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontWeight: 'bold', color: '#181C2E', marginLeft: 5 },
  reviewText: { color: colors.gray, marginLeft: 5, fontSize: 13 },

  // Ingredients
  sectionTitle: {
      fontSize: 14, fontWeight: 'bold', color: '#32343E', marginBottom: 10, textTransform: 'uppercase'
  },
  ingList: { paddingBottom: 20 },
  ingItem: {
      alignItems: 'center', marginRight: 15
  },
  ingIconCircle: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: '#FFF2E5', // Màu cam nhạt
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 8
  },
  ingText: { fontSize: 12, color: '#A0A5BA' },

  // Description
  descText: {
      fontSize: 14, color: '#A0A5BA', lineHeight: 22
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 80, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height:-5},
    paddingBottom: 10
  },
  tabIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabWrapper: {
    top: -25, backgroundColor: '#fff', borderRadius: 50, padding: 6,
  },
  fabButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: {width:0, height:4}
  },
});