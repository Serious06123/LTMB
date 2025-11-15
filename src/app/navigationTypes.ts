import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Đây là nơi chúng ta định nghĩa tất cả các màn hình trong ứng dụng
 * và các tham số (params) mà chúng nhận được.
 *
 * Dựa trên file 'src/app/navigation.js' của bạn:
 * - Login: không nhận params
 * - Home: không nhận params
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  // Ví dụ: Nếu sau này bạn có màn hình chi tiết, bạn sẽ thêm vào đây:
  // ProductDetail: { productId: string };
};

/**
 * Đây là kiểu (type) tiện ích chúng ta sẽ dùng cho hook useNavigation
 * trong các component màn hình của bạn.
 */
export type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;