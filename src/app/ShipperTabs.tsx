// src/app/ShipperTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import thư viện icon
import { colors } from '../theme'; //

import ShipperHomeScreen from '../screens/Shipper/ShipperHomeScreen';
import ShipperHistoryScreen from '../screens/Shipper/ShipperHistoryScreen';
import ShipperWalletScreen from '../screens/Shipper/ShipperWalletScreen';
import ShipperProfileScreen from '../screens/Shipper/ShipperProfileScreen';

const Tab = createBottomTabNavigator();

export default function ShipperTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { 
          height: 80, 
          paddingBottom: 10, 
          paddingTop: 0,
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 10, // Bóng đổ cho Android
          shadowOpacity: 0.1, // Bóng đổ cho iOS
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home'; // Default

          if (route.name === 'Home') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
        }
      })}
    >
      <Tab.Screen name="Home" component={ShipperHomeScreen} options={{ tabBarLabel: 'Nhận đơn' }} />
      <Tab.Screen name="History" component={ShipperHistoryScreen} options={{ tabBarLabel: 'Lịch sử' }} />
      <Tab.Screen name="Wallet" component={ShipperWalletScreen} options={{ tabBarLabel: 'Ví' }} />
      <Tab.Screen name="Profile" component={ShipperProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}