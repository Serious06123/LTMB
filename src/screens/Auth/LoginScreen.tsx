import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Redux imports
import { useDispatch } from 'react-redux';
import { setToken, setUserId } from '../../features/general/generalSlice'; // <-- Thêm setUserId nếu cần
import { colors } from '../../theme';

// Apollo
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import PrimaryButton from '../../components/button/PrimaryButton';

// --- CẤU HÌNH ---
const GOOGLE_WEB_CLIENT_ID = '119176780470-1i0qq7puerhvf7p646lsib8epjh25jp3.apps.googleusercontent.com'; 
const BACKEND_URL = 'http://10.0.2.2:4000/api/auth/google';

// 1. SỬA LOGIN_MUTATION: Dùng identifier và lấy token/user thay vì success/error
const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

// 2. CẬP NHẬT INTERFACE RESPONSE
interface LoginResponse {
  login: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export default function LoginScreen() {
  // Đổi tên state thành identifier cho đúng ý nghĩa (Email hoặc Phone)
  const [identifier, setIdentifier] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [secure, setSecure] = useState<boolean>(true);
  const [remember, setRemember] = useState<boolean>(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [login, { loading }] = useMutation<LoginResponse>(LOGIN_MUTATION);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  // Xử lý đăng nhập Google (Giữ nguyên)
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
        await GoogleSignin.hasPlayServices();
        try { await GoogleSignin.signOut(); } catch (e) {} 
        
        const userInfo = await GoogleSignin.signIn();
        const signinResponse = userInfo as any;
        const idToken = signinResponse.data?.idToken || signinResponse.idToken;

        if (!idToken) {
           Alert.alert('Lỗi', 'Không lấy được ID Token từ Google.');
           setLoadingGoogle(false);
           return;
        }

        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            Alert.alert('Lỗi Đăng Nhập', json.error || 'Server trả về lỗi.');
            setLoadingGoogle(false);
            return;
        }

        // Lưu token
        if (json.token) {
            dispatch(setToken(json.token));
            await AsyncStorage.setItem('userToken', json.token);
            await AsyncStorage.setItem('user', JSON.stringify(json.user));
            navigation.navigate('CustomerTabs' as never);
        }

    } catch (error: any) {
      setLoadingGoogle(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Lỗi', 'Google Play Services không khả dụng.');
      } else {
        Alert.alert('Lỗi', 'Đăng nhập Google thất bại.');
      }
    }
  };

  // 3. SỬA HÀM XỬ LÝ ĐĂNG NHẬP THƯỜNG
  const handleLoginPress = async () => {
    if (loading) return;
    if (!identifier || !password) {
        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
        return;
    }

    try {
      // Gọi mutation với biến identifier
      const { data } = await login({
        variables: { 
            identifier: identifier, // Truyền giá trị vào identifier
            password: password 
        },
      });

      if (data && data.login) {
        const { token, user } = data.login;

        // Đăng nhập thành công
        try {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          dispatch(setToken(token));
          // Nếu có action setUserId thì dùng: dispatch(setUserId(user.id));
          if ( user.role == 'customer' ){
            navigation.navigate('CustomerTabs' as never); 
          }
          else if ( user.role == 'restaurant' ){
            navigation.navigate('RestaurantTabs' as never); 
          }
          else if ( user.role == 'shipper' ){
            navigation.navigate('ShipperTabs' as never);
          }
        } catch (e) {
          console.error('Lỗi lưu storage:', e);
        }
      } 
    } catch (e: any) {
      console.error('Lỗi Mutation:', e);
      // Hiển thị lỗi từ Backend (ví dụ: Sai mật khẩu, chưa xác thực OTP...)
      Alert.alert('Đăng nhập thất bại', e.message || 'Lỗi kết nối máy chủ');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} enableOnAndroid={true} extraScrollHeight={60}>
        <View style={styles.hero}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Vui lòng đăng nhập vào tài khoản của bạn</Text>
        </View>

        <View style={styles.card}>
          {/* Cập nhật Label để user biết có thể nhập SĐT */}
          <Text style={styles.label}>EMAIL HOẶC SỐ ĐIỆN THOẠI</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="example@gmail.com hoặc 09..."
              placeholderTextColor="#A8B0BF"
              value={identifier}
              onChangeText={setIdentifier} // Cập nhật biến identifier
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

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
            <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{secure ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.row} onPress={() => setRemember(r => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <View style={styles.checkboxDot} />}
              </View>
              <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as never)}>
              <Text style={styles.linkWarn}>Quên mật khẩu</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton title="Đăng nhập" onPress={handleLoginPress} loading={loading} />

          <View style={styles.centerRow}>
            <Text style={styles.muted}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
              <Text style={styles.linkWarn}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerWrap}>
            <View style={styles.divider} />
            <Text style={styles.muted}>Hoặc</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialColumn}>
            <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#ff0000ff', opacity: loadingGoogle ? 0.7 : 1 }]}
                onPress={handleGoogleLogin}
                disabled={loadingGoogle}
            >
              <View style={styles.socialBtnContent}>
                <View style={styles.socialLeft}> 
                  <Text style={styles.socialIcon}>G+</Text>
                  <View style={styles.socialDivider} />
                </View>
                <Text style={styles.socialText}>
                    {loadingGoogle ? 'Đang xử lý...' : 'Đăng nhập với Google'}
                </Text>
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
  root: { flex: 1,backgroundColor: DARK },
  hero: { backgroundColor: DARK, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 60, marginTop: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 60, flex: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#C9CFDA', fontSize: 15, textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: '#ffffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 20, paddingTop: 24, minHeight: '60%' },
  label: { color: '#6B7280', fontWeight: '700', fontSize: 12, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2F7', borderRadius: 14, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, color: '#111827', fontSize: 16 },
  eyeBtn: { paddingLeft: 8, paddingVertical: 6 },
  eyeText: { fontSize: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: ORANGE, backgroundColor: '#fff' },
  checkboxDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: ORANGE, padding: 6.5 },
  rememberText: { marginLeft: 8, color: '#6B7280' },
  centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  linkWarn: { color: ORANGE, fontWeight: '700' },
  muted: { color: '#9CA3AF' },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: 80 },
  socialColumn: { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', marginTop: 16, paddingBottom: 12, width: '100%' },
  socialBtn: { height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingLeft: 16, width: '100%', marginVertical: 8 },
  socialText: { color: colors.white, fontSize: 20, fontWeight: '600', flex: 1, marginLeft: 8 },
  socialBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  socialLeft: { width: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialIcon: { color: colors.white, fontSize: 25, fontWeight: '800', marginRight: 30 },
  socialDivider: { width: 2, height: 24, backgroundColor: 'rgba(255,255,255,1)', marginHorizontal: 10, position: 'absolute', left: 32 },
});