import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../theme'; //
import { IMAGES } from '../../../constants/images';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }: any) => {
  
  // Dữ liệu giả lập (Sau này có thể lấy từ Redux Store)
  const user = {
    name: 'Halal Lab',
    email: 'halallab@gmail.com',
    avatar: IMAGES.introman1, //
    bio: 'I love fast food'
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => navigation.replace('Login') }
    ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <TouchableOpacity>
           <Text style={styles.editBtnText}>Sửa</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Phần 1: Thông tin người dùng */}
        <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
                <Image source={user.avatar} style={styles.avatar} />
                <TouchableOpacity style={styles.cameraIcon}>
                    <MaterialCommunityIcons name="camera" size={16} color="white" />
                </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userBio}>{user.bio}</Text>
        </View>

        {/* Phần 2: Các danh mục cài đặt */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Tài khoản của tôi</Text>
            
            <MenuOption 
                icon="user" 
                title="Thông tin cá nhân" 
                subtitle="Thay đổi tên, sđt"
                onPress={() => console.log('Thông tin')} 
            />
            <MenuOption 
                icon="map-pin" 
                title="Địa chỉ đã lưu" 
                subtitle="Nhà riêng, công ty"
                onPress={() => navigation.navigate('LocationAccess')} // Điều hướng test
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