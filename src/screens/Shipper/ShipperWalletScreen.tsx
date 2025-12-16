// src/screens/Shipper/ShipperWalletScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';


const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      name
      walletBalance
    }
  }
`;

interface UserProfile {
  id: string;
  name: string;
  walletBalance: number;
}

interface UserProfileQueryResult {
  me: UserProfile;
}

export default function ShipperWalletScreen() {
  const { data, loading, error } = useQuery<UserProfileQueryResult>(GET_USER_PROFILE, { fetchPolicy: 'network-only' });
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ví Shipper</Text>
      <Text style={styles.balance}>
        Số dư: {data?.me?.walletBalance?.toLocaleString('vi-VN')}đ
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  balance: { fontSize: 24, color: colors.primary, fontWeight: 'bold' },
});