import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../theme';

// Import các màn hình chính
import MyFoodList from '../screens/Restaurant/MyFoodList';
import RestaurantDashboard from '../screens/Restaurant/RestaurantDashboard';
import NotificationScreen from '../screens/Notification/NotificationScreen';
import AddNewItem from '../screens/Restaurant/AddNewItem';
import ReviewsScreen from '../screens/Restaurant/ReviewsScreen';
import ProfileScreen from '../screens/Restaurant/ProfileScreen';
// Tạo Tab
const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: 0, // Đẩy nút lên cao hơn mép Tab Bar
      justifyContent: 'center',
      alignItems: 'center',
      // Quan trọng: Thêm zIndex để nút bấm nhạy hơn, nằm trên các lớp khác
      zIndex: 10, 
    }}
    onPress={onPress}
    activeOpacity={0.85} // Hiệu ứng mờ nhẹ khi bấm
  >
    <View style={{
      width: 50, // Tăng kích thước lên 64 (chuẩn ngón tay cái)
      height: 50,
      borderRadius: 32, // Bo tròn hoàn hảo
      backgroundColor: colors.primary,
      
      // --- KỸ THUẬT LÀM ĐẸP ---
      // 1. Tạo viền trắng dày để tách biệt với các icon bên cạnh
      borderWidth: 4, 
      borderColor: '#ffffff', 

      // 2. Đổ bóng màu cam (Glow) thay vì bóng đen
      elevation: 8, // Bóng đổ trên Android
      shadowColor: colors.primary, // Bóng màu cam trên iOS
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, // Độ đậm của bóng
      shadowRadius: 6, // Độ lan tỏa của bóng
      
      // 3. Căn giữa icon tuyệt đối
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Icon dấu cộng sẽ được render ở đây */}
      {children} 
    </View>
  </TouchableOpacity>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: '#ffffff',
          height: 70,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }
      }}
    >
      {/* Tab 1: Dashboard */}
      <Tab.Screen 
        name="DashboardTab" 
        component={RestaurantDashboard} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons name="grid-outline" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />

      {/* Tab 2: My Food List (Menu) - ĐÃ CẬP NHẬT */}
      <Tab.Screen 
        name="MyFoodListTab" 
        component={MyFoodList} 
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="menu" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />

      {/* Tab 3: Add (Nút giữa) */}
      <Tab.Screen 
        name="AddTab" 
        component={AddNewItem} // Tạm thời trỏ về Dashboard hoặc trang Tạo món mới
        options={{
          tabBarIcon: ({ focused }) => (
            <Entypo name="plus" size={30} color="#fff" />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />
        }}
      />

      {/* Tab 4: Notifications */}
      <Tab.Screen 
        name="NotificationTab" 
        component={NotificationScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <Feather name="bell" size={24} color={focused ? colors.primary : '#ccc'} />
              <View style={{
                position: 'absolute', right: -2, top: -2, backgroundColor: 'red', borderRadius: 6, width: 8, height: 8
              }}/>
            </View>
          ),
        }}
      />

      {/* Tab 5: Profile */}
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} // Tạm thời trỏ về Dashboard nếu chưa có trang Profile
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={24} color={focused ? colors.primary : '#ccc'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}