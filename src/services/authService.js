// Trong file: src/services/authService.js

import axios from 'axios';

// Định nghĩa hàm
const loginApi = async (email, password) => {
  try {
    // Giả lập một cuộc gọi API mất 2 giây
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Giả lập thành công
    if (email === 'test@gmail.com' && password === '123456') {
      return { success: true, token: 'fake-jwt-token-1234B' };
    } else {
      return { success: false, error: 'Email hoặc mật khẩu không đúng' };
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return { success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại.' };
  }
};

// Tạo một đối tượng chứa các hàm API
const authService = {
  loginApi,
  // (Thêm các hàm khác như registerApi tại đây)
};

// Export default đối tượng đó
export default authService;