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
import Icon from 'react-native-vector-icons/AntDesign'; 
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
        image: IMAGES.pizza1,
        quantity: 1,
        checked: false,
      },
      {
        id: 'p2',
        name: 'Mỳ Ý Sốt Bò Bằm (Bolognese)',
        variation: 'Không cay',
        price: 89000,
        image: IMAGES.pizza2,
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
        image: IMAGES.burger1,
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
];

// --- COMPONENT CHECKBOX ---
const CheckBox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.checkBoxHitSlop}>
    <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
      {/* THAY ĐỔI: Icon 'check' */}
      {checked && <Icon name="check" size={12} color="#FFF" />}
    </View>
  </TouchableOpacity>
);

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartData, setCartData] = useState<ShopGroup[]>(DUMMY_CART);

  // --- LOGIC XỬ LÝ (GIỮ NGUYÊN) ---
  const toggleShop = (shopId: string) => {
    const newData = cartData.map(shop => {
      if (shop.shopId === shopId) {
        const newChecked = !shop.checked;
        return {
          ...shop,
          checked: newChecked,
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
      if (shop.shopId === shopId) {
        const newItems = shop.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        const allChecked = newItems.length > 0 && newItems.every(item => item.checked);
        return { ...shop, items: newItems, checked: allChecked };
      }
      return {
        ...shop,
        checked: false,
        items: shop.items.map(item => ({ ...item, checked: false })),
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
      <View style={styles.shopHeader}>
        <View style={styles.row}>
          <CheckBox checked={shop.checked} onPress={() => toggleShop(shop.shopId)} />
          {/* THAY ĐỔI: Icon 'shop' */}
          <Icon name="car" size={18} color="#333" style={{ marginLeft: 8, marginRight: 4 }} />
          <Text style={styles.shopName}>{shop.shopName}</Text>
          {/* THAY ĐỔI: Icon 'right' */}
          <Icon name="right" size={14} color="#999" />
        </View>
        <Text style={styles.editText}>Sửa</Text>
      </View>

      {shop.items.map((product) => (
        <View key={product.id} style={styles.productItem}>
          <View style={styles.productRow}>
            <CheckBox checked={product.checked} onPress={() => toggleItem(shop.shopId, product.id)} />
            
            <Image source={product.image} style={styles.productImage} />
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.variationTag}>
                <Text style={styles.variationText}>{product.variation}</Text>
                {/* THAY ĐỔI: Icon 'down' */}
                <Icon name="down" size={10} color="#666" />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatCurrency(product.price)}</Text>
                <View style={styles.quantityStepper}>
                  <TouchableOpacity style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                  <Text style={styles.quantityText}>{product.quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.voucherRow}>
            {/* THAY ĐỔI: Icon 'tags' */}
            <Icon name="tags" size={16} color={colors.primary} />
            <Text style={styles.voucherText}>Giảm 15k phí vận chuyển</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          {/* THAY ĐỔI: Icon 'arrowleft' */}
          <Icon name="arrowleft" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({cartData.reduce((acc, s) => acc + s.items.length, 0)})</Text>
        <Text style={styles.headerEdit}>Sửa</Text>
      </View>

      <FlatList
        data={cartData}
        renderItem={renderShopGroup}
        keyExtractor={(item) => item.shopId}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.row}>
          <TouchableOpacity onPress={deselectAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* THAY ĐỔI: Icon 'closecircleo' và 'checksquareo' */}
            {getSelectedCount() > 0 ? (
                <Icon name="closecircleo" size={20} color={colors.primary} />
            ) : (
                <Icon name="checksquareo" size={20} color="#999" />
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
            style={[styles.buyButton, getSelectedCount() === 0 && styles.buyButtonDisabled]}
            disabled={getSelectedCount() === 0}
            onPress={() => {
                const activeShop = cartData.find(s => s.items.some(i => i.checked));
                if (activeShop) {
                    (navigation as any).navigate('Payment' as never, { 
                        totalAmount: getTotalPrice(),
                        shopName: activeShop.shopName
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
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
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
    backgroundColor: '#ccc',
  }
});