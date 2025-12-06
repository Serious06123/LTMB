import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
// XÓA dòng này: import { LinearGradient } from 'react-native-linear-gradient';
import { colors } from '../theme';

interface DiscountPopupProps {
  onClose: () => void;
}

const DiscountPopup: React.FC<DiscountPopupProps> = ({ onClose }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* THAY THẾ LinearGradient BẰNG View */}
      <View style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hurry Offers!</Text>
        <Text style={styles.coupon}>#1243CD2</Text>
        <Text style={styles.description}>Use the coupon get 25% discount</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>GOT IT</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999, // Thêm zIndex để chắc chắn nó nổi lên trên
  },
  popup: {
    width: '70%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFB800', // Dùng màu vàng cam thay thế cho Gradient
    // Hoặc bạn có thể dùng màu primary: backgroundColor: colors.primary,
  },
  closeButton: {
    backgroundColor: '#FFE194',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -10, // Điều chỉnh lại vị trí một chút
    right: -10,
  },
  closeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32, // Giảm size một chút cho vừa vặn
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  coupon: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    width: '80%',
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});

export default DiscountPopup;