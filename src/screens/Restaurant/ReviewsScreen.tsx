import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images';

// Dữ liệu giả đánh giá (Đã thêm foodName và sửa lại tên người dùng cho hợp lý)
const REVIEWS = [
  {
    id: '1',
    date: '20/12/2020',
    userName: 'Alex Smith',
    foodName: 'Chicken Thai Biriyani', // <--- THÊM TÊN MÓN
    rating: 5,
    comment: 'Great Food and Service. This Food so tasty & delicious. Fast delivery.',
    avatar: require('../../assets/images/introman1.png'), 
  },
  {
    id: '2',
    date: '19/12/2020',
    userName: 'Jhene Aiko',
    foodName: 'Pizza Seafood', // <--- THÊM TÊN MÓN
    rating: 4,
    comment: 'Awesome and Nice. Really like the cheese crust.',
    avatar: require('../../assets/images/introman2.png'),
  },
  {
    id: '3',
    date: '18/12/2020',
    userName: 'Drake',
    foodName: 'Burger King Special', // <--- THÊM TÊN MÓN
    rating: 4,
    comment: 'Tasty but a bit cold when arrived.',
    avatar: require('../../assets/images/introman3.png'),
  },
];

export default function ReviewsScreen() {
  const navigation = useNavigation();
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReply = (reviewId: string) => {
      if (replyingTo === reviewId) {
          Alert.alert("Phản hồi thành công", `Nội dung: ${replyText}`);
          setReplyingTo(null);
          setReplyText('');
      } else {
          setReplyingTo(reviewId);
          setReplyText('');
      }
  };

  const renderReviewItem = ({ item }: { item: typeof REVIEWS[0] }) => (
    <View style={styles.reviewCard}>
      <Image source={item.avatar} style={styles.avatar} />
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
            <Text style={styles.dateText}>{item.date}</Text>
            <TouchableOpacity>
                <Entypo name="dots-three-horizontal" size={16} color="#A0A5BA" />
            </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{item.userName}</Text>
        
        {/* Rating Stars */}
        <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
                <AntDesign 
                    key={i} 
                    name="star" 
                    size={14} 
                    color={i < item.rating ? "#FF7B00" : "#E3E3E3"} 
                    style={{ marginRight: 2 }}
                />
            ))}
        </View>

        {/* --- HIỂN THỊ TÊN MÓN ĂN (MỚI) --- */}
        <View style={styles.foodTag}>
            <Text style={styles.foodTagLabel}>Order: </Text>
            <Text style={styles.foodTagName}>{item.foodName}</Text>
        </View>

        <Text style={styles.commentText}>{item.comment}</Text>
        
        {/* Nút Phản hồi */}
        <TouchableOpacity onPress={() => handleReply(item.id)} style={styles.replyButton}>
             <Text style={styles.replyButtonText}>
                 {replyingTo === item.id ? "Gửi phản hồi" : "Phản hồi"}
             </Text>
        </TouchableOpacity>

        {/* Ô nhập liệu khi bấm phản hồi */}
        {replyingTo === item.id && (
            <TextInput 
                style={styles.replyInput}
                placeholder="Nhập nội dung phản hồi..."
                value={replyText}
                onChangeText={setReplyText}
                autoFocus
            />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 45 }} />
      </View>

      <FlatList
        data={REVIEWS}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: '#ECF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#181C2E',
  },
  listContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
  },
  reviewCard: {
      flexDirection: 'row',
      marginBottom: 25,
  },
  avatar: {
      width: 50, height: 50, borderRadius: 25, marginRight: 15,
      marginTop: 0 
  },
  contentContainer: {
      flex: 1,
      backgroundColor: '#fff', 
      borderRadius: 15,
      padding: 15,
      borderWidth: 1,
      borderColor: '#F0F5FA',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
  },
  headerRow: {
      flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5
  },
  dateText: { fontSize: 12, color: '#A0A5BA' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#181C2E', marginBottom: 5 },
  ratingRow: { flexDirection: 'row', marginBottom: 8 },
  
  // Style cho phần tên món ăn
  foodTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F6F6F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 10,
  },
  foodTagLabel: { fontSize: 12, color: '#A0A5BA' },
  foodTagName: { fontSize: 12, color: '#181C2E', fontWeight: '600' },

  commentText: { fontSize: 14, color: '#5B5B5E', lineHeight: 20, marginBottom: 10 },
  
  replyButton: { alignSelf: 'flex-start' },
  replyButtonText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  replyInput: { 
      marginTop: 10, backgroundColor: '#F6F6F6', borderRadius: 8, 
      paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#000' 
  }
});