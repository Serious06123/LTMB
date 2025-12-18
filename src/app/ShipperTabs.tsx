import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import các màn hình Shipper
import ShipperHomeScreen from '../screens/Shipper/ShipperHomeScreen';
import ShipperHistoryScreen from '../screens/Shipper/ShipperHistoryScreen';
import ShipperWalletScreen from '../screens/Shipper/ShipperWalletScreen';
import ShipperProfileScreen from '../screens/Shipper/ShipperProfileScreen';
import ShipperMessageListScreen from '../screens/Shipper/ShipperMessageListScreen'; // <--- MỚI THÊM

import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function ShipperTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9DA8C5',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 80,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      {/* 1. Trang chủ (Nhận đơn) */}
      <Tab.Screen
        name="Home"
        component={ShipperHomeScreen}
        options={{
          tabBarLabel: 'Săn đơn',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="delivery-dining" size={size + 4} color={color} />
          ),
        }}
      />

      {/* 2. Lịch sử (Quản lý đơn) */}
      <Tab.Screen
        name="History"
        component={ShipperHistoryScreen}
        options={{
          tabBarLabel: 'Hoạt động',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3. Tin nhắn (CHAT) - TAB MỚI */}
      <Tab.Screen
        name="Messages"
        component={ShipperMessageListScreen}
        options={{
          tabBarLabel: 'Tin nhắn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 4. Ví tiền */}
      <Tab.Screen
        name="Wallet"
        component={ShipperWalletScreen}
        options={{
          tabBarLabel: 'Ví',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 5. Cá nhân */}
      <Tab.Screen
        name="Profile"
        component={ShipperProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}