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

// --- IMPORTS CHO UPLOAD VÀ GRAPHQL ---
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { gql } from '@apollo/client'; // Import Apollo Client
import { useMutation } from '@apollo/client/react';
import { colors } from '../../theme';
import { BASE_URL } from '../../constants/config'; 

// --- 1. ĐỊNH NGHĨA MUTATION (Đã bỏ ingredients) ---
const CREATE_FOOD_MUTATION = gql`
  mutation CreateFood($name: String!, $price: Float!, $description: String, $image: String, $category: String!) {
    createFood(
      name: $name
      price: $price
      description: $description
      image: $image
      category: $category
    ) {
      id
      name
    }
  }
`;

export default function AddNewItem() {
  const navigation = useNavigation();
  
  // Form State
  const [itemName, setItemName] = useState('Hủ tiếu');
  const [price, setPrice] = useState('50');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fast Food'); // Mặc định category
  
  // State giả lập checkbox (Có thể dùng để chọn Category sau này)
  const [isPickup, setIsPickup] = useState(true);
  const [isDelivery, setIsDelivery] = useState(false);

  // --- STATE CHO UPLOAD ẢNH ---
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // --- HOOK GRAPHQL ---
  const [createFood, { loading: saving }] = useMutation(CREATE_FOOD_MUTATION, {
    onCompleted: (data: any) => {
      Alert.alert("Thành công", `Đã thêm món: ${data.createFood.name}`);
      navigation.goBack(); // Quay lại màn hình trước
    },
    onError: (error) => {
      Alert.alert("Lỗi", error.message);
    }
  });

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
        setImageUri(asset.uri || null);
        uploadToCloudinary(asset);
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
      const res = await axios.post(`${BASE_URL}upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Upload Success:', res.data.imageUrl);
      setCloudinaryUrl(res.data.imageUrl); 
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Không thể upload ảnh.');
      setImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  // 3. Hàm Save - Gọi GraphQL
  const handleSave = () => {
    if (!itemName || !price) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập tên và giá món ăn");
        return;
    }
    if (!cloudinaryUrl && !imageUri) {
        Alert.alert("Lưu ý", "Vui lòng chọn ảnh món ăn");
        return;
    }
    if (uploading) {
        Alert.alert("Đang tải", "Vui lòng đợi ảnh tải lên hoàn tất");
        return;
    }

    // Chuyển đổi giá sang số thực (Float)
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat)) {
        Alert.alert("Lỗi", "Giá tiền không hợp lệ");
        return;
    }

    // Gọi Mutation
    createFood({
        variables: {
            name: itemName,
            price: priceFloat,
            description: description,
            image: cloudinaryUrl, // Link ảnh từ Cloudinary
            category: category // Gửi category (ví dụ: 'Fast Food')
        }
    });
  };

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

        {/* CATEGORY (Ví dụ nhập tay, bạn có thể thay bằng Dropdown sau này) */}
        <Text style={styles.label}>CATEGORY</Text>
        <TextInput 
            style={styles.input} 
            value={category} 
            onChangeText={setCategory}
            placeholder="e.g. Burger, Pizza, Drink"
        />

        {/* UPLOAD PHOTO LOGIC */}
        <Text style={styles.label}>UPLOAD PHOTO</Text>
        <View style={styles.uploadRow}>
            {uploading ? (
                 <View style={[styles.uploadItem, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F6' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{fontSize: 10, marginTop: 5}}>Uploading...</Text>
                 </View>
            ) : imageUri ? (
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
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                    <View style={styles.cloudIcon}>
                        <Feather name="upload-cloud" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadText}>Add Photo</Text>
                </TouchableOpacity>
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
            
            {/* UI Checkbox giữ nguyên để trang trí hoặc dùng sau này */}
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

        {/* DETAILS */}
        <Text style={styles.label}>DETAILS</Text>
        <TextInput 
            style={styles.textArea} 
            value={description}
            onChangeText={setDescription}
            placeholder="Description about the food..."
            multiline
            numberOfLines={4}
        />

        {/* SAVE BUTTON */}
        <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
        >
            {saving ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
            )}
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

  // Details
  textArea: {
      backgroundColor: '#F6F6F6', borderRadius: 10, padding: 20,
      height: 120, textAlignVertical: 'top', color: '#181C2E', fontSize: 14,
  },
  saveButton: {
      backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 18,
      alignItems: 'center', marginTop: 30, marginBottom: 20,
  },
  saveButtonText: {
      color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1,
  },
});