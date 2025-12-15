import React, { useState } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';

type RootStackParamList = {
  OTPVerify: { email: string; isSignup: boolean };
};

// Hàm kiểm tra định dạng email
function isValidEmail(email: string): boolean {
  const re = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();


  const handleSendOTP = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:4000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        navigation.navigate('OTPVerify', { email:email , isSignup: false });
      } else {
        Alert.alert('Lỗi', data.message || 'Gửi mã thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} enableOnAndroid extraScrollHeight={60}>
        <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { try { navigation.navigate('Login' as never); } catch (e) { navigation.goBack(); } }}
        ><Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.hero}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận mã xác thực</Text>
        </View>

        <View style={styles.card}>
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

          <View style={{ height: 18 }} />

          <PrimaryButton 
            title="Gửi mã"
            onPress={handleSendOTP}
            loading={loading}
          />
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
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#C9CFDA', fontSize: 15, textAlign: 'center', marginTop: 8 },

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

  backBtn: {
    //position: 'absolute',
    left: 20,
    top: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: DARK },
});
