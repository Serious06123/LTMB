import React, {useRef, useState} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Keyboard,
} from 'react-native';
import {useEffect} from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import PrimaryButton from '../../components/button/PrimaryButton';
import {colors} from '../../theme';
import { StackNavigationProp } from '@react-navigation/stack';


type RootStackParamList = {
  ChangePasswordAuth: { email: string };
};

export default function OTPVerify() {
	const [digits, setDigits] = useState(['', '', '', '']);
	const inputs = [useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null)];

	// Reset các ô OTP khi màn được focus
	useFocusEffect(
		React.useCallback(() => {
			setDigits(['', '', '', '']);
			inputs[0].current?.focus();
		}, [])
	);
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const [cooldown, setCooldown] = useState(60);

	useEffect(() => {
		if (cooldown > 0) {
			const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [cooldown]);

	const handleChange = (index: number, val: string) => {
		if (!/^[0-9]?$/.test(val)) return;
		const next = [...digits];
		next[index] = val;
		setDigits(next);
		if (val && index < inputs.length - 1) {
			inputs[index + 1].current?.focus();
		}
		if (!val && index > 0) {
			// nếu xóa thì quay lại ô trước
			inputs[index - 1].current?.focus();
		}
	};

	// Lấy email từ navigation params
	const route = require('@react-navigation/native').useRoute();
	const { email } = route.params;

	const handleVerify = async () => {
		const code = digits.join('');
		if (code.length < 4) {
			Alert.alert('Lỗi', 'Vui lòng nhập đủ 4 chữ số.');
			return;
		}
		try {
			const res = await fetch('http://10.0.2.2:4000/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp: code }),
			});
			const data = await res.json();
			if (data.success) {
				//Alert.alert('Thành công', 'Mã OTP hợp lệ!');
				navigation.navigate('ChangePasswordAuth', { email });
			} else {
				Alert.alert('Lỗi', data.error || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
			}
		} catch (e) {
			Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
		}
	};

	const handleResend = async () => {
		if (cooldown > 0) return;
		try {
			const res = await fetch('http://10.0.2.2:4000/api/auth/resend-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (data.success) {
				//Alert.alert('Thành công', 'Mã OTP đã được gửi lại.');
				setDigits(['', '', '', '']);
				inputs[0].current?.focus();
				setCooldown(60);
			} else {
				Alert.alert('Lỗi', data.error || 'Không thể gửi lại mã OTP.');
			}
		} catch (e) {
			Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
		}
	};

	return (
		<SafeAreaView style={styles.root}>
			<KeyboardAwareScrollView 
                contentContainerStyle={{flexGrow: 1}} 
                enableOnAndroid 
                extraScrollHeight={60}>
				<View style={styles.hero}>
					<Text style={styles.title}>Xác minh OTP</Text>
					<Text style={styles.subtitle}>Nhập mã 4 chữ số đã gửi tới email</Text>
				</View>

                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => { try { navigation.navigate('ForgotPassword' as never); } catch (e) { navigation.goBack(); } }}
                    ><Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>

				<View style={styles.card}>
					<View style={styles.otpRow}>
						{digits.map((d, i) => (
							<TextInput
								key={i}
								ref={inputs[i]}
								value={d}
								onChangeText={val => handleChange(i, val)}
								keyboardType="number-pad"
								maxLength={1}
								style={styles.otpBox}
								textAlign="center"
								returnKeyType={i === 3 ? 'done' : 'next'}
								onSubmitEditing={() => {
									if (i < 3) inputs[i + 1].current?.focus(); else Keyboard.dismiss();
								}}
							/>
						))}
					</View>
					<View style={styles.resendRow}>
						<Text style={styles.muted}>Chưa nhận được mã? </Text>
						<TouchableOpacity
							onPress={handleResend}
							disabled={cooldown > 0}
							style={cooldown > 0 ? { opacity: 0.5 } : {}}
						>
							<Text style={cooldown > 0 ? styles.resendDisabled : styles.linkWarn}>
								{cooldown > 0 ? `Gửi lại mã (${cooldown})` : 'Gửi lại mã'}
							</Text>
						</TouchableOpacity>
					</View>
					<PrimaryButton title="Xác minh" 
					onPress={handleVerify} 
					//onPress={ () => {navigation.navigate('ChangePasswordAuth' as never)}}
					/>
				</View>
			</KeyboardAwareScrollView>
		</SafeAreaView>
	);
}

const ORANGE = colors.primary;
const DARK = '#0f1222';

const styles = StyleSheet.create({
	root: {flex: 1, backgroundColor: DARK},
	hero: {
		backgroundColor: DARK,
		paddingTop: 24,
		paddingHorizontal: 24,
		paddingBottom: 60,
		marginTop: 100,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 110,
	},
	title: {color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center'},
	subtitle: {color: '#C9CFDA', fontSize: 15, textAlign: 'center', marginTop: 8},

	card: {
		flex: 1,
		backgroundColor: '#fff',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		paddingHorizontal: 20,
		paddingTop: 40,
		alignItems: 'stretch',
	},

	otpRow: {flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 20, alignSelf: 'center'},
	otpBox: {
		width: 60,
		height: 60,
		borderRadius: 8,
		backgroundColor: '#EEF2F7',
		fontSize: 22,
		color: '#111827',
		alignItems: 'center',
		justifyContent: 'center',
	},

	resendRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 18, alignSelf: 'center'},
	linkWarn: {color: ORANGE, fontWeight: '700'},
	muted: {color: '#9CA3AF'},

    backBtn: {
        position: 'absolute',
        left: 20,
        top: 40,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
    },
    backIcon: { fontSize: 22, color: DARK },
	resendDisabled: { color: '#aaa', fontWeight: '700' },
});

