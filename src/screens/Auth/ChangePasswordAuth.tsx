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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// Apollo Client
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

// Định nghĩa mutation đổi mật khẩu
const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($email: String!, $newPassword: String!) {
    changePassword(email: $email, newPassword: $newPassword) {
      success
      error
    }
  }
`;

interface ChangePasswordResponse {
  changePassword: {
    success: boolean;
    error?: string;
  };
}

type ChangePasswordRouteParams = {
  email: string;
};
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';

export default function ChangePasswordAuth() {

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);


  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, ChangePasswordRouteParams>, string>>();
  // Lấy email từ params (được truyền từ OTPVerify)
  const email = (route.params as ChangePasswordRouteParams)?.email;

  // Apollo mutation
  const [changePasswordApi, { loading }] = useMutation<ChangePasswordResponse>(CHANGE_PASSWORD_MUTATION);

  const handleChangePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
    if (!email) {
      Alert.alert('Lỗi', 'Không tìm thấy email. Vui lòng thử lại.');
      return;
    }
    try {
      const { data } = await changePasswordApi({
        variables: {
          email,
          newPassword: password,
        },
      });
      if (data?.changePassword?.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
        navigation.navigate('Login' as never);
      } else {
        Alert.alert('Lỗi', data?.changePassword?.error || 'Đổi mật khẩu thất bại.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={60}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập mật khẩu mới để tiếp tục</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>MẬT KHẨU MỚI</Text>
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
            >
              <Text style={styles.eyeText}>{secure ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>NHẬP LẠI MẬT KHẨU</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor="#A8B0BF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry={secureConfirm}
            />
            <TouchableOpacity
              onPress={() => setSecureConfirm(s => !s)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeText}>{secureConfirm ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title="Đổi mật khẩu"
            onPress={handleChangePassword}
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
    marginTop: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 110,
    //flex: 1
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
    paddingTop: 40,
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

  backBtn: {
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