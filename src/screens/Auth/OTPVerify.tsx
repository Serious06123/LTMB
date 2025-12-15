import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
// Định nghĩa Mutation
const VERIFY_OTP_MUTATION = gql`
  mutation VerifyOtp($email: String!, $otp: String!) {
    verifyOtp(email: $email, otp: $otp) {
      token
      user {
        id
        email
        isVerified
      }
    }
  }
`;

export default function OTPVerify() {
  const [otp, setOtp] = useState('');
  
  // 1. Ép kiểu any cho navigation để tránh lỗi
  const navigation = useNavigation<any>();
  
  // 2. Lấy tham số từ màn hình trước (Signup/ForgotPass)
  const route = useRoute<any>();
  const { email, isSignup } = route.params || {}; 

  // 3. Khởi tạo Mutation
  const [verifyOtpApi, { loading }] = useMutation(VERIFY_OTP_MUTATION);

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP đầy đủ');
      return;
    }

    try {
      // Gọi API
      // SỬA LỖI Ở ĐÂY: Thêm "as any" để lấy data mà không bị báo lỗi TypeScript
      const response = await verifyOtpApi({
        variables: { email, otp },
      }) as any;

      const data = response.data;

      // Kiểm tra data
      if (data?.verifyOtp) {
        if (isSignup) {
          // --- TRƯỜNG HỢP 1: ĐĂNG KÝ -> Về trang Login ---
          Alert.alert(
            'Xác thực thành công',
            'Tài khoản đã được kích hoạt. Vui lòng đăng nhập.',
            [
              { 
                text: 'Về đăng nhập', 
                onPress: () => navigation.navigate('Login') 
              }
            ]
          );
        } else {
          // --- TRƯỜNG HỢP 2: QUÊN MẬT KHẨU -> Sang trang Đổi mật khẩu ---
          Alert.alert(
            'Thành công',
            'Vui lòng đặt lại mật khẩu mới.',
            [
              {
                text: 'Tiếp tục',
                onPress: () => navigation.navigate('ChangePasswordAuth', { email: email })
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.log('Lỗi Verify:', error);
      Alert.alert('Lỗi', error.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Mã xác thực đã được gửi đến email: {email}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập mã OTP (4 số)"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />

        <PrimaryButton 
          title="Xác nhận" 
          onPress={handleVerify} 
          loading={loading}
        />
        
        <TouchableOpacity style={{marginTop: 20}}>
           <Text style={{color: colors.primary, textAlign: 'center'}}>Gửi lại mã?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 16, zIndex: 10 },
  backIcon: { fontSize: 36, color: '#000' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 20,
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 5,
    color: '#000'
  },
});