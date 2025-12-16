import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context'; 
import { BASE_URL } from '../constants/config'; 

// --- SỬA LỖI 1: Import đúng tên { Store } (chữ S hoa) từ file store.js ---
import { Store } from './store'; 

// 1. Cấu hình HttpLink
const httpLink = new HttpLink({
  uri: BASE_URL.replace('/api/', '/graphql'),
});

// 2. Cấu hình Auth Link (Middleware)
// --- SỬA LỖI 2: Đổi tham số thành ({ headers }) vì context giờ là tham số đầu tiên ---
const authLink = new SetContextLink(({ headers }) => { // (context, operation) -> Lấy headers từ context
  
  // Lấy state từ Redux Store (Dùng biến Store đã import đúng)
  const state = Store.getState();
  
  // Lấy token (kiểm tra cả 2 trường hợp tên slice cho chắc chắn)
  const token = state.general?.token || state.generalState?.token;

  console.log("Token sent to GraphQL:", token);

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// 3. Khởi tạo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  devtools: {
    enabled: true 
  },
});

export default client;