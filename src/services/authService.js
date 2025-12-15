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

// 3. GOOGLE LOGIN
const GOOGLE_LOGIN_MUTATION = gql`
  mutation GoogleLogin($idToken: String!) {
    googleLogin(idToken: $idToken) {
      token
      user {
        id
        name
        email
        phone
        role
        avatar
        isVerified
      }
    }
  }
`;

const googleLoginApi = async () => {
  try {
    // Get Google user info
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data.idToken;

    // Send to backend
    const { data } = await client.mutate({
      mutation: GOOGLE_LOGIN_MUTATION,
      variables: { idToken },
    });

    return { success: true, ...data.googleLogin };
  } catch (error) {
    console.error('Google Login Error:', error);
    return { success: false, error: error.message };
  }
};

// Xuất ra dưới dạng object để LoginScreen import được (import authService from ...)
const authService = {
  loginApi,
  registerUser,
  googleLoginApi,
};

export default authService;