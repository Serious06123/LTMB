import React, { JSX } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { colors } from '../theme';
import AntDesign from 'react-native-vector-icons/AntDesign';

type Item = any;

type Props = {
  visible: boolean;
  title?: string;
  items: Item[];
  onClose: () => void;
  renderItem?: ({ item }: { item: Item }) => JSX.Element;
};

export default function SeeAllModal({
  visible,
  title = 'Items',
  items,
  onClose,
  renderItem,
}: Props) {
  const defaultRender = ({ item }: { item: Item }) => (
    <View style={styles.itemRow}>
      <View style={styles.imageWrap}>
        {item.image ? (
          typeof item.image === 'string' ? (
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={item.image}
              style={styles.itemImage}
              resizeMode="cover"
            />
          )
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.name || item.title}</Text>
        {item.details ? (
          <Text style={styles.itemSub}>{item.details}</Text>
        ) : null}
        {item.rating ? (
          <Text style={styles.itemMeta}>
            {item.rating} · {item.time || ''}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <AntDesign name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            showsVerticalScrollIndicator={false}
            keyExtractor={(it, idx) => it.id?.toString() || String(idx)}
            renderItem={renderItem || defaultRender}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#222', flex: 1 },
  closeBtn: { padding: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  imageWrap: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  itemImage: { width: '100%', height: '100%' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  itemSub: { fontSize: 13, color: '#8b8f99', marginTop: 4 },
  itemMeta: { fontSize: 12, color: colors.primary, marginTop: 6 },
  sep: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
});
