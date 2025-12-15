import React from 'react';
import { Provider } from 'react-redux';
import { Store } from './src/app/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigators from './src/app/navigation';


// 1. Import ApolloProvider và client
import { ApolloProvider } from '@apollo/client/react';
import client from './src/app/apolloClient';

// Configure Google Sign-In
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '119176780470-595viasb48pc5pkts6v9t0rib8hh77ev.apps.googleusercontent.com', // From google-services.json
});

export default function App() {
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