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
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../../theme';
import { IMAGES } from '../../../constants/images';
import socketService from '../../../services/socketService';
import { GOONG_CONFIG } from '../../../constants/config';
import { Store } from '../../../app/store';

// --- APOLLO CLIENT ---
import { gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react';
// 1. ĐỊNH NGHĨA INTERFACES
interface MessageData {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface GetMessagesData {
  messages: MessageData[];
}

interface SendMessageData {
  sendMessage: MessageData;
}

// 2. QUERY & MUTATION
const GET_MESSAGES = gql`
  query GetMessages($orderId: ID!, $limit: Int, $offset: Int) {
    messages(orderId: $orderId, limit: $limit, offset: $offset) {
      _id
      senderId
      senderName
      content
      createdAt
      isRead
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($orderId: ID!, $receiverId: ID!, $content: String!) {
    sendMessage(orderId: $orderId, receiverId: $receiverId, content: $content) {
      _id
      content
      createdAt
      senderId
    }
  }
`;

export default function ChatScreen() {
  const navigation = useNavigation();
  const route: any = useRoute();
  const { orderId, receiverId, receiverName } = route.params || {};

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // --- SỬA LỖI QUAN TRỌNG: LẤY USER ID AN TOÀN ---
  const state = Store.getState();
  const general = (state as any).general || {};
  
  // Ưu tiên lấy userId trực tiếp, nếu không có thì tìm trong user object (_id hoặc id)
  const currentUserId = general.userId || general.user?._id || general.user?.id;
  
  const token = general.token;
  const backendRoot = GOONG_CONFIG.BASE_URL.replace(/\/api\/?$/, '');

  // Log ID ra để kiểm tra
  useEffect(() => {
      console.log("🔥 [DEBUG] Current User ID:", currentUserId);
  }, [currentUserId]);

  const client = useApolloClient();
  const [sendMessageMutation] = useMutation<SendMessageData>(SEND_MESSAGE);

  useEffect(() => {
    // 1. INIT SOCKET
    socketService.init(backendRoot, token);
    const sock = socketService.connect();
    socketRef.current = sock;

    sock.on('connect', () => {
      if (orderId) socketService.joinOrder(orderId);
    });

    const handleIncoming = (msg: any) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === msg._id);
        if (exists) return prev;

        return [...prev, {
          id: msg._id,
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          // So sánh ID để xác định người gửi
          isSender: String(msg.senderId) === String(currentUserId),
          status: 'read',
          avatar: undefined,
        }];
      });
    };

    sock.on('message_received', handleIncoming);

    // 2. FETCH HISTORY
    const fetchHistory = async () => {
      if (!orderId) return;
      try {
        const { data } = await client.query<GetMessagesData>({
          query: GET_MESSAGES,
          variables: { orderId, limit: 50, offset: 0 },
          fetchPolicy: 'network-only',
        });

        if (data?.messages) {
          const mapped = data.messages
            .slice()
            .reverse()
            .map((m) => {
              // --- LOGIC QUAN TRỌNG NHẤT ---
              // Chuyển cả 2 về String để so sánh chính xác
              const isMine = String(m.senderId) === String(currentUserId);
              
              // Nếu bạn thấy log này sai, nghĩa là ID trong database và Redux đang lệch nhau
              // console.log(`Msg from ${m.senderId} vs Me ${currentUserId} => isMine: ${isMine}`);

              return {
                id: m._id,
                text: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSender: isMine,
                status: m.isRead ? 'read' : 'sent',
                avatar: undefined,
              };
            });
          setMessages(mapped);
        }
      } catch (err) {
        console.warn('Lỗi tải lịch sử chat:', err);
      }
    };

    fetchHistory();

    return () => {
      sock.off('message_received', handleIncoming);
    };
  }, [orderId, currentUserId]); // Thêm currentUserId vào dependency để re-run khi lấy được ID

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    const tempId = Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      text: inputText,
      time: 'Now',
      isSender: true, // Tin mình gửi thì chắc chắn là True
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const { data } = await sendMessageMutation({
        variables: {
          orderId,
          receiverId,
          content: optimisticMsg.text,
        },
      });

      if (data?.sendMessage) {
        setMessages((prev) => 
          prev.map((m) => 
            m.id === tempId 
              ? { 
                  ...m, 
                  id: data.sendMessage._id, 
                  status: 'sent', 
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  // Đảm bảo tin vừa gửi xong vẫn giữ isSender = true
                  isSender: true 
                } 
              : m
          )
        );
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      setMessages((prev) => 
        prev.map((m) => m.id === tempId ? { ...m, status: 'error' } : m)
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.isSender) {
      return (
        <View style={styles.senderContainer}>
          <Text style={styles.timeText}>{item.time}</Text>
          <View style={styles.rowRight}>
             {item.status === 'read' && <Ionicons name="checkmark-done" size={16} color={colors.primary} style={{ marginRight: 5 }} />}
             {item.status === 'sent' && <Ionicons name="checkmark" size={16} color="#ccc" style={{ marginRight: 5 }} />}
             {item.status === 'sending' && <Ionicons name="ellipse" size={10} color="#ccc" style={{ marginRight: 5 }} />}
             {item.status === 'error' && <Ionicons name="alert-circle" size={16} color="red" style={{ marginRight: 5 }} />}

            <View style={styles.senderBubble}>
              <Text style={styles.senderText}>{item.text}</Text>
            </View>
            <Image source={IMAGES.introman2} style={styles.avatarSmall} />
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.receiverContainer}>
          <Text style={[styles.timeText, { textAlign: 'left', marginLeft: 50 }]}>
            {item.time}
          </Text>
          <View style={styles.rowLeft}>
            <Image 
                source={item.avatar || IMAGES.shipperIcon || IMAGES.introman1} 
                style={styles.avatarSmall} 
            />
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <View>
             <Text style={styles.headerTitle}>{receiverName || "Chat"}</Text>
             {orderId && <Text style={{fontSize: 10, color: '#888', textAlign: 'center'}}>Order #{orderId.slice(-6)}</Text>}
        </View>
        <View style={{ width: 45 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Thêm ref và auto scroll
        ref={flatListRef}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

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
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#A0A5BA"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F2',
  },
  backBtn: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#ECF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#181C2E', textAlign: 'center' },
  listContent: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 50 },
  timeText: { fontSize: 10, color: '#A0A5BA', marginBottom: 2, textAlign: 'right', marginRight: 60 },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: 15 },
  rowLeft: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginBottom: 15 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
  senderContainer: { alignSelf: 'flex-end', maxWidth: '80%' },
  senderBubble: {
    backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderBottomRightRadius: 0, marginRight: 10,
  },
  senderText: { color: '#fff', fontSize: 15 },
  receiverContainer: { alignSelf: 'flex-start', maxWidth: '80%' },
  receiverBubble: {
    backgroundColor: '#F6F6F6', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderTopLeftRadius: 0, marginLeft: 10,
  },
  receiverText: { color: '#181C2E', fontSize: 15 },
  inputWrapper: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F2F2F2' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F6F6',
    borderRadius: 30, paddingHorizontal: 15, paddingVertical: 5, height: 50,
  },
  input: { flex: 1, marginHorizontal: 10, fontSize: 16, color: '#181C2E' },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
});