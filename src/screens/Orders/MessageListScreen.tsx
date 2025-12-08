import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

// Dữ liệu giả: Các cuộc hội thoại
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Robert Fox', // Shipper
    role: 'Shipper',
    lastMessage: 'Hurry Up, Man',
    time: '8:12 pm',
    unread: 2,
    avatar: IMAGES.shipperIcon || require('../../assets/images/introman1.png'),
    isOnline: true,
  },
  {
    id: '2',
    name: 'Spicy Restaurant', // Nhà hàng
    role: 'Restaurant',
    lastMessage: 'Your order is ready to pickup!',
    time: '7:00 pm',
    unread: 0,
    avatar: IMAGES.pizza1, // Logo quán
    isOnline: false,
  },
];

export default function MessageListScreen() {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('ChatScreen' as never)} // Chuyển sang màn hình Chat chi tiết
    >
      <View style={styles.avatarContainer}>
        <Image source={item.avatar} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.nameRow}>
             <Text style={styles.nameText}>{item.name}</Text>
             <Text style={styles.roleText}> • {item.role}</Text>
        </View>
        <Text style={styles.messageText} numberOfLines={1}>
          {item.lastMessage}
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
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Tránh Bottom Bar
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#eee',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#27AE60', borderWidth: 2, borderColor: '#fff'
  },
  textContainer: {
    flex: 1, marginHorizontal: 15, justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  roleText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  messageText: { fontSize: 14, color: '#A0A5BA' },
  rightContainer: {
    alignItems: 'flex-end', justifyContent: 'space-between', height: 40,
  },
  timeText: { fontSize: 12, color: '#A0A5BA' },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#F2F2F2' },
});