import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { gql } from '@apollo/client'; 
import { useMutation } from '@apollo/client/react';
import { colors } from '../../../theme';

// --- 1. INTERFACE ---
// Định nghĩa kiểu dữ liệu cho món ăn nhận được từ params
interface FoodParams {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    restaurantId: string; // ID quán
}

// --- 2. MUTATION ---
const ADD_TO_CART = gql`
  mutation AddToCart($foodId: ID!, $quantity: Int!, $restaurantId: ID!) {
    addToCart(foodId: $foodId, quantity: $quantity, restaurantId: $restaurantId) {
      _id
      totalAmount
      items {
        foodId
        quantity
      }
    }
  }
`;

export default function FoodDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    
    // Lấy dữ liệu món ăn từ màn hình trước
    const food: FoodParams = route.params.food; 
    
    const [quantity, setQuantity] = useState(1);

    // Mutation thêm vào giỏ
    const [addToCart, { loading }] = useMutation(ADD_TO_CART);

    const handleAddToCart = async () => {
        try {
            // --- THAY ĐỔI: GỌI THẲNG API, KHÔNG CẦN KIỂM TRA NHÀ HÀNG ---
            await addToCart({
                variables: {
                    foodId: food.id,
                    quantity: quantity,
                    restaurantId: food.restaurantId
                },
                // Refetch lại query 'GetMyCart' để màn hình Giỏ hàng tự cập nhật
                refetchQueries: ['GetMyCart'] 
            });

            Alert.alert("Thành công", "Đã thêm vào giỏ hàng!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.log("Add cart error:", error);
            Alert.alert("Lỗi", error.message || "Không thể thêm vào giỏ hàng");
        }
    };

    return (
        <View style={styles.container}>
            {/* Ảnh Món Ăn */}
            <Image source={{ uri: food.image }} style={styles.image} />

            <View style={styles.content}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.description}>{food.description || 'Không có mô tả'}</Text>
                <Text style={styles.price}>{food.price.toLocaleString()}đ</Text>
                
                {/* Bộ đếm số lượng */}
                <View style={styles.counterContainer}>
                    <Text style={styles.counterLabel}>Số lượng:</Text>
                    <View style={styles.counterControl}>
                        <TouchableOpacity 
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            style={styles.btnCounter}
                        >
                            <Text style={styles.btnCounterText}>-</Text>
                        </TouchableOpacity>
                        
                        <Text style={styles.qty}>{quantity}</Text>
                        
                        <TouchableOpacity 
                            onPress={() => setQuantity(quantity + 1)}
                            style={styles.btnCounter}
                        >
                            <Text style={styles.btnCounterText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Footer Button */}
            <View style={styles.footer}>
                <View style={styles.totalInfo}>
                     <Text style={styles.totalLabel}>Tổng tiền:</Text>
                     <Text style={styles.totalPrice}>{(food.price * quantity).toLocaleString()}đ</Text>
                </View>

                <TouchableOpacity 
                    style={styles.btnAdd} 
                    onPress={handleAddToCart}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnAddText}>Thêm vào giỏ</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 250, backgroundColor: '#eee' },
    content: { flex: 1, padding: 20 },
    foodName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    description: { fontSize: 14, color: '#666', marginTop: 5, lineHeight: 20 },
    price: { fontSize: 22, color: colors.primary, marginTop: 15, fontWeight: 'bold' },
    
    counterContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 30, justifyContent: 'space-between' },
    counterLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
    counterControl: { flexDirection: 'row', alignItems: 'center' },
    btnCounter: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    btnCounterText: { fontSize: 20, color: '#333', fontWeight: 'bold' },
    qty: { fontSize: 18, marginHorizontal: 15, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },

    footer: { 
        flexDirection: 'row', padding: 20, 
        borderTopWidth: 1, borderColor: '#eee',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 10
    },
    totalInfo: { flex: 1 },
    totalLabel: { fontSize: 12, color: '#888' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    btnAdd: { 
        flex: 1, backgroundColor: colors.primary, 
        borderRadius: 12, height: 50,
        justifyContent: 'center', alignItems: 'center' 
    },
    btnAddText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});