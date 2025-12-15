// src/screens/Shipper/ShipperWalletScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export default function ShipperWalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ví Shipper</Text>
      <Text style={styles.balance}>Số dư: 2.500.000đ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  balance: { fontSize: 24, color: colors.primary, fontWeight: 'bold' },
});