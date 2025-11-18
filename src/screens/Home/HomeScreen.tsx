
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';

export default function HomeScreen() {
  // 1. Khởi tạo hook navigation
  const navigation = useNavigation();

  // 2. Tạo hàm để điều hướng
  const goToCart = () => {
    navigation.navigate('Cart' as never); 
  };
  const goToLogin = () => {
    navigation.navigate('Login' as never); 
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      
      {/* 3. Thêm nút bấm */}
      <PrimaryButton 
        title="Go to Cart"
        onPress={goToCart}
        style={{ marginTop: 20, width: '100%' }} // Thêm style cho nút
      />

      {/* Bạn có thể thêm các nút khác tại đây */}
      {
        <PrimaryButton 
          title="Go to Login"
          onPress={goToLogin}
          style={{ marginTop: 20, width: '100%' }} // Thêm style cho nút
        />
      }
    </View>
  );
}

// 4. Thêm style cơ bản cho màn hình
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 30,
  }
});