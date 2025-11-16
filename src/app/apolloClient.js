// Trong file: src/app/apolloClient.js (File mới)

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Cấu hình đường dẫn đến server GraphQL backend của bạn
const httpLink = new HttpLink({
  // Dùng 10.0.2.2 thay cho localhost khi dùng máy ảo Android
  uri: 'http://10.0.2.2:4000/graphql',
});

// Khởi tạo client
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// Export client để App.js và authService.js có thể import
export default client;