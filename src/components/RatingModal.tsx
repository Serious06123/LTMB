import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { colors } from '../theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// 1. CẬP NHẬT INTERFACE PROPS
interface Props {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  restaurantName: string; // <--- THÊM DÒNG NÀY
}

// 2. THÊM restaurantName VÀO THAM SỐ
const RatingModal = ({ visible, onClose, orderId, restaurantName }: Props) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập nội dung đánh giá');
        return;
    }
    
    setLoading(true);
    
    // Giả lập gửi API
    setTimeout(() => {
        setLoading(false);
        Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
        setComment('');
        setRating(5);
        onClose();
    }, 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Đánh giá đơn hàng</Text>
            <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* 3. SỬ DỤNG BIẾN restaurantName ĐỂ HIỂN THỊ */}
          <Text style={styles.subTitle}>Tại {restaurantName}</Text>
          <Text style={styles.orderId}>Mã đơn: {orderId}</Text>

          {/* Các phần chọn sao giữ nguyên */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <MaterialCommunityIcons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color="#FFD700" 
                    style={{ marginHorizontal: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Món ăn ngon không? Hãy chia sẻ nhé..."
            multiline
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: 'white', padding: 20, borderRadius: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#181C2E' },
  subTitle: { fontSize: 16, color: colors.primary, marginTop: 5, fontWeight: '600' },
  orderId: { fontSize: 12, color: '#999', marginBottom: 15 },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 20, backgroundColor: '#F9F9F9' },
  submitBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default RatingModal;