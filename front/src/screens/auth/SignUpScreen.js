// SignUpScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../services/api";

const SignUpScreen = ({ navigation }) => {
    // 상태 관리
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        birthdate: '',
        phoneNumber: '',
        email: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 애니메이션 값
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!formData.username) {
            newErrors.username = '아이디를 입력해주세요';
        } else if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.username)) {
            newErrors.username = '영문과 숫자 4-20자로 입력해주세요';
        }

        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(formData.password)) {
            newErrors.password = '영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        if (!formData.name || !/^[가-힣]{2,10}$/.test(formData.name)) {
            newErrors.name = '이름을 올바르게 입력해주세요 (2-10자 한글)';
        }

        if (!formData.birthdate || !/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(formData.birthdate)) {
            newErrors.birthdate = '생년월일을 YYYY-MM-DD 형식으로 입력해주세요';
        }

        if (!formData.phoneNumber || !/^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다';
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 전화번호 포맷팅
    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{0,4})(\d{0,4})$/);
        if (match) {
            return match[1] + (match[2] ? '-' + match[2] : '') + (match[3] ? '-' + match[3] : '');
        }
        return text;
    };

    // 생년월일 포맷팅
    const formatBirthdate = (text) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,4})(\d{0,2})(\d{0,2})$/);
        if (match) {
            return match[1] + (match[2] ? '-' + match[2] : '') + (match[3] ? '-' + match[3] : '');
        }
        return text;
    };

    // 아이디 중복 확인
    const checkUsername = async () => {
        if (!formData.username) {
            setErrors(prev => ({...prev, username: '아이디를 입력해주세요'}));
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.checkUsername(formData.username);

            if (response.available) {
                setIsUsernameValid(true);
                Alert.alert('사용 가능', '사용 가능한 아이디입니다');
            } else {
                setErrors(prev => ({...prev, username: '이미 사용 중인 아이디입니다'}));
            }
        } catch (error) {
            Alert.alert('오류', error.message || '아이디 중복 확인에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    // 이메일 인증코드 요청
    const requestVerificationCode = async () => {
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setErrors(prev => ({...prev, email: '올바른 이메일을 입력해주세요'}));
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.sendAuthCode(formData.email);
            setReceivedCode(response.code);
            Alert.alert('전송 완료', '인증코드가 발송되었습니다');
        } catch (error) {
            Alert.alert('오류', error.message || '인증코드 발송에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    // 인증코드 확인
    const verifyCode = () => {
        if (!verificationCode) {
            setErrors(prev => ({...prev, verificationCode: '인증코드를 입력해주세요'}));
            return;
        }

        if (verificationCode === receivedCode) {
            setIsEmailVerified(true);
            Alert.alert('인증 완료', '이메일 인증이 완료되었습니다');
            setErrors(prev => ({...prev, verificationCode: ''}));
        } else {
            setErrors(prev => ({...prev, verificationCode: '인증코드가 일치하지 않습니다'}));
        }
    };

    // 회원가입 처리
    const handleSignup = async () => {
        if (!validateForm()) return;
        if (!isUsernameValid) {
            Alert.alert('알림', '아이디 중복확인을 완료해주세요');
            return;
        }
        if (!isEmailVerified) {
            Alert.alert('알림', '이메일 인증을 완료해주세요');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.register({
                ...formData,
                phoneNumber: formData.phoneNumber.replace(/-/g, '')
            });

            if (response.success) {
                Alert.alert(
                    '가입 완료',
                    '회원가입이 완료되었습니다',
                    [{
                        text: '확인',
                        onPress: () => navigation.navigate('Login', { username: formData.username })
                    }]
                );
            }
        } catch (error) {
            Alert.alert('오류', error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Text style={styles.title}>회원가입</Text>

                        <View style={styles.formSection}>
                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="아이디 (영문, 숫자 4-20자)"
                                        value={formData.username}
                                        onChangeText={(text) => {
                                            setFormData(prev => ({...prev, username: text}));
                                            setErrors(prev => ({...prev, username: ''}));
                                            setIsUsernameValid(false);
                                        }}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.verifyButton}
                                        onPress={checkUsername}
                                        disabled={loading}
                                    >
                                        <Text style={styles.verifyButtonText}>중복확인</Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="비밀번호 (영문, 숫자, 특수문자 포함 8자 이상)"
                                        value={formData.password}
                                        onChangeText={(text) => {
                                            setFormData(prev => ({...prev, password: text}));
                                            setErrors(prev => ({...prev, password: ''}));
                                        }}
                                        secureTextEntry
                                    />
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="비밀번호 확인"
                                        value={formData.confirmPassword}
                                        onChangeText={(text) => {
                                            setFormData(prev => ({...prev, confirmPassword: text}));
                                            setErrors(prev => ({...prev, confirmPassword: ''}));
                                        }}
                                        secureTextEntry
                                    />
                                    {formData.confirmPassword && (
                                        <Ionicons
                                            name={formData.password === formData.confirmPassword ? "checkmark-circle" : "close-circle"}
                                            size={24}
                                            color={formData.password === formData.confirmPassword ? "#34C759" : "#FF3B30"}
                                            style={styles.passwordMatchIcon}
                                        />
                                    )}
                                </View>
                                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="이름 (2-10자 한글)"
                                        value={formData.name}
                                        onChangeText={(text) => {
                                            setFormData(prev => ({...prev, name: text}));
                                            setErrors(prev => ({...prev, name: ''}));
                                        }}
                                    />
                                </View>
                                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.birthdate && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="생년월일 (YYYY-MM-DD)"
                                        value={formData.birthdate}
                                        onChangeText={(text) => {
                                            const formatted = formatBirthdate(text);
                                            setFormData(prev => ({...prev, birthdate: formatted}));
                                            setErrors(prev => ({...prev, birthdate: ''}));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                                {errors.birthdate && <Text style={styles.errorText}>{errors.birthdate}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.phoneNumber && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="전화번호"
                                        value={formData.phoneNumber}
                                        onChangeText={(text) => {
                                            const formatted = formatPhoneNumber(text);
                                            setFormData(prev => ({...prev, phoneNumber: formatted}));
                                            setErrors(prev => ({...prev, phoneNumber: ''}));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={13}
                                    />
                                </View>
                                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="이메일"
                                        value={formData.email}
                                        onChangeText={(text) => {
                                            setFormData(prev => ({...prev, email: text}));
                                            setErrors(prev => ({...prev, email: ''}));
                                            setIsEmailVerified(false);
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.verifyButton}
                                        onPress={requestVerificationCode}
                                        disabled={loading}
                                    >
                                        <Text style={styles.verifyButtonText}>인증코드 발송</Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.verificationCode && styles.inputError]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="인증코드 입력"
                                        value={verificationCode}
                                        onChangeText={(text) => {
                                            setVerificationCode(text);
                                            setErrors(prev => ({...prev, verificationCode: ''}));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={6}
                                    />
                                    <TouchableOpacity
                                        style={styles.verifyButton}
                                        onPress={verifyCode}
                                        disabled={loading}
                                    >
                                        <Text style={styles.verifyButtonText}>확인</Text>
                                    </TouchableOpacity>
                                </View>
                                {errors.verificationCode && <Text style={styles.errorText}>{errors.verificationCode}</Text>}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.signupButtonText}>가입하기</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        marginTop: Platform.OS === 'android' ? 20 : 0,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 32,
        marginTop: 20,
        textAlign: 'center',
    },
    formSection: {
        gap: 16,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    iconStyle: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 16,
    },
    verifyButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    signupButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    passwordMatchIcon: {
        marginLeft: 8
    }
});

export default SignUpScreen;