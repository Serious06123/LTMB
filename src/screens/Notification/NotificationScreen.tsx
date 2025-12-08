import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

// --- DỮ LIỆU GIẢ (Gộp cả 2 phần) ---
const NOTIFICATIONS = [
  {
    id: '1',
    userName: 'Tanbir Ahmed',
    action: 'Placed a new order',
    time: '20 min ago',
    userAvatar: require('../../assets/images/introman1.png'),
    foodImage: IMAGES.pizza1,
    type: 'notification'
  },
  {
    id: '2',
    userName: 'Salim Smith',
    action: 'Left a 5 star review',
    time: '20 min ago',
    userAvatar: require('../../assets/images/introman2.png'),
    foodImage: IMAGES.burger1,
    type: 'notification'
  },
  {
    id: '3',
    userName: 'Royal Bengol',
    action: 'Agreed to cancel',
    time: '20 min ago',
    userAvatar: require('../../assets/images/introman3.png'),
    foodImage: IMAGES.pizza2,
    type: 'notification'
  },
];

const MESSAGES = [
  {
    id: '101',
    name: 'Royal Parvej',
    message: 'Sounds awesome!',
    time: '19:37',
    unread: 1,
    online: true,
    avatar: require('../../assets/images/introman1.png'), 
    type: 'message'
  },
  {
    id: '102',
    name: 'Cameron Williamson',
    message: 'Ok, Just hurry up little bit...😊',
    time: '19:37',
    unread: 2,
    online: true,
    avatar: require('../../assets/images/introman2.png'),
    type: 'message'
  },
  {
    id: '103',
    name: 'Ralph Edwards',
    message: 'Thanks dude.',
    time: '19:37',
    unread: 0,
    online: true,
    avatar: require('../../assets/images/introman3.png'),
    type: 'message'
  },
];

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'Notifications' | 'Messages'>('Notifications');

  // --- RENDER ITEM: THÔNG BÁO ---
  const renderNotificationItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Image source={item.userAvatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.contentString}>
          <Text style={styles.userName}>{item.userName} </Text>
          <Text style={styles.actionText}>{item.action}</Text>
        </Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
      {item.foodImage && <Image source={item.foodImage} style={styles.foodImage} />}
    </View>
  );

  // --- RENDER ITEM: TIN NHẮN ---
  const renderMessageItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <View style={styles.avatarContainer}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={[styles.onlineDotBorder, !item.online && { backgroundColor: '#BDBDBD' }]}>
             <View style={[styles.onlineDot, !item.online && { backgroundColor: '#BDBDBD' }]} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {item.message}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        <Text style={styles.timeText}>{item.time}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        {/* Nút Back ẩn đi vì đây là màn hình chính trong Tab */}
        <View style={{ width: 45 }} /> 
        <Text style={styles.headerTitle}>
            {activeTab === 'Notifications' ? 'Notifications' : 'Messages'}
        </Text>
        <View style={{ width: 45 }} />
      </View>

      {/* TABS CHUYỂN ĐỔI */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'Notifications' && styles.activeTabItem]}
          onPress={() => setActiveTab('Notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'Notifications' && styles.activeTabText]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'Messages' && styles.activeTabItem]}
          onPress={() => setActiveTab('Messages')}
        >
          <Text style={[styles.tabText, activeTab === 'Messages' && styles.activeTabText]}>
            Messages (3)
          </Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH (Thay đổi dựa trên activeTab) */}
      <FlatList
        data={activeTab === 'Notifications' ? NOTIFICATIONS : MESSAGES}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'Notifications' ? renderNotificationItem : renderMessageItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {/* QUAN TRỌNG: Đã XÓA Bottom Bar giả lập ở đây */}
      {/* Ứng dụng sẽ hiển thị Bottom Bar thật từ file MainTabs.tsx */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: '#A0A5BA',
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
  },
  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Padding dưới để không bị Bottom Bar thật che mất
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 15,
    justifyContent: 'center',
  },
  contentString: {
    fontSize: 14,
    lineHeight: 20,
    color: '#181C2E',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#181C2E',
    marginBottom: 3
  },
  actionText: {
    fontWeight: '400',
    color: '#5B5B5E',
  },
  messageText: {
    fontSize: 14,
    color: '#A0A5BA',
  },
  timeText: {
    fontSize: 12,
    color: '#A0A5BA',
    marginBottom: 5,
  },
  foodImage: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F2',
  },
  // Message specific
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  onlineDotBorder: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#fff', 
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#27AE60',
  },
});