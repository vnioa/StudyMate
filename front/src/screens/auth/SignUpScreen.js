import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const SignUpScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        authCode: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [isIdAvailable, setIsIdAvailable] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isAuthCodeSent, setIsAuthCodeSent] = useState(false);

    // 아이디 중복 확인
    const checkUsername = async () => {
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/check-username', {
                username: formData.username
            });
            if (response.data.available) {
                setIsIdAvailable(true);
                Alert.alert('확인', '사용 가능한 아이디입니다.');
            } else {
                Alert.alert('알림', '이미 사용 중인 아이디입니다.');
            }
        } catch (error) {
            Alert.alert('오류', '중복 확인 중 오류가 발생했습니다.');
        }
    };

    // 비밀번호 일치 확인
    const checkPasswordMatch = (confirmPwd) => {
        setFormData(prev => ({ ...prev, confirmPassword: confirmPwd }));
        setPasswordMatch(formData.password === confirmPwd);
    };

    // 이메일 인증코드 발송
    const sendAuthCode = async () => {
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/send-auth-code', {
                email: formData.email
            });
            if (response.data.success) {
                setIsAuthCodeSent(true);
                Alert.alert('알림', '인증코드가 발송되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '인증코드 발송에 실패했습니다.');
        }
    };

    // 인증코드 확인
    const verifyAuthCode = async () => {
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/verify-auth-code', {
                email: formData.email,
                code: formData.authCode
            });
            if (response.data.success) {
                setIsEmailVerified(true);
                Alert.alert('확인', '이메일 인증이 완료되었습니다.');
            } else {
                Alert.alert('알림', '인증코드가 일치하지 않습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '인증 확인 중 오류가 발생했습니다.');
        }
    };

    // 회원가입 처리
    const handleSignUp = async () => {
        if (!isIdAvailable) {
            Alert.alert('알림', '아이디 중복 확인이 필요합니다.');
            return;
        }
        if (!passwordMatch) {
            Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!isEmailVerified) {
            Alert.alert('알림', '이메일 인증이 필요합니다.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/signup', formData);
            if (response.data.success) {
                Alert.alert('성공', '회원가입이 완료되었습니다.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', '회원가입 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>회원가입</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={formData.username}
                    onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, username: text }));
                        setIsIdAvailable(false);
                    }}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={[styles.checkButton, isIdAvailable && styles.checkedButton]}
                    onPress={checkUsername}
                >
                    <Text style={styles.checkButtonText}>중복확인</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호 재입력"
                    value={formData.confirmPassword}
                    onChangeText={checkPasswordMatch}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#666"
                    />
                </TouchableOpacity>
                {formData.confirmPassword !== '' && (
                    <Ionicons
                        name={passwordMatch ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={passwordMatch ? "#4CAF50" : "#FF0000"}
                        style={styles.validationIcon}
                    />
                )}
            </View>
            {!passwordMatch && formData.confirmPassword !== '' && (
                <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
            )}

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="이메일"
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TouchableOpacity
                    style={[styles.checkButton, isAuthCodeSent && styles.checkedButton]}
                    onPress={sendAuthCode}
                >
                    <Text style={styles.checkButtonText}>인증코드 발송</Text>
                </TouchableOpacity>
            </View>

            {isAuthCodeSent && (
                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="인증코드 입력"
                        value={formData.authCode}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, authCode: text }))}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity
                        style={[styles.checkButton, isEmailVerified && styles.checkedButton]}
                        onPress={verifyAuthCode}
                    >
                        <Text style={styles.checkButtonText}>확인</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                style={[styles.signupButton,
                    (!isIdAvailable || !passwordMatch || !isEmailVerified) && styles.disabledButton
                ]}
                onPress={handleSignUp}
                disabled={!isIdAvailable || !passwordMatch || !isEmailVerified}
            >
                <Text style={styles.signupButtonText}>회원가입</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#0066FF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    checkButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    checkedButton: {
        backgroundColor: '#4CAF50',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    errorText: {
        color: '#ff0000',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: 15,
    },
    signupButton: {
        backgroundColor: '#0066FF',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    validationIcon: {
        marginLeft: 10,
    }
});

export default SignUpScreen;