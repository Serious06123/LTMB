import { gql } from '@apollo/client';
import client from '../app/apolloClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// 1. LOGIN
const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      user {
        id
        name
        email
        phone
        role
        avatar
        isVerified # <--- QUAN TRỌNG: Thêm trường này để App biết
      }
    }
  }
`;

const loginApi = async (identifier, password) => {
  try {
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { identifier, password },
    });
    
    // Trả về định dạng chuẩn để LoginScreen dễ xử lý
    return { success: true, ...data.login };
  } catch (error) {
    console.error('Login Error:', error);
    // Trả về lỗi thay vì throw để UI tự hiển thị thông báo
    return { success: false, error: error.message };
  }
};

// 2. REGISTER (Dành cho trường hợp bạn muốn gọi qua service thay vì hook)
const registerUser = async (userData) => {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation Register($name: String!, $email: String!, $password: String!, $phone: String!, $role: String) {
          register(name: $name, email: $email, password: $password, phone: $phone, role: $role)
        }
      `,
      variables: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.role
      },
    });
    return { success: true, message: data.register };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 3. GOOGLE LOGIN (QUAN TRỌNG: Dùng FETCH thay vì GraphQL)
const googleLoginApi = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    try { await GoogleSignin.signOut(); } catch (e) {} // Logout user cũ để chọn lại

    const response = await GoogleSignin.signIn();

    // Lấy idToken từ response (hỗ trợ cả v16 mới và cũ)
    const idToken = response.data?.idToken || response.idToken;

    if (!idToken) {
      return { success: false, error: 'Không lấy được ID Token từ Google' };
    }

    // --- GỌI REST API ---
    const apiUrl = `${BASE_URL}/api/auth/google`; 
    console.log('Calling Google Login API:', apiUrl);

    const serverRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
    });

    const serverData = await serverRes.json();

    if (!serverRes.ok) {
        return { success: false, error: serverData.error || 'Lỗi server' };
    }

    return { success: true, ...serverData };

  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'User cancelled' };
    }
    console.error('Google Service Error:', error);
    return { success: false, error: error.message || 'Lỗi kết nối' };
  }
};

// Xuất ra dưới dạng object để LoginScreen import được (import authService from ...)
const authService = {
  loginApi,
  registerUser,
  googleLoginApi,
};

export default authService;