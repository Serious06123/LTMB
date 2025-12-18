import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { BASE_URL } from '../constants/config';
import { Store } from './store';

const httpLink = new HttpLink({
  uri: BASE_URL.replace('/api/', '/graphql'),
});

const authLink = setContext((_, { headers }) => {
  const state = Store.getState();
  const token = state.general?.token || state.generalState?.token;
  console.log('Token sent to GraphQL:', token);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;