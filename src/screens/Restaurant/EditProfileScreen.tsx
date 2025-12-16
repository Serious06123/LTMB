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
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { gql } from '@apollo/client';
import { useQuery , useMutation } from '@apollo/client/react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios'; // <--- 1. Import axios

import { colors } from '../../theme';
import { BASE_URL } from '../../constants/config'; 

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: {
    street: string;
    city: string;
  };
}

interface UserProfileData {
  getUserProfile: UserProfile;
}

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
    }
  }
`;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const userId = useSelector((state: any) => state.general.userId);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load data cũ
  const { data } = useQuery<UserProfileData>(GET_USER_PROFILE, {
    variables: { id: userId }
  });

  useEffect(() => {
    if (data?.getUserProfile) {
      const u = data.getUserProfile;
      setName(u.name || '');
      setPhone(u.phone || '');
      setAvatar(u.avatar || '');
      setStreet(u.address?.street || '');
    }
  }, [data]);

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE);

  const handleChoosePhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });

    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      uploadImageToServer(file);
    }
  };

  const uploadImageToServer = async (imageAsset: any) => {
    setUploading(true);
    const formData = new FormData();

    formData.append('image', {
      uri: imageAsset.uri,
      type: imageAsset.type || 'image/jpeg', // Fallback type nếu null
      name: imageAsset.fileName || 'upload.jpg',
    });

    try {
      const url = `${BASE_URL}upload`; 
      
      console.log('Uploading to:', url);

      const res = await axios.post(url, formData, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        },
      });

      console.log('Upload Success:', res.data.imageUrl);
      
      // Cập nhật state hiển thị ảnh ngay lập tức
      setAvatar(res.data.imageUrl);

    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Lỗi', 'Không thể upload ảnh.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        variables: {
          name,
          phone,
          avatar, // Link ảnh mới nhất từ Cloudinary
          address: { street, city: "Vietnam" }
        }
      });
      Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
      navigation.goBack();
    } catch (e) {
      const errorMessage = (e as Error).message || "Có lỗi xảy ra";
      Alert.alert("Thất bại", "Lỗi cập nhật: " + errorMessage);
    }
  };

  if (updating) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{padding: 20}}>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>

        {/* AVATAR */}
        <View style={styles.avatarContainer}>
          {uploading ? (
             <ActivityIndicator size="large" color={colors.primary} style={styles.avatar} />
          ) : (
             <Image 
                source={avatar ? { uri: avatar } : require('../../assets/images/introman1.png')} 
                style={styles.avatar} 
             />
          )}
          
          <TouchableOpacity onPress={handleChoosePhoto} style={styles.cameraBtn}>
             <Text style={{color:'#fff', fontWeight: 'bold'}}>Sửa</Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput style={styles.input} value={street} onChangeText={setStreet} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
           <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', borderWidth: 1, borderColor: '#ddd' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#999', marginBottom: 5 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
    fontSize: 16,
    color: '#333'
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});