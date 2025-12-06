import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import CartScreen from '../screens/Cart/CartScreen';
import IntroScreen from '../screens/Auth/Intro';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import OTPVerify from '../screens/Auth/OTPVerify';
import SearchScreen from '../screens/Home/Search';
import FoodScreen from '../screens/Food/Food';
import FoodDetailScreen from '../screens/Food/FoodDetail';
import LocationAccessScreen from '../screens/Home/LocationAccess';
import RestaurantViewScreen from '../screens/Food/RestaurantView';
import MapScreen from '../screens/Map/MapScreen';
import TrackOrderScreen from '../screens/Orders/TrackOrderScreen';
const Stack = createNativeStackNavigator();

export default function Navigators() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Intro"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LocationAccess" component={LocationAccessScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
