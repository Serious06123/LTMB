import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { colors } from '../../theme';
import { BASE_URL } from '../../constants/config';

// Mutation Update
const UPDATE_FOOD_MUTATION = gql`
  mutation UpdateFood($id: ID!, $name: String, $price: Float, $description: String, $image: String, $category: String) {
    updateFood(id: $id, name: $name, price: $price, description: $description, image: $image, category: $category) {
      id
      name
      image
      price
      description
      category
    }
  }
`;

export default function EditFoodScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { item } = (route.params as any) || {};

    // Form State (Khởi tạo bằng dữ liệu cũ)
    const [name, setName] = useState(item?.name || '');
    const [price, setPrice] = useState(item?.price?.toString() || '');
    const [description, setDescription] = useState(item?.description || '');
    const [category, setCategory] = useState(item?.category || '');
    
    // Image State
    const [imageUri, setImageUri] = useState<string | null>(null); // Ảnh trên máy
    const [cloudinaryUrl, setCloudinaryUrl] = useState<string>(item?.image || ''); // Ảnh trên server
    const [uploading, setUploading] = useState(false);

    // Mutation
    const [updateFood, { loading: saving }] = useMutation(UPDATE_FOOD_MUTATION, {
        onCompleted: (data) => {
            Alert.alert("Thành công", "Đã cập nhật món ăn!");
            // Quay lại và truyền data mới về (hoặc tự động reload nếu dùng Apollo Cache tốt)
            navigation.navigate('MyFoodList' as never); 
        },
        onError: (err) => Alert.alert("Lỗi", err.message)
    });

    // Hàm chọn ảnh
    const pickImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                setImageUri(asset.uri || null);
                uploadToCloudinary(asset);
            }
        });
    };

    // Hàm upload ảnh
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
            Alert.alert('Error', 'Không thể upload ảnh.');
            setImageUri(null);
        } finally {
            setUploading(false);
        }
    };

    // Hàm Lưu
    const handleUpdate = () => {
        if (!name || !price) {
            Alert.alert("Thiếu thông tin", "Tên và giá không được để trống");
            return;
        }

        updateFood({
            variables: {
                id: item.id || item._id, // Đảm bảo có ID
                name,
                price: parseFloat(price),
                description,
                category,
                image: cloudinaryUrl
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <AntDesign name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Item</Text>
                <View style={{width: 24}} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ẢNH */}
                <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                     {uploading ? <ActivityIndicator size="large" color={colors.primary} /> : (
                         <Image 
                            source={{ uri: imageUri || cloudinaryUrl }} 
                            style={styles.foodImage} 
                         />
                     )}
                     <View style={styles.cameraIcon}>
                        <Feather name="camera" size={20} color="#fff" />
                     </View>
                </TouchableOpacity>

                {/* TÊN MÓN */}
                <Text style={styles.label}>ITEM NAME</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                {/* DANH MỤC */}
                <Text style={styles.label}>CATEGORY</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} />

                {/* GIÁ */}
                <Text style={styles.label}>PRICE ($)</Text>
                <TextInput 
                    style={styles.input} 
                    value={price} 
                    onChangeText={setPrice} 
                    keyboardType="numeric" 
                />

                {/* MÔ TẢ */}
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={description} 
                    onChangeText={setDescription} 
                    multiline 
                />

                <TouchableOpacity 
                    style={styles.saveBtn} 
                    onPress={handleUpdate}
                    disabled={saving || uploading}
                >
                    {saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.saveText}>UPDATE ITEM</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    imageContainer: { alignSelf: 'center', marginBottom: 20, width: '100%', height: 200, borderRadius: 15, overflow: 'hidden', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    foodImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    cameraIcon: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#9796A1', marginTop: 15, marginBottom: 10 },
    input: { backgroundColor: '#F6F6F6', borderRadius: 10, padding: 15, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 30 },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});