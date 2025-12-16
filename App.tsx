import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Store, getToken } from './src/app/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigators from './src/app/navigation';

// 1. Import ApolloProvider và client
import { ApolloProvider } from '@apollo/client/react';
import client from './src/app/apolloClient';

// Configure Google Sign-In
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Socket service (single global connection)
import socketService from './src/services/socketService';
import { GOONG_CONFIG } from './src/constants/config';

GoogleSignin.configure({
  webClientId:
    '119176780470-595viasb48pc5pkts6v9t0rib8hh77ev.apps.googleusercontent.com', // From google-services.json
});

export default function App() {
  useEffect(() => {
    const backendRoot = GOONG_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
    const rawToken = getToken();
    const token = rawToken === null ? undefined : rawToken;

    socketService.init(backendRoot, token);
    socketService.connect();

    // subscribe to store token changes to update socket auth
    const unsubscribe = Store.subscribe(() => {
      const t = getToken();
      if (!t) {
        // user logged out -> disconnect socket
        socketService.disconnect();
      } else {
        // update token for existing socket
        socketService.setToken(t);
      }
    });

    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  return (
    <ApolloProvider client={client}>
      <Provider store={Store}>
        <SafeAreaProvider>
          <Navigators />
        </SafeAreaProvider>
      </Provider>
    </ApolloProvider>
  );
}
