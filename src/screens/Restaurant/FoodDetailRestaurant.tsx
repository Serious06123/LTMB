import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../theme';

// --- IMPORTS CHO LOGIC ---
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { BASE_URL } from '../../constants/config';

// 1. Định nghĩa Mutation Update
const UPDATE_FOOD_MUTATION = gql`
  mutation UpdateFood($id: ID!, $name: String, $price: Float, $description: String, $image: String, $category: String, $isAvailable: Boolean) {
    updateFood(
      id: $id
      name: $name
      price: $price
      description: $description
      image: $image
      category: $category
      isAvailable: $isAvailable
    ) {
      id
      name
      price
      description
      image
      category
      isAvailable
    }
  }
`;

export default function FoodDetailRestaurant() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Lấy dữ liệu ban đầu
  const item = (route.params as any)?.item || {};

  // --- STATE QUẢN LÝ ---
  const [isEditing, setIsEditing] = useState(false);
  
  // Form Data
  const [name, setName] = useState(item.name || '');
  const [price, setPrice] = useState(item.price ? item.price.toString() : '0');
  const [description, setDescription] = useState(item.description || '');
  const [category, setCategory] = useState(item.category || 'Food');
  const [isAvailable, setIsAvailable] = useState(item.isAvailable !== undefined ? item.isAvailable : true);

  // Image Upload State
  const [imageUri, setImageUri] = useState<string | null>(null); // Ảnh hiển thị trên máy (local)
  const [cloudinaryUrl, setCloudinaryUrl] = useState(item.image || ''); // Link ảnh server
  const [uploading, setUploading] = useState(false);

  // --- GRAPHQL MUTATION ---
  const [updateFood, { loading: updating }] = useMutation(UPDATE_FOOD_MUTATION, {
    onCompleted: (data: any) => {
      Alert.alert("Thành công", "Cập nhật món ăn thành công!");
      setIsEditing(false);
      // Cập nhật lại state URL nếu cần
      if (data.updateFood.image) {
        setCloudinaryUrl(data.updateFood.image);
      }
    },
    onError: (error) => {
      Alert.alert("Lỗi", "Không thể cập nhật: " + error.message);
    }
  });

  // --- XỬ LÝ ẢNH (Giống AddNewItem) ---
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
          setCloudinaryUrl(res.data.imageUrl);
      } catch (error) {
          console.error('Upload failed:', error);
          Alert.alert('Error', 'Không thể upload ảnh.');
          setImageUri(null);
      } finally {
          setUploading(false);
      }
  };

  // --- XỬ LÝ LƯU ---
  const handleSave = () => {
    if (!name || !price) {
        Alert.alert("Thiếu thông tin", "Tên và giá không được để trống");
        return;
    }
    
    updateFood({
        variables: {
            id: item.id, // ID của món ăn cần sửa
            name,
            price: parseFloat(price),
            description,
            category,
            image: cloudinaryUrl,
            isAvailable
        }
    });
  };

  // --- XỬ LÝ GIAO DIỆN ---
  
  // 1. Header component
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <AntDesign name="left" size={20} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isEditing ? "Edit Food" : "Food Details"}</Text>
      
      <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
         <Text style={styles.editBtn}>{isEditing ? "CANCEL" : "EDIT"}</Text>
      </TouchableOpacity>
    </View>
  );

  // 2. Image Component
  const renderImageSection = () => {
    const displayImage = imageUri ? { uri: imageUri } : { uri: cloudinaryUrl };
    
    return (
        <View style={styles.imageContainer}>
             <Image source={displayImage} style={styles.foodImage} />
             
             {/* Chế độ xem: Hiển thị Tag */}
             {!isEditing && (
                <View style={styles.tagOverlay}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{category}</Text>
                    </View>
                    {!isAvailable && (
                         <View style={[styles.tag, { backgroundColor: '#FF4B4B', marginLeft: 10 }]}>
                            <Text style={[styles.tagText, { color: 'white' }]}>Sold Out</Text>
                         </View>
                    )}
                </View>
             )}

             {/* Chế độ sửa: Nút đổi ảnh */}
             {isEditing && (
                 <TouchableOpacity style={styles.uploadOverlay} onPress={pickImage}>
                     {uploading ? <ActivityIndicator color="#fff" /> : <Feather name="camera" size={30} color="#fff" />}
                     {!uploading && <Text style={{color: '#fff', fontWeight: 'bold'}}>Change Photo</Text>}
                 </TouchableOpacity>
             )}
        </View>
    );
  };

  // 3. Nội dung chính
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {renderHeader()}
        {renderImageSection()}

        {/* --- FORM EDITING HOẶC VIEW INFO --- */}
        {isEditing ? (
            // --- EDIT MODE ---
            <View style={styles.formContainer}>
                
                <Text style={styles.label}>ITEM NAME</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />

                <Text style={styles.label}>PRICE ($)</Text>
                <TextInput 
                    style={styles.input} 
                    value={price} 
                    onChangeText={setPrice} 
                    keyboardType="numeric" 
                    placeholder="0" 
                />

                <Text style={styles.label}>CATEGORY</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Category" />

                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={description} 
                    onChangeText={setDescription} 
                    multiline 
                    placeholder="Food description..." 
                />

                {/* Switch: Còn bán hay không */}
                <View style={styles.switchRow}>
                    <Text style={styles.label}>AVAILABLE FOR SALE</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: colors.primary }}
                        thumbColor={isAvailable ? "#fff" : "#f4f3f4"}
                        onValueChange={setIsAvailable}
                        value={isAvailable}
                    />
                </View>
                <Text style={{color: isAvailable ? colors.primary : 'red', marginBottom: 20}}>
                    {isAvailable ? "Currently selling" : "Sold out (Hidden from users)"}
                </Text>

                <TouchableOpacity 
                    style={[styles.saveButton, updating && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={updating}
                >
                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SAVE CHANGES</Text>}
                </TouchableOpacity>

            </View>
        ) : (
            // --- VIEW MODE ---
            <View>
                <View style={styles.infoRow}>
                    <Text style={styles.foodName}>{name}</Text>
                    <Text style={styles.foodPrice}>${price}</Text>
                </View>

                <View style={styles.subInfoRow}>
                    <View style={styles.ratingRow}>
                        <AntDesign name="star" size={16} color={colors.primary} />
                        <Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
                        <Text style={styles.reviewText}>({item.reviews || 0} Reviews)</Text>
                    </View>
                    <View style={{marginLeft: 'auto'}}>
                         <Text style={{color: isAvailable ? 'green' : 'red', fontWeight: 'bold'}}>
                            {isAvailable ? "In Stock" : "Out of Stock"}
                         </Text>
                    </View>
                </View>

                {/* ĐÃ BỎ PHẦN INGREDIENTS TẠI ĐÂY */}

                <Text style={styles.sectionTitle}>DESCRIPTION</Text>
                <Text style={styles.descText}>
                    {description || "No description available."}
                </Text>
            </View>
        )}

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
      borderRadius: 20,
      overflow: 'hidden',
  },
  foodImage: {
      width: '100%',
      height: 200,
      borderRadius: 20,
      backgroundColor: '#f0f0f0'
  },
  tagOverlay: {
      position: 'absolute',
      bottom: 15,
      left: 15,
      right: 15,
      flexDirection: 'row',
  },
  uploadOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center', alignItems: 'center',
      borderRadius: 20,
  },
  tag: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
  },
  tagText: {
      fontSize: 12, fontWeight: 'bold', color: '#000',
  },
  
  // Info (View Mode)
  infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5
  },
  foodName: { fontSize: 20, fontWeight: 'bold', color: '#181C2E', flex: 1, marginRight: 10 },
  foodPrice: { fontSize: 24, fontWeight: 'bold', color: '#181C2E' },
  
  subInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontWeight: 'bold', color: '#181C2E', marginLeft: 5 },
  reviewText: { color: colors.gray, marginLeft: 5, fontSize: 13 },

  sectionTitle: {
      fontSize: 14, fontWeight: 'bold', color: '#32343E', marginBottom: 10, textTransform: 'uppercase'
  },
  descText: {
      fontSize: 14, color: '#A0A5BA', lineHeight: 22
  },

  // Edit Mode Styles
  formContainer: {
      marginTop: 10,
  },
  label: {
    fontSize: 13, fontWeight: 'bold', color: '#32343E', marginTop: 10, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F6F6F6', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, color: '#181C2E', fontSize: 16,
  },
  textArea: {
    height: 100, textAlignVertical: 'top'
  },
  switchRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 5
  },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 10, marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1,
  },
});