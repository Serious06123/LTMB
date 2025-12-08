import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import type { AppNavigationProp } from '../../app/navigationTypes';

import PrimaryButton from '../../components/button/PrimaryButton';
import { useDispatch } from 'react-redux';
import { setToken } from '../../features/general/generalSlice';
import { colors } from '../../theme';

// 1. Import hook và gql từ Apollo Client
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import ForgotPassword from './ForgotPassword';

//import Icon from 'react-native-vector-icons/AntDesign';
// 2. Định nghĩa câu lệnh Mutation 
const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      success
      token
      error
    }
  }
`;

interface LoginResponse {
  login: {
    success: boolean;
    token: string;
    error?: string;
  };
}

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('123@gmail.com');
  const [password, setPassword] = useState<string>('123');
  const [secure, setSecure] = useState<boolean>(true);
  const [remember, setRemember] = useState<boolean>(false);
  // 4. Sử dụng hook useMutation
  // Biến 'loading' sẽ tự động được Apollo quản lý
  const [login, { loading, error }] = useMutation<LoginResponse>(LOGIN_MUTATION);

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const handleGoogleLogin = () => {
    Alert.alert("Thông báo", "Tính năng đăng nhập Google đang phát triển");
  };
  // 5. Cập nhật hàm handleLoginPress
  const handleLoginPress = async () => {
  // Vẫn kiểm tra loading
  if (loading) return;
    
  try {
    // Gọi mutation
    const { data } = await login({
      variables: {
        email: email,
        password: password,
      },
    });

    // Lấy kết quả từ data.login (tên của mutation)
    if (!data || !data.login) {
      Alert.alert('Lỗi', 'Không nhận được phản hồi từ máy chủ.');
      return;
    }
    const result = data.login;

    if (result.success) {

      // === PHẦN SỬA LỖI ===
      try {
        // 1. Lưu token vào bộ nhớ vĩnh viễn
        await AsyncStorage.setItem('userToken', result.token);

        // // 2. Nạp token vào Redux. 
        // //    Navigator sẽ tự động chuyển màn hình sau dòng này.
        dispatch(setToken(result.token));

        // // 3. XÓA BỎ DÒNG GÂY LỖI:
        navigation.navigate('CustomerTabs' as never); 

      } catch (e) {
        console.error('Lỗi khi lưu token:', e);
        Alert.alert('Lỗi', 'Không thể lưu phiên đăng nhập.');
      }
      // === KẾT THÚC SỬA LỖI ===

    } else {
      Alert.alert('Thất bại', result.error || 'Đã có lỗi xảy ra');
    }

  } catch (e) {
    // Bắt lỗi mạng hoặc lỗi server
    console.error('Lỗi khi gọi mutation:', e);
    Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
  }
};

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={60}
      >
        {/* ===== Header dark area ===== */}
        <View style={styles.hero}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Vui lòng đăng nhập vào tài khoản của bạn</Text>
          {/* <View style={styles.heroBottomCurve} /> */}
        </View>

        {/* ===== Form card ===== */}
        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="example@gmail.com"
              placeholderTextColor="#A8B0BF"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>MẬT KHẨU</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="••••••••••"
              placeholderTextColor="#A8B0BF"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={secure}
            />
            <TouchableOpacity
              onPress={() => setSecure(s => !s)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeText}>{secure ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Remember + Forgot */}
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setRemember(r => !r)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <View style={styles.checkboxDot} />}
              </View>
              <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {try {navigation.navigate(ForgotPassword as never);} catch (e) {navigation.goBack();}}}>
              <Text style={styles.linkWarn}>Quên mật khẩu</Text>
            </TouchableOpacity>
          </View>

          {/* 6. Truyền biến 'loading' từ hook useMutation vào button */}
          <PrimaryButton
            title="Đăng nhập"
            onPress={handleLoginPress}
            loading={loading} 
          />

          {/* Sign up line */}
          <View style={styles.centerRow}>
            <Text style={styles.muted}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => { try { navigation.navigate('Signup' as never); } catch (e) { navigation.navigate('Signup' as never); } }}>
              <Text style={styles.linkWarn}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerWrap}>
            <View style={styles.divider} />
            <Text style={styles.muted}>Hoặc</Text>
            <View style={styles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialColumn}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#f21d1dff' }]}>
              <View style={styles.socialBtnContent}>
                <View style={styles.socialLeft}> 
                  <Text style={styles.socialIcon}>G+</Text>
                  <View style={styles.socialDivider} />
                </View>
                <Text style={styles.socialText}>Đăng nhập với Google</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#3b5998ff'}]}>
              <View style={styles.socialBtnContent}>
                <View style={styles.socialLeft}> 
                  <Text style={styles.socialIcon}>f</Text>
                  <View style={styles.socialDivider} />
                </View>
                <Text style={styles.socialText}>Đăng nhập với Facebook</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const ORANGE = colors.primary;
const DARK = '#0f1222';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  hero: {
    backgroundColor: DARK,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 60,
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    flex: 1,
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center', },
  subtitle: {
    color: '#C9CFDA',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  heroBottomCurve: {
    position: 'absolute',
    bottom: -28,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  label: { color: '#6B7280', fontWeight: '700', fontSize: 12, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  input: { flex: 1, color: '#111827', fontSize: 16 },
  eyeBtn: { paddingLeft: 8, paddingVertical: 6 },
  eyeText: { fontSize: 18 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { borderColor: ORANGE, backgroundColor: '#fff' },
  checkboxDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: ORANGE, padding: 6.5 },
  rememberText: { marginLeft: 8, color: '#6B7280', },

  centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  linkWarn: { color: ORANGE, fontWeight: '700' },
  muted: { color: '#9CA3AF' },

  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: 80 },

  socialColumn: { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', marginTop: 16, paddingBottom: 12, width: '100%' },
  socialBtn: {
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    width: '100%',
    marginVertical: 8,
  },
  socialText: { color: colors.white, fontSize: 20, fontWeight: '600', flex: 1, marginLeft: 8 },
  socialBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  socialLeft: { width: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialIcon: { color: colors.white, fontSize: 25, fontWeight: '800', marginRight: 30 },
  socialDivider: { 
    width: 2, 
    height: 24, 
    backgroundColor: 'rgba(255,255,255,1)', 
    marginHorizontal: 10, 
    position: 'absolute',
    left: 32,
  },
});