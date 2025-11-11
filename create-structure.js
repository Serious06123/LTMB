// create-structure.js
const fs = require("fs");
const path = require("path");

const folders = [
  "src/app",
  "src/screens/Auth",
  "src/screens/Home",
  "src/screens/Restaurant",
  "src/screens/Cart",
  "src/screens/Checkout",
  "src/screens/Orders",
  "src/screens/Profile",
  "src/components/common",
  "src/components/cards",
  "src/components/list",
  "src/components/map",
  "src/features/auth",
  "src/features/restaurant",
  "src/features/cart",
  "src/features/order",
  "src/features/user",
  "src/services",
  "src/hooks",
  "src/utils",
  "src/constants",
  "src/assets/images",
  "src/assets/icons",
  "src/theme"
];

const files = {
  "src/app/store.js": `import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
export const Store = configureStore({ reducer: rootReducer });`,

  "src/app/rootReducer.js": `import { combineReducers } from '@reduxjs/toolkit';
export default combineReducers({});`,

  "src/app/navigation.js": `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
const Stack = createStackNavigator();
export default function Navigators() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}`,

  "src/screens/Auth/LoginScreen.js": `import React from 'react';
import { View, Text } from 'react-native';
export default function LoginScreen(){ return <View><Text>Login Screen</Text></View>; }`,

  "src/screens/Home/HomeScreen.js": `import React from 'react';
import { View, Text } from 'react-native';
export default function HomeScreen(){ return <View><Text>Home Screen</Text></View>; }`,

  "src/theme/index.js": `export const colors = { primary: '#FF7B00', white: '#FFF', black: '#000' };`
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  console.log("📁 created:", p);
}

function writeFile(p, content) {
  fs.writeFileSync(p, content);
  console.log("📝 created:", p);
}

try {
  console.log("🚀 Start creating folders/files...");
  folders.forEach(d => ensureDir(path.join(__dirname, d)));
  Object.entries(files).forEach(([file, content]) =>
    writeFile(path.join(__dirname, file), content)
  );
  console.log("✅ DONE.");
} catch (e) {
  console.error("❌ ERROR:", e);
  process.exit(1);
}
