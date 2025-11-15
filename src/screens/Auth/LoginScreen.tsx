// Trong file: src/screens/Auth/LoginScreen.tsx

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

import { SafeAreaView } from 'react-native-safe-area-context';
// Import hook useNavigation và type
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../app/navigationTypes.ts'; // (Hãy đảm bảo bạn đã tạo file này)

// Import component và logic
import PrimaryButton from '../../components/button/PrimaryButton'; // (Hãy đảm bảo bạn đã tạo file này)
import authService from '../../services/authService'; // Import default
import { useDispatch } from 'react-redux';
import { setToken } from '../../features/general/generalSlice';
import { colors } from '../../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('test@gmail.com');
  const [password, setPassword] = useState<string>('123456');
  const [secure, setSecure] = useState<boolean>(true);
  const [remember, setRemember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigation = useNavigation<AppNavigationProp>();
  const dispatch = useDispatch();

  // Hàm xử lý logic
  const handleLoginPress = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Gọi hàm logic từ đối tượng authService
    const result = await authService.loginApi(email, password);

    setIsLoading(false);

    if (result.success) {
      // Đăng nhập thành công
      dispatch(setToken(result.token));
      // Chuyển sang màn hình Home
      navigation.navigate('Home');
    } else {
      // Đăng nhập thất bại
      Alert.alert('Thất bại', result.error || 'Đã có lỗi xảy ra');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ===== Header dark area ===== */}
        <View style={styles.hero}>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Please sign in to your existing account</Text>
          <View style={styles.heroBottomCurve} />
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
          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
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
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.linkWarn}>Forgot Password</Text>
            </TouchableOpacity>
          </View>

          {/* Login button (dùng component) */}
          <PrimaryButton
            title="LOG IN"
            onPress={handleLoginPress}
            loading={isLoading}
          />

          {/* Sign up line */}
          <View style={styles.centerRow}>
            <Text style={styles.muted}>Don’t have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.linkWarn}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerWrap}>
            <View style={styles.divider} />
            <Text style={styles.muted}>Or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#3b5998' }]}>
              <Text style={styles.socialText}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1DA1F2' }]}>
              <Text style={styles.socialText}>t</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#111827' }]}>
              <Text style={styles.socialText}></Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Lấy hằng số màu từ theme
const ORANGE = colors.primary;
const DARK = '#0f1222';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  hero: {
    backgroundColor: DARK,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
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

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { borderColor: ORANGE, backgroundColor: '#fff' },
  checkboxDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: ORANGE },
  rememberText: { marginLeft: 8, color: '#6B7280' },

  centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  linkWarn: { color: ORANGE, fontWeight: '700' },
  muted: { color: '#9CA3AF' },

  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: 80 },

  socialRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingBottom: 24 },
  socialBtn: {
    width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center',
  },
  socialText: { color: '#fff', fontSize: 26, fontWeight: '800' },
});