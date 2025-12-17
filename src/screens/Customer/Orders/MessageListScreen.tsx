import React, { useEffect, useState } from 'react';
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
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import socketService from '../../../services/socketService';
import { GOONG_CONFIG } from '../../../constants/config';
import { getToken, Store } from '../../../app/store';

// Local state for conversations (populated from GraphQL: myRunningOrders + last message)
const CONVERSATIONS: any[] = [];

export default function MessageListScreen() {
  const navigation = useNavigation();
  const [convos, setConvos] = useState(CONVERSATIONS);

  const backendRoot = GOONG_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
  const rawToken = getToken();
  const token = rawToken === null ? undefined : rawToken;
  const currentUser = Store.getState()?.general?.user as any;
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    // init socket
    socketService.init(backendRoot, token);
    const sock = socketService.connect();

    const handleIncoming = (msg: any) => {
      if (!msg || !msg.orderId) return;
      setConvos(prev => {
        const idx = prev.findIndex(
          c => String(c.orderId) === String(msg.orderId),
        );
        if (idx === -1) return prev;
        const updated = [...prev];
        // increment unread if message is from other user
        if (String(msg.senderId) !== String(currentUserId)) {
          updated[idx].unread = (updated[idx].unread || 0) + 1;
        }
        updated[idx].lastMessage = msg.content;
        updated[idx].time = new Date(msg.createdAt).toLocaleTimeString();
        return updated;
      });
    };

    sock.on('message_received', handleIncoming);

    // fetch my running orders and last message per order
    (async function fetchConvos() {
      try {
        const graphqlUrl = `${backendRoot}/graphql`;
        const userId = currentUserId;
        if (!userId) return;

        // 1) get orders
        const q1 = {
          query: `query MyOrders($userId: ID!) { myRunningOrders(userId: $userId) { id status customerId restaurantId shipperId } }`,
          variables: { userId },
        };
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['token'] = token;
        const res1 = await fetch(graphqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(q1),
        });
        const j1 = await res1.json();
        const orders = j1?.data?.myRunningOrders || [];

        // for each order, fetch last message
        const convosTmp = [] as any[];
        for (const o of orders) {
          const q2 = {
            query: `query LastMsg($orderId: ID!, $limit: Int) { messages(orderId: $orderId, limit: $limit, offset:0) { _id senderId senderName content createdAt isRead } }`,
            variables: { orderId: o.id, limit: 1 },
          };
          const r2 = await fetch(graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(q2),
          });
          const j2 = await r2.json();
          const msgs = j2?.data?.messages || [];
          const last = msgs[0] || null;
          convosTmp.push({
            id: o.id,
            orderId: o.id,
            name: last?.senderName || `Order ${o.id}`,
            role: 'Order',
            lastMessage: last?.content || '—',
            time: last ? new Date(last.createdAt).toLocaleTimeString() : '-',
            unread:
              last &&
              String(last.senderId) !== String(currentUserId) &&
              !last.isRead
                ? 1
                : 0,
            avatar: IMAGES.shipperIcon || IMAGES.introman1,
            isOnline: false,
            receiverId: o.shipperId || null,
          });
        }

        setConvos(convosTmp);
      } catch (err) {
        console.warn('fetch convos error', err);
      }
    })();

    return () => {
      sock.off('message_received', handleIncoming);
      // Keep global socket alive (managed by App.tsx)
    };
  }, []);

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
        keyExtractor={item => item.id}
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
    alignItems: 'center',
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
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#eee',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 15,
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#181C2E' },
  roleText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  messageText: { fontSize: 14, color: '#A0A5BA' },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
  },
  timeText: { fontSize: 12, color: '#A0A5BA' },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#F2F2F2' },
});
