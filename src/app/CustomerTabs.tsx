import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Import các màn hình của KHÁCH HÀNG
import HomeScreen from '../screens/Home/HomeScreen';
import SearchScreen from '../screens/Home/Search';
import CartScreen from '../screens/Cart/CartScreen';
import ProfileScreen from '../screens/Restaurant/ProfileScreen'; // Dùng chung Profile hoặc tạo riêng
import MessageListScreen from '../screens/Orders/MessageListScreen';
const Tab = createBottomTabNavigator();



export default function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute', bottom: 0, left: 0, right: 0,
          elevation: 0, backgroundColor: '#ffffff', height: 70,
          borderTopLeftRadius: 30, borderTopRightRadius: 30,
          shadowColor: '#000', shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1, shadowRadius: 10,
        }
      }}
    >
      {/* 1. Home */}
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name="grid-outline" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />

      {/* 2. Search */}
      <Tab.Screen 
        name="OrderedTab" 
        component={CartScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="shopping-bag" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />

      {/* 4. Messages (Màn hình mới) */}
      <Tab.Screen 
        name="MessageTab" 
        component={MessageListScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={focused ? colors.primary : '#ccc'} />
                {/* Badge thông báo */}
                <View style={{
                    position: 'absolute', right: -2, top: -2, 
                    backgroundColor: 'red', borderRadius: 6, width: 8, height: 8
                }}/>
            </View>
          ),
        }}
      />

      {/* 5. Profile */}
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} // Tạm dùng chung ProfileScreen
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}