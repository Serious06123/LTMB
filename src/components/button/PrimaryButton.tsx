import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator, // Thêm biểu tượng loading
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme'; // Import màu từ file theme của bạn

// 1. ĐỊNH NGHĨA PROPS (ĐẦU VÀO) BẰNG TYPESCRIPT
type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean; // Thêm prop 'loading' (không bắt buộc)
  style?: StyleProp<ViewStyle>; // Thêm style tùy chỉnh (không bắt buộc)
  textStyle?: StyleProp<TextStyle>; // Thêm text style tùy chỉnh (không bắt buộc)
};

// 2. TẠO FUNCTION COMPONENT
const PrimaryButton = (props: PrimaryButtonProps) => {
  const { title, onPress, loading = false, style, textStyle } = props;

  return (
    // 3. TRẢ VỀ GIAO DIỆN (JSX)
    <TouchableOpacity
      style={[styles.primaryBtn, style]} // Áp dụng style cơ bản và style tùy chỉnh
      onPress={onPress}
      disabled={loading} // Vô hiệu hóa nút khi đang loading
    >
      {loading ? (
        // Nếu đang loading, hiển thị ActivityIndicator
        <ActivityIndicator color={colors.white} />
      ) : (
        // Nếu không, hiển thị Text
        <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// 4. Định nghĩa CSS (StyleSheet)
// Các style này được lấy từ file LoginScreen.tsx của bạn
const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.primary, // Sử dụng màu primary từ theme
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnText: {
    color: colors.white, // Sử dụng màu white từ theme
    fontWeight: '800',
    letterSpacing: 1,
  },
});

// 5. Xuất component
export default PrimaryButton;