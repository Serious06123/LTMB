import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

// --- 1. KHAI BÁO INTERFACE ---

interface CustomerUser {
    id: string;
    name: string;
    avatar: string | null;
}

interface RestaurantUser {
    name: string;
}

interface OrderChat {
    id: string;
    status: string;
    createdAt: string;
    customerUser: CustomerUser;
    restaurantUser: RestaurantUser;
}

interface GetActiveChatsData {
    myShippingOrders: OrderChat[];
}

// --- 2. QUERY ---
const GET_ACTIVE_CHATS = gql`
  query GetActiveChats {
    myShippingOrders {
      id
      status
      createdAt
      customerUser {
        id
        name
        avatar
      }
      restaurantUser {
        name
      }
    }
  }
`;

export default function ShipperMessageListScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    // Áp dụng Interface vào useQuery
    const { data, loading, refetch } = useQuery<GetActiveChatsData>(GET_ACTIVE_CHATS, {
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (isFocused) refetch();
    }, [isFocused]);

    // Lọc các đơn đang hoạt động (preparing, shipping)
    const chatList = (data?.myShippingOrders || []).filter((order) => 
        ['preparing', 'shipping'].includes(order.status?.toLowerCase())
    );

    const handleChat = (item: OrderChat) => {
        navigation.navigate('ChatScreen', {
            orderId: item.id,
            receiverId: item.customerUser?.id,
            receiverName: item.customerUser?.name
        });
    };

    const renderItem = ({ item }: { item: OrderChat }) => {
        // Xử lý avatar khách
        const avatarSource = item.customerUser?.avatar 
            ? { uri: item.customerUser.avatar } 
            : IMAGES.introman1;

        return (
            <TouchableOpacity 
                style={styles.chatItem} 
                onPress={() => handleChat(item)}
            >
                <Image source={avatarSource} style={styles.avatar} />
                
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.name}>{item.customerUser?.name || 'Khách hàng'}</Text>
                        <Text style={styles.time}>
                            {new Date(parseInt(item.createdAt)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                    </View>
                    
                    <Text style={styles.subText} numberOfLines={1}>
                        Đơn hàng #{item.id.slice(-6).toUpperCase()} - {item.restaurantUser?.name}
                    </Text>
                    
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {item.status === 'shipping' ? 'Đang giao hàng' : 'Đang chờ món'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
            </View>

            <FlatList
                data={chatList}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} colors={[colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                        <Text style={styles.emptySubText}>Tin nhắn sẽ xuất hiện khi bạn nhận đơn hàng.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#181C2E' },
    
    chatItem: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    content: { flex: 1, marginLeft: 15 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    time: { fontSize: 12, color: '#999' },
    subText: { fontSize: 14, color: '#666', marginBottom: 4 },
    
    statusBadge: { alignSelf: 'flex-start', backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 11, color: '#1E88E5', fontWeight: '500' },

    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, color: '#333', marginTop: 15, fontWeight: '600' },
    emptySubText: { fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center', maxWidth: '80%' }
});