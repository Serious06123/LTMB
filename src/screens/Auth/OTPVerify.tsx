import React, {useRef, useState} from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Keyboard,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import PrimaryButton from '../../components/button/PrimaryButton';
import {colors} from '../../theme';

export default function OTPVerify() {
	const [digits, setDigits] = useState(['', '', '', '']);
	const inputs = [useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null), useRef<TextInput | null>(null)];
	const navigation = useNavigation();

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

	const handleVerify = () => {
		const code = digits.join('');
		if (code.length < 4) {
			Alert.alert('Lỗi', 'Vui lòng nhập đủ 4 chữ số.');
			return;
		}
		// TODO: xác minh code qua API
		Alert.alert('Thành công', `Mã bạn nhập: ${code}`);
		try {
			navigation.navigate('Login' as never);
		} catch (e) {
			navigation.goBack();
		}
	};

	const handleResend = () => {
		// TODO: gọi API gửi lại mã
		Alert.alert('Gửi lại', 'Mã xác thực đã được gửi lại.');
		// tạo lại ô nhập
		setDigits(['', '', '', '']);
		inputs[0].current?.focus();
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
						<TouchableOpacity onPress={handleResend}>
							<Text style={styles.linkWarn}>Gửi lại mã</Text>
						</TouchableOpacity>
					</View>

					<PrimaryButton title="Xác minh" onPress={handleVerify} />
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
});

