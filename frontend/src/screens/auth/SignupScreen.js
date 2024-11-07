import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Animated, Easing } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(false);
    const fadeAnim = new Animated.Value(0);

    // 페이드 인 애니메이션 적용
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const validateUsername = (value) => {
        const regex = /^[a-zA-Z0-9]+$/;
        setUsername(value);
        setIsUsernameValid(regex.test(value));
    };

    const validatePassword = (value) => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        setPassword(value);
    };

    const checkPasswordMatch = (value) => {
        setConfirmPassword(value);
        setPasswordMatch(password === value);
    };

    const checkUsername = async () => {
        if (!isUsernameValid) {
            Alert.alert('아이디는 영문과 숫자로만 구성되어야 합니다.');
            return;
        }
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/check-username', { username });
            if (response.data.available) {
                setIsUsernameValid(true);
                Alert.alert('사용 가능한 아이디입니다.');
            } else {
                setIsUsernameValid(false);
                Alert.alert('이미 사용 중인 아이디입니다.');
            }
        } catch (error) {
            console.error('아이디 중복 확인 오류:', error.response ? error.response.data : error.message); // 오류 로그 추가
            Alert.alert('아이디 중복 확인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const requestVerificationCode = async () => {
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/send-verification-code', { email });
            if (response.data.success) {
                setReceivedCode(response.data.code);
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('이메일 인증 요청에 실패했습니다.');
            }
        } catch (error) {
            console.error('이메일 인증 요청 오류:', error.response ? error.response.data : error.message); // 오류 로그 추가
            Alert.alert('이메일 인증 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const verifyCode = () => {
        if (verificationCode === receivedCode) {
            setIsEmailVerified(true);
            Alert.alert('이메일 인증이 완료되었습니다.');
        } else {
            Alert.alert('인증 코드가 일치하지 않습니다.');
        }
    };

    const handleSignup = async () => {
        if (!isUsernameValid || !isEmailVerified) {
            Alert.alert('모든 검증 절차를 완료해주세요.');
            return;
        }

        if (!passwordMatch) {
            Alert.alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password)) {
            Alert.alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/register', {
                username,
                password,
                name,
                birthdate,
                phoneNumber,
                email,
            });

            if (response.data.success) {
                Alert.alert('회원가입이 완료되었습니다.');
                navigation.navigate('IntroScreen');
            } else {
                Alert.alert('회원가입에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('회원가입 오류:', error.response ? error.response.data : error.message); // 오류 로그 추가
            Alert.alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.avoidingView}
                keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                        <Text style={styles.title}>회원가입</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="아이디"
                                value={username}
                                onChangeText={validateUsername}
                                autoCapitalize="none"
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity onPress={checkUsername} style={styles.checkButton}>
                                <Text style={styles.checkButtonText}>중복 확인</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호"
                                value={password}
                                onChangeText={validatePassword}
                                secureTextEntry
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호 재입력"
                                value={confirmPassword}
                                onChangeText={checkPasswordMatch}
                                secureTextEntry
                                placeholderTextColor="#888"
                            />
                            <Ionicons
                                name={passwordMatch ? 'checkmark-circle' : 'close-circle'}
                                size={20}
                                color={passwordMatch ? '#4CAF50' : '#F44336'}
                                style={styles.validationIcon}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="이름"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="calendar-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="생년월일 (YYYY-MM-DD)"
                                value={birthdate}
                                onChangeText={setBirthdate}
                                keyboardType="numeric" // 키패드 설정
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="전화번호"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="numeric" // 키패드 설정
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="이메일"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address" // 이메일 키보드 설정
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity onPress={requestVerificationCode} style={styles.checkButton}>
                                <Text style={styles.checkButtonText}>인증코드 발송</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer}>
                            <Ionicons name="key-outline" size={24} color="#0057D9" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="인증코드 입력"
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="numeric" // 키패드 설정
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity onPress={verifyCode} style={styles.checkButton}>
                                <Text style={styles.checkButtonText}>코드 확인</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={handleSignup} style={styles.signupButton}>
                            <Text style={styles.signupButtonText}>회원가입</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    avoidingView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    innerContainer: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        paddingHorizontal: 15,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#333',
    },
    checkButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    checkButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    validationIcon: {
        marginLeft: 10,
    },
    signupButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    signupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default SignupScreen;
