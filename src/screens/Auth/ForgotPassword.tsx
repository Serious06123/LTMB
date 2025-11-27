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
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const navigation = useNavigation();

  const handleSendCode = () => {
    // if (!email || !email.includes('@')) {
    //   Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ.');
    //   return;
    // }

    // TODO: gọi API gửi mã ở đây
    // Chỉ chuyển UI sang trang OTP (OTPVerify)
    try {
      navigation.navigate('OTPVerify' as never);
    } catch (e) {
      navigation.goBack();
    }
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
            onPress={handleSendCode} 
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
