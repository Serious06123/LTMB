import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
// Import action setLogin từ Redux Slice của bạn
import { setLogin } from '../../features/general/generalSlice'; 
import authService from '../../services/authService';
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  // Đổi tên state email -> identifier cho đúng ý nghĩa
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [secure, setSecure] = useState(true);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      // Gọi API Login
      const result = await authService.loginApi(identifier, password);

      if (result.success) {
        // 1. Lưu vào Redux
        dispatch(setLogin({ 
          token: result.token, 
          user: result.user 
        }));

        // 2. Thông báo & Chuyển trang (Redux tự chuyển nếu đã setup navigation, hoặc tự navigate)
        // Nếu App.tsx/Navigation.tsx lắng nghe isLoggedIn thì không cần dòng này
        // Alert.alert('Thành công', 'Đăng nhập thành công!'); 
        
      } else {
        // Xử lý lỗi
        Alert.alert('Đăng nhập thất bại', result.error);
        
        // Nếu lỗi là do chưa xác thực -> Gợi ý nhập OTP
        if (result.error?.includes('chưa được xác thực')) {
            // Có thể thêm nút chuyển sang trang OTP nếu muốn
            navigation.navigate('OTPVerify', { email: identifier, isSignup: true });
        }
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await authService.googleLoginApi();

      if (result.success) {
        dispatch(setLogin({ 
          token: result.token, 
          user: result.user 
        }));
      } else {
        Alert.alert('Đăng nhập thất bại', result.error);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn quay trở lại</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL HOẶC SỐ ĐIỆN THOẠI</Text>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com hoặc 0912..."
            placeholderTextColor="#A0A5BA"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>MẬT KHẨU</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
              placeholder="••••••••••"
              placeholderTextColor="#A0A5BA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Text>{secure ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.forgotPass}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 30 }}>
            <PrimaryButton 
              title="ĐĂNG NHẬP" 
              onPress={handleLogin} 
              loading={loading}
            />
          </View>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>hoặc</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
            <Text style={styles.googleIconText}>G</Text>
            <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1222' },
  backBtn: { margin: 16, width: 40, height: 40, backgroundColor: 'white', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, backgroundColor: 'white', marginTop: 50, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#32343E' },
  subtitle: { color: '#9C9BA6', marginTop: 8 },
  form: { flex: 1 },
  label: { color: '#32343E', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: '#F0F5FA', borderRadius: 10, height: 50, paddingHorizontal: 16, color: '#32343E' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F5FA', borderRadius: 10, paddingRight: 16, marginBottom: 10 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: colors.primary, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#646982' },
  signupText: { color: colors.primary, fontWeight: 'bold' },
  orContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  orText: { marginHorizontal: 10, color: '#646982', fontSize: 14 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, height: 50, marginBottom: 20 },
  googleIconText: { fontSize: 20, fontWeight: 'bold', color: '#4285F4', marginRight: 10 },
  googleButtonText: { color: '#32343E', fontSize: 16, fontWeight: 'bold' },
});