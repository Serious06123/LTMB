import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RestaurantTabs from './RestaurantTabs';
import LoginScreen from '../screens/Auth/LoginScreen';
import CartScreen from '../screens/Customer/Cart/CartScreen';
import IntroScreen from '../screens/Auth/Intro';
import PaymentScreen from '../screens//Customer/Payment/PaymentScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import OTPVerify from '../screens/Auth/OTPVerify';
import SearchScreen from '../screens//Customer/Home/Search';
import FoodScreen from '../screens//Customer/Food/Food';
import FoodDetailScreen from '../screens//Customer/Food/FoodDetail';
import LocationAccessScreen from '../screens//Customer/Home/LocationAccess';
import RestaurantViewScreen from '../screens//Customer/Food/RestaurantView';
import MapScreen from '../screens//Customer/Map/MapScreen';
import TrackOrderScreen from '../screens//Customer/Orders/TrackOrderScreen';
import RestaurantDashboard from '../screens/Restaurant/RestaurantDashboard';
import RunningOrders from '../screens/Restaurant/RunningOrders';
import FoodDetailRestaurant from '../screens/Restaurant/FoodDetailRestaurant';
import ReviewsScreen from '../screens/Restaurant/ReviewsScreen';
import CustomerTabs from './CustomerTabs'; // Import file mới tạo
import MessageListScreen from '../screens//Customer/Orders/MessageListScreen'; // Import MessageList
import ChatScreen from '../screens//Customer/Orders/ChatScreen';
import ChangePasswordAuth from '../screens/Auth/ChangePasswordAuth';
import ShipperTabs from './ShipperTabs';
import EditProfileScreen from '../screens/Restaurant/EditProfileScreen';
const Stack = createNativeStackNavigator();

export default function Navigators() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LocationAccess"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LocationAccess" component={LocationAccessScreen} />
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="MessageListScreen" component={MessageListScreen} />
        <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Food" component={FoodScreen} />
        <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
        <Stack.Screen name="RestaurantView" component={RestaurantViewScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="OTPVerify" component={OTPVerify} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="TrackOrderScreen" component={TrackOrderScreen} />
        <Stack.Screen name="RestaurantDashboard" component={RestaurantDashboard} />
        <Stack.Screen
          name="RunningOrders"
          component={RunningOrders}
          // Tùy chọn: Hiệu ứng trượt từ dưới lên giống Modal (chỉ hỗ trợ tốt trên iOS hoặc Android config native)
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="FoodDetailRestaurant" component={FoodDetailRestaurant} />
        <Stack.Screen name="ReviewsScreen" component={ReviewsScreen} />
        <Stack.Screen name="ChangePasswordAuth" component={ChangePasswordAuth} />
        <Stack.Screen name="ShipperTabs" component={ShipperTabs} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
