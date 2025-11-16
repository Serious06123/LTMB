// Trong file: src/services/authService.js

// 1. Import client và gql
import { gql } from '@apollo/client';
import client from '../app/apolloClient'; // Import client bạn vừa export

// Xóa: import axios from 'axios';
// Xóa: const API_BASE_URL = ...

// 2. Định nghĩa câu lệnh mutation
const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      success
      token
      error
    }
  }
`;

// 3. Viết lại hàm loginApi
const loginApi = async (email, password) => {
  try {
    // 4. Gọi client.mutate thay vì axios.post
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        email: email,
        password: password,
      },
    });

    // 5. Trả về kết quả từ GraphQL
    // (data.login khớp với tên mutation của bạn)
    return data.login; // { success: true, token: '...', error: null }

  } catch (error) {
    console.error('Lỗi đăng nhập (Apollo):', error);

    // Xử lý lỗi GraphQL hoặc lỗi mạng
    if (error.graphQLErrors || error.networkError) {
      return { success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại.' };
    }

    return { success: false, error: 'Lỗi không xác định.' };
  }
};

const authService = {
  loginApi,
};

export default authService;