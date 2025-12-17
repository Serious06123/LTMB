import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- REDUX & GRAPHQL ---
import { useDispatch } from 'react-redux';
import { logout } from '../../../features/general/generalSlice';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { BASE_URL } from '../../../constants/config';

// 1. ĐỊNH NGHĨA INTERFACE
interface Address {
  street: string;
  city: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address?: Address;
}

interface GetMeData {
  me: UserProfile;
}

// 2. QUERY LẤY THÔNG TIN CÁ NHÂN
const GET_ME = gql`
  query GetMe {
    me {
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

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();

  // 3. GỌI API
  const { data, loading, error, refetch } = useQuery<GetMeData>(GET_ME, {
    fetchPolicy: 'network-only', // Luôn lấy dữ liệu mới nhất
  });

  // Tự động refresh khi quay lại màn hình này (ví dụ sau khi sửa đổi thông tin)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });
    return unsubscribe;
  }, [navigation]);

  const user = data?.me;

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Đồng ý', 
        onPress: () => {
          // 1. Xóa data trong Redux
          dispatch(logout());
          // 2. Reset Navigation về màn hình Login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } 
      }
    ]);
  };

  // Hàm xử lý hiển thị Avatar
  const getAvatarSource = () => {
    if (user?.avatar) {
      if (user.avatar.startsWith('http')) {
        return { uri: user.avatar };
      }
      return { uri: `${BASE_URL}${user.avatar}` };
    }
    return IMAGES.introman1; // Ảnh mặc định
  };

  // Component hiển thị từng dòng menu
  const MenuOption = ({ icon, title, subtitle, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: isDestructive ? '#FFE5E5' : '#F6F8FA' }]}>
        <Feather name={icon} size={22} color={isDestructive ? '#FF3B30' : colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="navigate-next" size={24} color="#CDCDE0" />
    </TouchableOpacity>
  );

  if (loading && !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity onPress={() => console.log("Navigate to EditProfile")}>
           <Text style={styles.editBtnText}>Sửa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Phần 1: Thông tin người dùng (Từ Database) */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <Image source={getAvatarSource()} style={styles.avatar} />
                <TouchableOpacity style={styles.cameraIcon}>
                    <MaterialCommunityIcons name="camera" size={16} color="white" />
                </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || "Người dùng"}</Text>
            <Text style={styles.userEmail}>{user?.email || "Chưa cập nhật email"}</Text>
            {/* Hiển thị SĐT hoặc Địa chỉ làm Bio */}
            <Text style={styles.userBio}>
              {user?.phone ? user.phone : (user?.address?.street ? user.address.street : 'Chưa cập nhật thông tin')}
            </Text>
        </View>

        {/* Phần 2: Các danh mục cài đặt */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Tài khoản của tôi</Text>
            
            <MenuOption 
                icon="user" 
                title="Thông tin cá nhân" 
                subtitle="Thay đổi tên, sđt"
                onPress={() => navigation.navigate('EditProfileScreen')} 
            />
            <MenuOption 
                icon="map-pin" 
                title="Địa chỉ đã lưu" 
                subtitle={user?.address?.street || "Chưa có địa chỉ"}
                onPress={() => navigation.navigate('LocationAccess')} 
            />
            <MenuOption 
                icon="credit-card" 
                title="Phương thức thanh toán" 
                subtitle="Visa, Momo, ZaloPay"
                onPress={() => console.log('Thanh toán')} 
            />
        </View>

        <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Cài đặt ứng dụng</Text>
            
            <MenuOption 
                icon="bell" 
                title="Thông báo" 
                onPress={() => console.log('Thông báo')} 
            />
            <MenuOption 
                icon="globe" 
                title="Ngôn ngữ" 
                subtitle="Tiếng Việt"
                onPress={() => console.log('Ngôn ngữ')} 
            />
             <MenuOption 
                icon="moon" 
                title="Chế độ tối" 
                subtitle="Tắt"
                onPress={() => console.log('Dark mode')} 
            />
        </View>

        {/* Phần 3: Đăng xuất */}
        <View style={[styles.sectionContainer, { marginBottom: 30 }]}>
            <MenuOption 
                icon="log-out" 
                title="Đăng xuất" 
                isDestructive={true}
                onPress={handleLogout} 
            />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  editBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#F6F8FA',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#32343E',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#A0A5BA',
    marginBottom: 5,
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#32343E',
    marginBottom: 15,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginBottom: 10,
  },
  menuIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32343E',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#A0A5BA',
    marginTop: 2,
  },
});

export default ProfileScreen;