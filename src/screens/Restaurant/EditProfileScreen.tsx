import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';

import { colors } from '../../theme';
import { BASE_URL } from '../../constants/config';

// --- Interface định nghĩa kiểu dữ liệu ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: {
    street: string;
    city: string;
  } | null; // Address có thể null
}

interface UserProfileData {
  getUserProfile: UserProfile;
}

// --- GRAPHQL QUERY & MUTATION ---
const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      name
      email
      phone
      avatar
      address {
        street
        city
      }
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $phone: String, $avatar: String, $address: AddressInput) {
    updateProfile(name: $name, phone: $phone, avatar: $avatar, address: $address) {
      id
      name
      avatar
      phone
      address {
        street
        city
      }
    }
  }
`;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  // Lấy userId từ Redux Store
  const userId = useSelector((state: any) => state.general.userId);

  // State cho Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // State xử lý upload ảnh
  const [uploading, setUploading] = useState(false);

  // 1. QUERY: Lấy dữ liệu người dùng từ DB
  const { data, loading: loadingProfile, error, refetch } = useQuery<UserProfileData>(GET_USER_PROFILE, {
    variables: { id: userId },
    skip: !userId, // Không chạy query nếu chưa có userId
    fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất từ server
  });

  // 2. USE EFFECT: Đổ dữ liệu từ DB vào các ô Input khi data thay đổi
  useEffect(() => {
    if (data?.getUserProfile) {
      const u = data.getUserProfile;
      setName(u.name || '');
      setPhone(u.phone || '');
      setAvatar(u.avatar || '');
      // Kiểm tra an toàn cho address
      if (u.address) {
        setStreet(u.address.street || '');
      }
    }
  }, [data]);

  // 3. MUTATION: Cập nhật thông tin
  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
       // Refetch lại để đảm bảo dữ liệu đồng bộ nếu cần
       refetch();
    }
  });

  // Xử lý chọn ảnh
  const handleChoosePhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      uploadImageToServer(file);
    }
  };

  // Upload ảnh lên Cloudinary qua Server của bạn
  const uploadImageToServer = async (imageAsset: any) => {
    setUploading(true);
    const formData = new FormData();

    formData.append('image', {
      uri: imageAsset.uri,
      type: imageAsset.type || 'image/jpeg',
      name: imageAsset.fileName || 'upload.jpg',
    });

    try {
      const url = `${BASE_URL}upload`; 
      const res = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Server trả về link ảnh, set vào state để hiển thị ngay
      setAvatar(res.data.imageUrl); 
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Lỗi', 'Không thể upload ảnh.');
    } finally {
      setUploading(false);
    }
  };

  // Lưu thông tin
  const handleSave = async () => {
    try {
      await updateProfile({
        variables: {
          name,
          phone,
          avatar, 
          address: { street, city: "Vietnam" } // Mặc định city hoặc thêm ô nhập city nếu cần
        }
      });
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
      navigation.goBack();
    } catch (e) {
      const errorMessage = (e as Error).message || "Có lỗi xảy ra";
      Alert.alert("Thất bại", "Lỗi cập nhật: " + errorMessage);
    }
  };

  // Hiển thị Loading khi đang tải dữ liệu ban đầu hoặc đang cập nhật
  if (loadingProfile || updating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: 10, color: '#666'}}>
            {updating ? 'Đang lưu...' : 'Đang tải dữ liệu...'}
        </Text>
      </View>
    );
  }

  if (error) {
      return (
        <View style={styles.center}>
            <Text>Có lỗi khi tải dữ liệu. Vui lòng thử lại.</Text>
            <TouchableOpacity onPress={() => refetch()} style={{marginTop: 10}}>
                <Text style={{color: colors.primary}}>Thử lại</Text>
            </TouchableOpacity>
        </View>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
      <ScrollView contentContainerStyle={{padding: 20}}>
        <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                {/* Bạn có thể thay bằng Icon Back */}
                <Text style={{fontSize: 24, color: '#333'}}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
            <View style={{width: 20}} /> 
        </View>

        {/* AVATAR SECTION */}
        <View style={styles.avatarContainer}>
          {uploading ? (
             <ActivityIndicator size="large" color={colors.primary} style={styles.avatar} />
          ) : (
             <Image 
                // Ưu tiên hiển thị avatar từ state (vừa load từ DB hoặc vừa upload xong)
                source={avatar ? { uri: avatar } : require('../../assets/images/pizza1.png')} 
                style={styles.avatar} 
             />
          )}
          
          <TouchableOpacity onPress={handleChoosePhoto} style={styles.cameraBtn}>
             <Text style={{color:'#fff', fontWeight: 'bold', fontSize: 12}}>Sửa ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* FORM SECTION */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Nhập tên của bạn"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad" 
            placeholder="Nhập số điện thoại"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ (Đường/Số nhà)</Text>
          <TextInput 
            style={styles.input} 
            value={street} 
            onChangeText={setStreet} 
            placeholder="Nhập địa chỉ"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
           <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  avatarContainer: { alignItems: 'center', marginBottom: 30, position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0f0f0', borderWidth: 2, borderColor: '#fff' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee'
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});