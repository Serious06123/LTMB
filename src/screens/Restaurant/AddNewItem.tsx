import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

// Dữ liệu giả cho Ingredients
const INGREDIENTS_BASIC = [
  { id: '1', name: 'Salt', icon: 'shaker-outline' },
  { id: '2', name: 'Chicken', icon: 'food-drumstick-outline' },
  { id: '3', name: 'Onion', icon: 'seed-outline' },
  { id: '4', name: 'Garlic', icon: 'leaf' },
  { id: '5', name: 'Peppers', icon: 'chili-mild' },
  { id: '6', name: 'Ginger', icon: 'food-variant' },
];

const INGREDIENTS_FRUIT = [
  { id: '1', name: 'Avocado', icon: 'food-apple-outline' }, // Dùng tạm icon pear
  { id: '2', name: 'Apple', icon: 'food-apple-outline' },
  { id: '3', name: 'Blueberry', icon: 'fruit-grapes-outline' },
  { id: '4', name: 'Broccoli', icon: 'tree' },
  { id: '5', name: 'Orange', icon: 'fruit-citrus' },
  { id: '6', name: 'Walnut', icon: 'peanut-outline' },
];

export default function AddNewItem() {
  const navigation = useNavigation();
  const [itemName, setItemName] = useState('Mazalichiken Halim');
  const [price, setPrice] = useState('50');
  const [description, setDescription] = useState('');
  
  // State giả lập checkbox
  const [isPickup, setIsPickup] = useState(true);
  const [isDelivery, setIsDelivery] = useState(false);

  const renderIngredient = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.ingItem}>
      <View style={styles.ingIconCircle}>
        <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.ingText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Items</Text>
        <TouchableOpacity>
            <Text style={styles.resetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ITEM NAME */}
        <Text style={styles.label}>ITEM NAME</Text>
        <TextInput 
            style={styles.input} 
            value={itemName} 
            onChangeText={setItemName}
            placeholder="Enter item name"
        />

        {/* UPLOAD PHOTO */}
        <Text style={styles.label}>UPLOAD PHOTO/VIDEO</Text>
        <View style={styles.uploadRow}>
            {/* Ảnh đã chọn (Demo) */}
            <View style={styles.uploadItem}>
                <Image source={IMAGES.pizza1} style={styles.uploadedImage} />
                <View style={styles.deleteIcon}>
                     <AntDesign name="closecircle" size={20} color="#fff" />
                </View>
            </View>

            {/* Nút Upload */}
            <TouchableOpacity style={styles.uploadBox}>
                <View style={styles.cloudIcon}>
                    <Feather name="upload-cloud" size={24} color={colors.primary} />
                </View>
                <Text style={styles.uploadText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBox}>
                <View style={styles.cloudIcon}>
                    <Feather name="upload-cloud" size={24} color={colors.primary} />
                </View>
                <Text style={styles.uploadText}>Add</Text>
            </TouchableOpacity>
        </View>

        {/* PRICE & TYPE */}
        <Text style={styles.label}>PRICE</Text>
        <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>$</Text>
                <TextInput 
                    style={styles.priceInput} 
                    value={price} 
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />
            </View>

            {/* Checkbox: Pick up */}
            <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setIsPickup(!isPickup)}
            >
                <MaterialCommunityIcons 
                    name={isPickup ? "checkbox-marked-outline" : "checkbox-blank-outline"} 
                    size={24} 
                    color={colors.primary} 
                />
                <Text style={styles.checkboxLabel}>Pick up</Text>
            </TouchableOpacity>

            {/* Checkbox: Delivery */}
            <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setIsDelivery(!isDelivery)}
            >
                <MaterialCommunityIcons 
                    name={isDelivery ? "checkbox-marked-outline" : "checkbox-blank-outline"} 
                    size={24} 
                    color={isDelivery ? colors.primary : "#E3E3E3"} // Màu xám khi chưa chọn
                />
                <Text style={styles.checkboxLabel}>Delivery</Text>
            </TouchableOpacity>
        </View>

        {/* INGREDIENTS */}
        <Text style={styles.sectionTitle}>INGREDIENTS</Text>
        
        {/* Basic Group */}
        <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Basic</Text>
            <Text style={styles.seeAll}>See All ▼</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
            {INGREDIENTS_BASIC.map(renderIngredient)}
        </ScrollView>

        {/* Fruit Group */}
        <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Fruit</Text>
            <Text style={styles.seeAll}>See All ▼</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
            {INGREDIENTS_FRUIT.map(renderIngredient)}
        </ScrollView>

        {/* DETAILS */}
        <Text style={styles.label}>DETAILS</Text>
        <TextInput 
            style={styles.textArea} 
            value={description}
            onChangeText={setDescription}
            placeholder="Lorem ipsum dolor sit amet..."
            multiline
            numberOfLines={4}
        />

        {/* SAVE BUTTON */}
        <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
        </TouchableOpacity>

        {/* Khoảng trắng dưới cùng để không bị che bởi tabbar ảo nếu có */}
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: '#ECF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#181C2E',
  },
  resetText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
  },
  content: {
      paddingHorizontal: 20,
      paddingTop: 10,
  },
  label: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#32343E',
      marginTop: 20,
      marginBottom: 10,
      textTransform: 'uppercase',
  },
  input: {
      backgroundColor: '#F6F6F6',
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 15,
      color: '#181C2E',
      fontSize: 16,
  },
  // Upload
  uploadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  uploadItem: {
      width: 100, height: 100, borderRadius: 15, overflow: 'hidden',
      position: 'relative',
  },
  uploadedImage: { width: '100%', height: '100%' },
  deleteIcon: {
      position: 'absolute', top: 5, right: 5, backgroundColor: 'red', borderRadius: 10,
  },
  uploadBox: {
      width: 100, height: 100, borderRadius: 15,
      borderWidth: 1, borderColor: '#D3D1D8', borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center',
  },
  cloudIcon: {
      backgroundColor: '#FFF2E5', width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', marginBottom: 5,
  },
  uploadText: { fontSize: 12, color: '#A0A5BA' },

  // Price & Type
  priceRow: {
      flexDirection: 'row', alignItems: 'center',
  },
  priceInputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#F6F6F6', borderRadius: 10,
      width: 100, paddingHorizontal: 15, height: 50,
      marginRight: 15,
  },
  currency: { fontSize: 16, color: '#A0A5BA', marginRight: 5 },
  priceInput: { flex: 1, fontSize: 16, color: '#181C2E' },
  checkboxRow: {
      flexDirection: 'row', alignItems: 'center', marginRight: 15,
  },
  checkboxLabel: { marginLeft: 5, color: '#A0A5BA', fontSize: 14 },

  // Ingredients
  sectionTitle: {
      fontSize: 13, fontWeight: 'bold', color: '#32343E', marginTop: 25, marginBottom: 5, textTransform: 'uppercase'
  },
  groupHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10,
  },
  groupTitle: { fontSize: 16, fontWeight: '600', color: '#32343E' },
  seeAll: { fontSize: 12, color: '#A0A5BA' },
  scrollRow: { marginBottom: 5 },
  ingItem: { alignItems: 'center', marginRight: 15 },
  ingIconCircle: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF2E5',
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ingText: { fontSize: 12, color: '#A0A5BA' },

  // Details
  textArea: {
      backgroundColor: '#F6F6F6', borderRadius: 10, padding: 20,
      height: 120, textAlignVertical: 'top', color: '#181C2E', fontSize: 14,
  },

  // Button
  saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
  },
  saveButtonText: {
      color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1,
  },
});