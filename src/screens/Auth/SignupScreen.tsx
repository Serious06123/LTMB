import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../../components/button/PrimaryButton';
import { colors } from '../../theme';

// 1. Import Apollo
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

// 2. Định nghĩa Mutation (Khớp với TypeDefs Backend mới)
// Lưu ý: Backend trả về String (message) nên query không cần sub-fields như id, name
const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!, $phone: String!, $role: String) {
    register(name: $name, email: $email, password: $password, phone: $phone, role: $role)
  }
`;

interface RegisterResponse {
  register: string; // Backend trả về chuỗi thông báo
}

export default function SignupScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>(''); // Thêm state Phone
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<string>('customer'); // Thêm state Role (mặc định customer)
  
  const [secure, setSecure] = useState<boolean>(true);
  const [secureConfirm, setSecureConfirm] = useState<boolean>(true);

  // Ép kiểu any để TypeScript bỏ qua kiểm tra chặt chẽ
  const navigation = useNavigation<any>();

  // 3. Khởi tạo hook mutation
  const [registerApi, { loading }] = useMutation<RegisterResponse>(REGISTER_MUTATION);

  const handleRegister = async () => {
    // Validate cơ bản
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
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
          name,
          email,
          password,
          phone,
          role
        },
      });

      // Backend trả về message string nếu thành công
      if (data?.register) {
        Alert.alert(
          'Đăng ký thành công', 
          `${data.register}`, // Hiển thị thông báo từ backend
          [
            { 
              text: 'Nhập OTP', 
              // Chuyển sang màn hình xác thực OTP, truyền theo email để verify
              // Bỏ hết "as never" đi
              onPress: () => navigation.navigate('OTPVerify', { email: email , isSignup: true })
            }
          ]
        );
      } 
    } catch (e: any) {
      console.error(e);
      // Lấy lỗi từ GraphQL trả về
      const errorMessage = e.message || 'Có lỗi xảy ra.';
      Alert.alert('Đăng ký thất bại', errorMessage);
    }
  };

  // Component chọn Role đơn giản
  const RoleOption = ({ value, label }: { value: string, label: string }) => (
    <TouchableOpacity 
      style={[styles.roleBtn, role === value && styles.roleBtnActive]}
      onPress={() => setRole(value)}
    >
      <Text style={[styles.roleText, role === value && styles.roleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

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
          {/* --- CHỌN ROLE --- */}
          <Text style={styles.label}>BẠN LÀ?</Text>
          <View style={styles.roleContainer}>
            <RoleOption value="customer" label="Khách hàng" />
            <RoleOption value="restaurant" label="Nhà hàng" />
            <RoleOption value="shipper" label="Tài xế" />
          </View>

          {/* --- HỌ TÊN --- */}
          <Text style={[styles.label, { marginTop: 16 }]}>HỌ VÀ TÊN</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Nhập họ và tên"
              placeholderTextColor="#A8B0BF"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* --- EMAIL --- */}
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

          {/* --- SỐ ĐIỆN THOẠI (Mới) --- */}
          <Text style={[styles.label, { marginTop: 16 }]}>SỐ ĐIỆN THOẠI</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="0912xxxxxx"
              placeholderTextColor="#A8B0BF"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          {/* --- MẬT KHẨU --- */}
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

          {/* --- XÁC NHẬN MẬT KHẨU --- */}
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

          <View style={{ marginTop: 24 }}>
            <PrimaryButton 
              title="Đăng ký" 
              onPress={handleRegister} 
              loading={loading} 
            />
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
    paddingTop: 10,
    paddingHorizontal: 24,
    paddingBottom: 50,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flex: 0.3 // Giảm chiều cao phần header chút để dành chỗ cho form dài hơn
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
    paddingBottom: 40
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
    position: 'absolute', // Sửa lại vị trí nút back cho đẹp
    left: 20,
    top: 50,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: DARK },

  // Style cho phần chọn Role
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#EEF2F7',
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  roleBtnActive: {
    backgroundColor: '#FFF0E6', // Màu cam nhạt
    borderColor: ORANGE,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  roleTextActive: {
    color: ORANGE,
    fontWeight: '700'
  }
});