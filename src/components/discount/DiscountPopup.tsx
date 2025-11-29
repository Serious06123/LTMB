import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { colors } from '../../theme';

interface DiscountPopupProps {
  onClose: () => void;
}

const DiscountPopup: React.FC<DiscountPopupProps> = ({ onClose }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#FFEB34', '#E76F00']} style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hurry Offers!</Text>
        <Text style={styles.coupon}>#1243CD2</Text>
        <Text style={styles.description}>Use the coupon get 25% discount</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>GOT IT</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popup: {
    width: '70%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#FFE194',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
  },
  closeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    marginTop: 40,
  },
  coupon: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  button: {
    width: '80%',
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffffff',
  },
});

export default DiscountPopup;
