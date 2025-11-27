import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { colors } from '../../theme';
import { IMAGES } from '../../constants/images.js';
// --- 1. CẤU TRÚC DỮ LIỆU ---
interface Product {
  id: string;
  name: string;
  variation: string; 
  price: number;
  originalPrice?: number;
  image: any;
  quantity: number;
  checked: boolean;
}

interface ShopGroup {
  shopId: string;
  shopName: string;
  items: Product[];
  checked: boolean;
}

// --- 2. DỮ LIỆU GIẢ (PIZZA & ĐỒ ĂN) ---
const DUMMY_CART: ShopGroup[] = [
  {
    shopId: 's1',
    shopName: 'Pizza Hut - Lê Văn Sỹ',
    checked: false,
    items: [
      {
        id: 'p1',
        name: 'Pizza Hải Sản Pesto (Seafood Pesto)',
        variation: 'Đế giòn, Size L',
        price: 269000,
        image: IMAGES.pizza1, // Ảnh pizza1 có sẵn
        quantity: 1,
        checked: false,
      },
      {
        id: 'p2',
        name: 'Mỳ Ý Sốt Bò Bằm (Bolognese)',
        variation: 'Không cay',
        price: 89000,
        image: IMAGES.pizza2, // Ảnh pizza2 có sẵn
        quantity: 2,
        checked: false,
      },
    ],
  },
  {
    shopId: 's2',
    shopName: 'Burger King - Vincom',
    checked: false,
    items: [
      {
        id: 'p3',
        name: 'Combo Burger Bò Phô Mai + Khoai + Nước',
        variation: 'Size Vừa',
        price: 159000,
        originalPrice: 190000,
        image: IMAGES.burger1, // Dùng tạm ảnh introman2
        quantity: 1,
        checked: false,
      },
    ],
  },
  {
    shopId: 's3',
    shopName: 'Trà Sữa Gong Cha',
    checked: false,
    items: [
      { id: 'p4', name: 'Trà Sữa Trân Châu Đen', variation: '50% đường, 50% đá, Size M', price: 55000, image: IMAGES.tea1, quantity: 3, checked: false },
    ],
  },
  {
    shopId: 's4',
    shopName: 'Trà Sữa Gong Cha',
    checked: false,
    items: [
      { id: 'p5', name: 'Trà Sữa Trân Châu Đen', variation: '50% đường, 50% đá, Size M', price: 55000, image: IMAGES.shop_chicken, quantity: 3, checked: false },
    ],
  },
];

// --- COMPONENT CHECKBOX ---
const CheckBox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.checkBoxHitSlop}>
    <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
      {checked && <Icon name="checkmark" size={12} color="#FFF" />}
    </View>
  </TouchableOpacity>
);

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartData, setCartData] = useState<ShopGroup[]>(DUMMY_CART);

  // --- LOGIC XỬ LÝ (GIỮ NGUYÊN) ---
  const toggleShop = (shopId: string) => {
    const newData = cartData.map(shop => {
      // Nếu là Shop đang được bấm
      if (shop.shopId === shopId) {
        const newChecked = !shop.checked; // Đảo ngược trạng thái hiện tại
        return {
          ...shop,
          checked: newChecked,
          // Chọn/Bỏ chọn tất cả món trong shop này
          items: shop.items.map(item => ({ ...item, checked: newChecked })),
        };
      }
      
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
      };
    });
    setCartData(newData);
  };
  const toggleItem = (shopId: string, itemId: string) => {
    const newData = cartData.map(shop => {
      // Nếu là Shop chứa món đang bấm
      if (shop.shopId === shopId) {
        const newItems = shop.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        
        // Kiểm tra xem có phải tất cả món trong shop này đều được chọn không
        // (Để update checkbox của Shop header)
        const allChecked = newItems.length > 0 && newItems.every(item => item.checked);
        
        // Nếu có ít nhất 1 món được chọn thì giữ checkbox shop (hoặc tùy logic UI của bạn)
        // Ở đây mình để logic: Chỉ check header nếu TẤT CẢ item được check
        return { ...shop, items: newItems, checked: allChecked };
      }

      // === QUAN TRỌNG: Nếu là món thuộc Shop khác -> BỎ CHỌN HẾT ===
      return {
        ...shop,
        checked: false, // Bỏ chọn header shop
        items: shop.items.map(item => ({ ...item, checked: false })), // Bỏ chọn items
      };
    });
    setCartData(newData);
  };

  const deselectAll = () => {
    const newData = cartData.map(shop => ({
      ...shop,
      checked: false,
      items: shop.items.map(item => ({ ...item, checked: false })),
    }));
    setCartData(newData);
  };

  const getTotalPrice = () => {
    let total = 0;
    cartData.forEach(shop => {
      shop.items.forEach(item => {
        if (item.checked) {
          total += item.price * item.quantity;
        }
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    let count = 0;
    cartData.forEach(shop => shop.items.forEach(item => { if(item.checked) count++; }));
    return count;
  };

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  };

  // --- RENDER ITEM ---
  const renderShopGroup = ({ item: shop }: { item: ShopGroup }) => (
    <View style={styles.shopBlock}>
      {/* Header của Shop */}
      <View style={styles.shopHeader}>
        <View style={styles.row}>
          <CheckBox checked={shop.checked} onPress={() => toggleShop(shop.shopId)} />
          <Icon name="storefront-outline" size={18} color="#333" style={{ marginLeft: 8, marginRight: 4 }} />
          <Text style={styles.shopName}>{shop.shopName}</Text>
          <Icon name="chevron-forward" size={16} color="#999" />
        </View>
        <Text style={styles.editText}>Sửa</Text>
      </View>

      {/* Danh sách món ăn trong Shop */}
      {shop.items.map((product) => (
        <View key={product.id} style={styles.productItem}>
          <View style={styles.productRow}>
            <CheckBox checked={product.checked} onPress={() => toggleItem(shop.shopId, product.id)} />
            
            <Image source={product.image} style={styles.productImage} />
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.variationTag}>
                <Text style={styles.variationText}>{product.variation}</Text>
                <Icon name="chevron-down" size={10} color="#666" />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatCurrency(product.price)}</Text>
                {/* Bộ đếm số lượng */}
                <View style={styles.quantityStepper}>
                  <TouchableOpacity style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                  <Text style={styles.quantityText}>{product.quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          {/* Voucher của Shop (Giả lập) */}
          <View style={styles.voucherRow}>
            <Icon name="ticket-outline" size={16} color={colors.primary} />
            <Text style={styles.voucherText}>Giảm 15k phí vận chuyển</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    // SỬA LỖI SCROLL: Thêm style={{ flex: 1 }} cho SafeAreaView
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name = "arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({cartData.reduce((acc, s) => acc + s.items.length, 0)})</Text>
        <Text style={styles.headerEdit}>Sửa</Text>
      </View>

      {/* List Sản Phẩm */}
      <FlatList
        data={cartData}
        renderItem={renderShopGroup}
        keyExtractor={(item) => item.shopId}
        contentContainerStyle={{ paddingBottom: 100 }} // Chừa chỗ cho Footer
        style={{ flex: 1 }} // Quan trọng để cuộn được
        showsVerticalScrollIndicator={false}
      />

      {/* Footer Thanh Toán (Dính dưới đáy) */}
      <View style={styles.footer}>
        <View style={styles.row}>
          {/* Nút check "Tất cả" đổi thành nút Bỏ chọn */}
          <TouchableOpacity onPress={deselectAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
             {/* Nếu có món đang chọn thì hiện icon Remove, không thì hiện ô trống */}
            {getSelectedCount() > 0 ? (
                <Icon name="close-circle-outline" size={24} color={colors.primary} />
            ) : (
                <Icon name="square-outline" size={24} color="#999" />
            )}
            <Text style={styles.selectAllText}>
                {getSelectedCount() > 0 ? "Bỏ chọn" : "Tất cả"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalContainer}>
          <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.finalPrice}>{formatCurrency(getTotalPrice())}</Text>
          </View>
          
          <TouchableOpacity 
            // Disable nút mua nếu chưa chọn món
            style={[styles.buyButton, getSelectedCount() === 0 && styles.buyButtonDisabled]}
            disabled={getSelectedCount() === 0}
            onPress={() => {
                // Tìm Shop đang được chọn để lấy tên gửi sang Payment (nếu cần)
                const activeShop = cartData.find(s => s.items.some(i => i.checked));
                
                if (activeShop) {
                    (navigation as any).navigate('Payment' as never, { 
                        totalAmount: getTotalPrice(),
                        shopName: activeShop.shopName // Truyền thêm tên quán
                    });
                }
            }}
          >
            <Text style={styles.buyButtonText}>Mua hàng ({getSelectedCount()})</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Quan trọng: Chiếm toàn bộ màn hình để con cuộn được
    backgroundColor: '#F5F5F5',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 16,
  },
  headerEdit: {
    fontSize: 16,
    color: '#333',
  },

  // Checkbox
  checkBoxHitSlop: {
    padding: 4,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkBoxActive: {
    backgroundColor: colors.primary, // Dùng màu cam của app
    borderColor: colors.primary,
  },

  // Shop Block
  shopBlock: {
    backgroundColor: '#FFF',
    marginTop: 10,
    paddingBottom: 10,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  shopName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  editText: {
    color: '#666',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Product Item
  productItem: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 80,
    height: 80,
    marginHorizontal: 10,
    backgroundColor: '#EEE',
    borderRadius: 4,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80,
  },
  productName: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  variationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginTop: 4,
  },
  variationText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Stepper (Tăng giảm số lượng)
  quantityStepper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 2,
  },
  stepBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E8E8E8',
  },
  quantityText: {
    width: 30,
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 2,
    color: '#333'
  },

  // Voucher
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 30, 
  },
  voucherText: {
    color: colors.primary,
    fontSize: 12,
    marginLeft: 6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 10, 
  },
  selectAllText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#000',
    textAlign: 'right',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc', // Màu xám khi không chọn gì
  }
});