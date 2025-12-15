// src/screens/Shipper/ShipperProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import icon
import { colors } from '../../theme'; //

export default function ShipperProfileScreen({ navigation }: any) {
  
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => navigation.replace('Login') }
    ]);
  };

  const renderStatItem = (label: string, value: string) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // Cập nhật hàm renderMenuItem để nhận icon name thay vì emoji string
  const renderMenuItem = (label: string, iconName: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
         <Ionicons name={iconName} size={22} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.gray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../assets/images/shipper.png')} 
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.name}>Nguyễn Văn Tài Xế</Text>
          <Text style={styles.vehicleInfo}>Honda Wave • 59-X1 123.45</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FBC02D" style={{marginRight: 4}} />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {renderStatItem('Đơn hàng', '128')}
          <View style={styles.statDivider} />
          {renderStatItem('Thu nhập', '5.2tr')}
          <View style={styles.statDivider} />
          {renderStatItem('Giờ chạy', '45h')}
        </View>

        {/* Menu Options - Sử dụng tên icon Ionicons */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>Tài khoản</Text>
          {renderMenuItem('Thông tin cá nhân', 'person-outline')}
          {renderMenuItem('Phương tiện & Giấy tờ', 'bicycle-outline')}
          {renderMenuItem('Tài khoản ngân hàng', 'card-outline')}
          
          <Text style={styles.menuSectionTitle}>Hỗ trợ</Text>
          {renderMenuItem('Trung tâm trợ giúp', 'help-circle-outline')}
          {renderMenuItem('Cài đặt ứng dụng', 'settings-outline')}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="red" style={{marginRight: 10}} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 20 },
  profileHeader: {
    backgroundColor: colors.white,
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEE',
    marginBottom: 15, overflow: 'hidden', borderWidth: 3, borderColor: colors.primary,
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.black, marginBottom: 5 },
  vehicleInfo: { color: colors.gray, fontSize: 16, marginBottom: 10 },
  ratingContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', 
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 
  },
  ratingText: { fontWeight: 'bold', color: '#FBC02D' },
  
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.white,
    margin: 20, padding: 20, borderRadius: 15, elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statLabel: { color: colors.gray, fontSize: 14, marginTop: 5 },
  statDivider: { width: 1, backgroundColor: '#EEE' },

  menuContainer: { paddingHorizontal: 20 },
  menuSectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.secondary, marginTop: 15, marginBottom: 10 },
  menuItem: {
    backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 12, marginBottom: 10,
  },
  iconContainer: { 
      width: 35, alignItems: 'center', justifyContent: 'center', marginRight: 10 
  },
  menuLabel: { flex: 1, fontSize: 16, color: colors.black },

  logoutButton: {
    backgroundColor: '#FFEBEE', margin: 20, padding: 15, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center'
  },
  logoutText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
});