import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather'; // Icon send/smile
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import socketService from '../../../services/socketService';
import { GOONG_CONFIG } from '../../../constants/config';
import { getToken, Store } from '../../../app/store';

// Dữ liệu giả lập tin nhắn
const INITIAL_MESSAGES = [
  {
    id: '1',
    text: 'Are you coming?',
    time: '8:10 pm',
    isSender: true, // True là mình (màu cam), False là Shipper (màu xám)
    status: 'read',
  },
  {
    id: '2',
    text: 'Hay, Congratulation for order',
    time: '8:11 pm',
    isSender: false,
    avatar: IMAGES.shipperIcon || IMAGES.introman2,
  },
  {
    id: '3',
    text: 'Hey Where are you now?',
    time: '8:11 pm',
    isSender: true,
    status: 'read',
  },
  {
    id: '4',
    text: 'I’m Coming , just wait ...',
    time: '8:12 pm',
    isSender: false,
    avatar: IMAGES.shipperIcon || IMAGES.introman1,
  },
  {
    id: '5',
    text: 'Hurry Up, Man',
    time: '8:12 pm',
    isSender: true,
    status: 'sent',
  },
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const route: any = useRoute();
  const { orderId, receiverId, receiverName } = route.params || {};

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef<any>(null);

  const backendRoot = GOONG_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
  const tokenRaw = getToken();
  const token = tokenRaw === null ? undefined : tokenRaw;
  const currentUser: any = Store.getState()?.general?.user;
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    // init socket
    socketService.init(backendRoot, token);
    const sock = socketService.connect();
    socketRef.current = sock;

    // join order room when connected
    sock.on('connect', () => {
      if (orderId) socketService.joinOrder(orderId);
    });

    const handleJoined = (data: any) => {
      // optionally show UI
    };

    const handleIncoming = (msg: any) => {
      const item = {
        id: msg._id,
        text: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString(),
        isSender: String(msg.senderId) === String(currentUserId),
        status: msg.isRead ? 'read' : 'sent',
        avatar: undefined,
      };
      setMessages(prev => [...prev, item]);
    };

    sock.on('joined', handleJoined);
    sock.on('message_received', handleIncoming);

    // fetch history via GraphQL
    (async function fetchHistory() {
      try {
        if (!orderId) return;
        const graphqlUrl = `${backendRoot}/graphql`;
        const body = {
          query: `query GetMessages($orderId: ID!, $limit: Int, $offset: Int) { messages(orderId: $orderId, limit: $limit, offset: $offset) { _id senderId senderName content createdAt isRead } }`,
          variables: { orderId, limit: 50, offset: 0 },
        };
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['token'] = token;
        const res = await fetch(graphqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json?.data?.messages) {
          const mapped = json.data.messages
            .slice()
            .reverse()
            .map((m: any) => ({
              id: m._id,
              text: m.content,
              time: new Date(m.createdAt).toLocaleTimeString(),
              isSender: String(m.senderId) === String(currentUserId),
              status: m.isRead ? 'read' : 'sent',
              avatar: undefined,
            }));
          setMessages(mapped);
        }
      } catch (err) {
        console.warn('fetch messages error', err);
      }
    })();

    return () => {
      sock.off('joined', handleJoined);
      sock.off('message_received', handleIncoming);
      // Keep global socket alive (managed by App.tsx)
    };
  }, [orderId]);

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    const optimistic = {
      id: Date.now().toString(),
      text: inputText,
      time: 'Just now',
      isSender: true,
      status: 'sent',
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');

    try {
      await socketService.sendMessage({
        orderId,
        receiverId,
        content: optimistic.text,
      });
    } catch (err) {
      console.warn('send message error', err);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.isSender) {
      // --- TIN NHẮN CỦA MÌNH (BÊN PHẢI) ---
      return (
        <View style={styles.senderContainer}>
          <Text style={styles.timeText}>{item.time}</Text>
          <View style={styles.rowRight}>
            {/* Status Icon (Check/Double Check) */}
            {item.status === 'read' ? (
              <Ionicons
                name="checkmark-done"
                size={16}
                color={colors.primary}
                style={{ marginRight: 5 }}
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={16}
                color="#ccc"
                style={{ marginRight: 5 }}
              />
            )}

            <View style={styles.senderBubble}>
              <Text style={styles.senderText}>{item.text}</Text>
            </View>

            {/* Avatar của mình (Optional, trong ảnh mẫu có) */}
            <Image source={IMAGES.introman2} style={styles.avatarSmall} />
          </View>
        </View>
      );
    } else {
      // --- TIN NHẮN CỦA SHIPPER (BÊN TRÁI) ---
      return (
        <View style={styles.receiverContainer}>
          <Text
            style={[styles.timeText, { textAlign: 'left', marginLeft: 50 }]}
          >
            {item.time}
          </Text>
          <View style={styles.rowLeft}>
            <Image source={item.avatar} style={styles.avatarSmall} />
            <View style={styles.receiverBubble}>
              <Text style={styles.receiverText}>{item.text}</Text>
            </View>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Robert Fox</Text>
        <View style={{ width: 45 }} />
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* INPUT AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity>
              <Feather name="smile" size={24} color="#A0A5BA" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Write somethings"
              placeholderTextColor="#A0A5BA"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Ionicons
                name="paper-plane-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ECF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181C2E',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#A0A5BA',
    marginBottom: 5,
    textAlign: 'right',
    marginRight: 60,
  },
  rowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  rowLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },

  // Bubbles
  senderContainer: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  senderBubble: {
    backgroundColor: colors.primary, // Màu cam
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderBottomRightRadius: 0, // Góc nhọn bên phải dưới
    marginRight: 10,
  },
  senderText: { color: '#fff', fontSize: 15 },

  receiverContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  receiverBubble: {
    backgroundColor: '#F6F6F6', // Màu xám nhạt
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderTopLeftRadius: 0, // Góc nhọn bên trái trên
    marginLeft: 10,
  },
  receiverText: { color: '#181C2E', fontSize: 15 },

  // Input
  inputWrapper: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 30, // Bo tròn
    paddingHorizontal: 15,
    paddingVertical: 5, // Để input không quá cao
    height: 60,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: '#181C2E',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff', // Nền trắng cho nút gửi
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
