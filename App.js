import React from 'react';
import { Provider } from 'react-redux';
import { Store } from './src/app/store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigators from './src/app/navigation';

export default function App() {
  return (
    <Provider store={Store}>
      <SafeAreaProvider>
        <Navigators />
      </SafeAreaProvider>
    </Provider>
  );
}