// Trong file: src/services/authService.js (của dự án React Native)

import axios from 'axios';

// 1. ĐỊA CHỈ BACKEND SERVER CỦA BẠN
// (Nếu dùng máy ảo Android, 'localhost' sẽ là 'http://10.0.2.2:4000')
const API_BASE_URL = 'http://10.0.2.2:4000/api';

const loginApi = async (email, password) => {
  try {
    // === LOGIC CŨ (GIẢ LẬP) - XÓA ĐI ===
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // if (email === 'test@gmail.com' && password === '123456') {
    //   return { success: true, token: 'fake-jwt-token-1234B' };
    // } else {
    //   return { success: false, error: 'Email hoặc mật khẩu không đúng' };
    // }
    
    // === LOGIC MỚI (GỌI API THẬT) ===
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: email,
      password: password,
    });
    
    // Trả về dữ liệu từ server
    return response.data; // { success: true, token: '...' }

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);

    // Xử lý lỗi từ axios
    if (error.response) {
      // Nếu server có trả về lỗi (ví dụ: 401, 404)
      return error.response.data; // { success: false, error: '...' }
    }
    
    // Lỗi mạng hoặc lỗi khác
    return { success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại.' };
  }
};

const authService = {
  loginApi,
};

export default authService;