import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- IMPORTS MỚI ---
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';
import { GOONG_CONFIG } from '../../constants/config';
// Dữ liệu giả cho Ingredients (Giữ nguyên)
const INGREDIENTS_BASIC = [
  { id: '1', name: 'Salt', icon: 'shaker-outline' },
  { id: '2', name: 'Chicken', icon: 'food-drumstick-outline' },
  { id: '3', name: 'Onion', icon: 'seed-outline' },
  { id: '4', name: 'Garlic', icon: 'leaf' },
  { id: '5', name: 'Peppers', icon: 'chili-mild' },
  { id: '6', name: 'Ginger', icon: 'food-variant' },
];

const INGREDIENTS_FRUIT = [
  { id: '1', name: 'Avocado', icon: 'food-apple-outline' },
  { id: '2', name: 'Apple', icon: 'food-apple-outline' },
  { id: '3', name: 'Blueberry', icon: 'fruit-grapes-outline' },
  { id: '4', name: 'Broccoli', icon: 'tree' },
  { id: '5', name: 'Orange', icon: 'fruit-citrus' },
  { id: '6', name: 'Walnut', icon: 'peanut-outline' },
];

export default function AddNewItem() {
  const navigation = useNavigation();
  
  // Form State
  const [itemName, setItemName] = useState('Mazalichiken Halim');
  const [price, setPrice] = useState('50');
  const [description, setDescription] = useState('');
  const [isPickup, setIsPickup] = useState(true);
  const [isDelivery, setIsDelivery] = useState(false);

  // --- STATE CHO UPLOAD ẢNH ---
  const [imageUri, setImageUri] = useState<string | null>(null); // Ảnh hiển thị trên UI
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>(''); // Link ảnh thật để lưu vào DB
  const [uploading, setUploading] = useState(false);

  // 1. Hàm chọn ảnh
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setImageUri(asset.uri || null); // Hiển thị tạm thời
        uploadToCloudinary(asset); // Gọi hàm upload ngay khi chọn xong
      }
    });
  };

  // 2. Hàm Upload lên Backend -> Cloudinary
  const uploadToCloudinary = async (imageAsset: any) => {
    setUploading(true);
    const formData = new FormData();
    
    formData.append('image', {
      uri: imageAsset.uri,
      type: imageAsset.type,
      name: imageAsset.fileName || 'upload.jpg',
    });

    try {
      // Gọi về Backend: BASE_URL + 'upload' (Vì BASE_URL là .../api/)
      const res = await axios.post(`${GOONG_CONFIG.BASE_URL}upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload Success:', res.data.imageUrl);
      setCloudinaryUrl(res.data.imageUrl); // Lưu link ảnh từ Cloudinary trả về
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload image to server.');
      setImageUri(null); // Reset ảnh nếu lỗi
    } finally {
      setUploading(false);
    }
  };

  // 3. Hàm Save (Kết nối với API tạo món ăn sau này)
  const handleSave = () => {
    if(!cloudinaryUrl && !imageUri) {
        Alert.alert("Lưu ý", "Vui lòng chọn ảnh món ăn");
        return;
    }
    if(uploading) {
        Alert.alert("Đang tải", "Vui lòng đợi ảnh tải lên hoàn tất");
        return;
    }

    console.log("Saving Item:", {
        name: itemName,
        price,
        description,
        image: cloudinaryUrl, // Gửi link này xuống DB
        pickup: isPickup,
        delivery: isDelivery
    });
    
    Alert.alert("Success", "Ready to save to Database!");
    // Tại đây bạn sẽ gọi GraphQL Mutation để tạo món ăn
  };

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
        <TouchableOpacity onPress={() => {
            setItemName(''); setPrice(''); setDescription(''); setImageUri(null);
        }}>
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

        {/* UPLOAD PHOTO LOGIC */}
        <Text style={styles.label}>UPLOAD PHOTO/VIDEO</Text>
        <View style={styles.uploadRow}>
            
            {/* Nếu ĐANG upload -> Hiện Loading */}
            {uploading ? (
                 <View style={[styles.uploadItem, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F6' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{fontSize: 10, marginTop: 5}}>Uploading...</Text>
                 </View>
            ) : imageUri ? (
                // Nếu ĐÃ chọn ảnh -> Hiện ảnh
                <View style={styles.uploadItem}>
                    <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                    <TouchableOpacity 
                        style={styles.deleteIcon}
                        onPress={() => { setImageUri(null); setCloudinaryUrl(''); }}
                    >
                        <AntDesign name="closecircle" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                // Nếu CHƯA chọn -> Hiện nút Add để bấm vào
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                    <View style={styles.cloudIcon}>
                        <Feather name="upload-cloud" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadText}>Add Photo</Text>
                </TouchableOpacity>
            )}

            {/* Các ô Upload phụ (để trang trí hoặc thêm nhiều ảnh sau này) */}
            {!imageUri && (
                <View style={[styles.uploadBox, { opacity: 0.5 }]}>
                    <View style={styles.cloudIcon}>
                        <Feather name="upload-cloud" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadText}>Add</Text>
                </View>
            )}
             {!imageUri && (
                <View style={[styles.uploadBox, { opacity: 0.5 }]}>
                    <View style={styles.cloudIcon}>
                        <Feather name="upload-cloud" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadText}>Add</Text>
                </View>
            )}
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

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsPickup(!isPickup)}>
                <MaterialCommunityIcons 
                    name={isPickup ? "checkbox-marked-outline" : "checkbox-blank-outline"} 
                    size={24} color={colors.primary} 
                />
                <Text style={styles.checkboxLabel}>Pick up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDelivery(!isDelivery)}>
                <MaterialCommunityIcons 
                    name={isDelivery ? "checkbox-marked-outline" : "checkbox-blank-outline"} 
                    size={24} color={isDelivery ? colors.primary : "#E3E3E3"} 
                />
                <Text style={styles.checkboxLabel}>Delivery</Text>
            </TouchableOpacity>
        </View>

        {/* INGREDIENTS */}
        <Text style={styles.sectionTitle}>INGREDIENTS</Text>
        <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Basic</Text>
            <Text style={styles.seeAll}>See All ▼</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
            {INGREDIENTS_BASIC.map(renderIngredient)}
        </ScrollView>

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
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
        </TouchableOpacity>

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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  backButton: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: '#ECF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#181C2E' },
  resetText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  label: {
      fontSize: 13, fontWeight: 'bold', color: '#32343E', marginTop: 20, marginBottom: 10, textTransform: 'uppercase',
  },
  input: {
      backgroundColor: '#F6F6F6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 15, color: '#181C2E', fontSize: 16,
  },
  // Upload Styles
  uploadRow: { flexDirection: 'row', gap: 10 },
  uploadItem: {
      width: 100, height: 100, borderRadius: 15, overflow: 'hidden', position: 'relative',
  },
  uploadedImage: { width: '100%', height: '100%' },
  deleteIcon: {
      position: 'absolute', top: 5, right: 5, zIndex: 1,
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
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceInputWrap: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6', borderRadius: 10,
      width: 100, paddingHorizontal: 15, height: 50, marginRight: 15,
  },
  currency: { fontSize: 16, color: '#A0A5BA', marginRight: 5 },
  priceInput: { flex: 1, fontSize: 16, color: '#181C2E' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  checkboxLabel: { marginLeft: 5, color: '#A0A5BA', fontSize: 14 },

  // Ingredients & Details
  sectionTitle: {
      fontSize: 13, fontWeight: 'bold', color: '#32343E', marginTop: 25, marginBottom: 5, textTransform: 'uppercase'
  },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  groupTitle: { fontSize: 16, fontWeight: '600', color: '#32343E' },
  seeAll: { fontSize: 12, color: '#A0A5BA' },
  scrollRow: { marginBottom: 5 },
  ingItem: { alignItems: 'center', marginRight: 15 },
  ingIconCircle: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF2E5',
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ingText: { fontSize: 12, color: '#A0A5BA' },
  textArea: {
      backgroundColor: '#F6F6F6', borderRadius: 10, padding: 20,
      height: 120, textAlignVertical: 'top', color: '#181C2E', fontSize: 14,
  },
  saveButton: {
      backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 18,
      alignItems: 'center', marginTop: 10, marginBottom: 20,
  },
  saveButtonText: {
      color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1,
  },
});