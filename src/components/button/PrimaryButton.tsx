import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme';

// 1. Cập nhật Interface: Thêm 'disabled'
type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean; // <--- THÊM DÒNG NÀY
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const PrimaryButton = (props: PrimaryButtonProps) => {
  // Lấy disabled từ props (mặc định là false nếu không truyền)
  const { title, onPress, loading = false, disabled = false, style, textStyle } = props;

  // Logic: Nút bị disable khi đang loading HOẶC khi prop disabled = true
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn, 
        style,
        // Thêm style mờ đi khi bị disable để người dùng biết
        isDisabled && { opacity: 0.6, backgroundColor: '#ccc' } 
      ]}
      onPress={onPress}
      disabled={isDisabled} // Truyền vào TouchableOpacity
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 17,
  },
});

export default PrimaryButton;