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

// 1. Import Apollo
import { gql } from '@apollo/client';
import { useMutation , useQuery } from '@apollo/client/react';
// 2. Định nghĩa Mutation
const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      success
      error
      user {
        id
        name
        email
      }
    }
  }
`;

interface RegisterResponse {
  register: {
    success: boolean;
    error?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function SignupScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [secure, setSecure] = useState<boolean>(true);
  const [secureConfirm, setSecureConfirm] = useState<boolean>(true);

  const navigation = useNavigation();

  // 3. Khởi tạo hook mutation
  const [registerApi, { loading }] = useMutation<RegisterResponse>(REGISTER_MUTATION);

  const handleRegister = async () => {
    // Validate cơ bản
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      // 4. Gọi API
      const { data } = await registerApi({
        variables: {
          name: name,
          email: email,
          password: password,
        },
      });

      if (data?.register?.success) {
        Alert.alert(
          'Thành công', 
          'Tài khoản đã được tạo! Vui lòng đăng nhập.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
          ]
        );
      } else {
        Alert.alert('Đăng ký thất bại', data?.register?.error || 'Có lỗi xảy ra.');
      }

    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ.');
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
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>HỌ VÀ TÊN</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Nhập họ và tên"
              placeholderTextColor="#A8B0BF"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>EMAIL</Text>
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
            title="Đăng ký" 
            onPress={handleRegister} 
            loading={loading} // Hiển thị vòng quay khi đang gọi API
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
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flex: 1
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#C9CFDA', fontSize: 15, textAlign: 'center', marginTop: 8, },

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