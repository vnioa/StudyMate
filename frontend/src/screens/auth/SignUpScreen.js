import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../services/api";

const SignUpScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        birthdate: '',
        phoneNumber: '',
        email: '',
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        birthdate: '',
        phoneNumber: '',
        email: '',
        verificationCode: ''
    });

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username) {
            newErrors.username = '아이디를 입력해주세요';
        } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            newErrors.username = '영문과 숫자만 사용 가능합니다';
        }

        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(formData.password)) {
            newErrors.password = '영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        if (!formData.name) newErrors.name = '이름을 입력해주세요';
        if (!formData.birthdate) newErrors.birthdate = '생년월일을 입력해주세요';
        if (!formData.phoneNumber) newErrors.phoneNumber = '전화번호를 입력해주세요';

        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkUsername = async () => {
        if (!formData.username) {
            setErrors(prev => ({...prev, username: '아이디를 입력해주세요'}));
            return;
        }
        try {
            setLoading(true);
            const response = await authAPI.checkUsername(formData.username);
            if (response.data.available) {
                setIsUsernameValid(true);
                Alert.alert('알림', '사용 가능한 아이디입니다');
            }
        } catch (error) {
            Alert.alert('오류', '아이디 중복 확인에 실패했습니다');
            setErrors(prev => ({...prev, username: '아이디 중복 확인에 실패했습니다'}));
        } finally {
            setLoading(false);
        }
    };

    const requestVerificationCode = async () => {
        if (!formData.email) {
            setErrors(prev => ({...prev, email: '이메일을 입력해주세요'}));
            return;
        }
        try {
            setLoading(true);
            const response = await authAPI.sendAuthCode(formData.email);
            if (response.data.success) {
                setReceivedCode(response.data.code);
                Alert.alert('알림', '인증코드가 발송되었습니다');
            }
        } catch (error) {
            Alert.alert('오류', '인증코드 발송에 실패했습니다');
            setErrors(prev => ({...prev, email: '인증코드 발송에 실패했습니다'}));
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = () => {
        if (!verificationCode) {
            setErrors(prev => ({...prev, verificationCode: '인증코드를 입력해주세요'}));
            return;
        }
        if (verificationCode === receivedCode) {
            setIsEmailVerified(true);
            Alert.alert('알림', '이메일 인증이 완료되었습니다');
            setErrors(prev => ({...prev, verificationCode: ''}));
        } else {
            Alert.alert('오류', '인증코드가 일치하지 않습니다');
            setErrors(prev => ({...prev, verificationCode: '인증코드가 일치하지 않습니다'}));
        }
    };

    const handleSignup = async () => {
        if (!validateForm()) return;
        if (!isUsernameValid || !isEmailVerified) {
            Alert.alert('알림', '아이디 중복확인과 이메일 인증을 완료해주세요');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.register(formData);
            if (response.data.success) {
                Alert.alert('알림', '회원가입이 완료되었습니다');
                navigation.navigate('Login');
            }
        } catch (error) {
            Alert.alert('오류', '회원가입에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const PasswordMatchIndicator = ({isMatching}) => (
        <Ionicons
            name={isMatching ? "checkmark-circle" : "close-circle"}
            size={24}
            color={isMatching ? "#34C759" : "#FF3B30"}
            style={{marginLeft: 8}}
        />
    );

    const InputField = ({
        icon,
        placeholder,
        value,
        onChangeText,
        error,
        button,
        showPasswordMatch,
        passwordMatch,
        ...props
    }) => (
        <View style={styles.inputWrapper}>
            <View style={[
                styles.inputContainer,
                error && styles.inputError
            ]}>
                <Ionicons
                    name={icon}
                    size={24}
                    color="#555"
                    style={styles.iconStyle}
                />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    placeholderTextColor="#888"
                    {...props}
                />
                {button && (
                    <TouchableOpacity
                        onPress={button.onPress}
                        style={styles.verifyButton}
                        disabled={loading}
                    >
                        <Text style={styles.verifyButtonText}>{button.text}</Text>
                    </TouchableOpacity>
                )}
                {showPasswordMatch && value !== '' && (
                    <Ionicons
                        name={passwordMatch ? "checkmark-circle" : "close-circle"}
                        size={24}
                        color={passwordMatch ? "#34C759" : "#FF3B30"}
                        style={{marginLeft: 8}}
                    />
                )}
            </View>
            {error && <Text stle={styles.errorText}>{error}</Text>}
        </View>
    )


    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>회원가입</Text>

                    <View style={styles.formSection}>
                        <InputField
                            icon="person-outline"
                            placeholder="아이디"
                            value={formData.username}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, username: text}));
                                setErrors(prev => ({...prev, username: ''}));
                            }}
                            error={errors.username}
                            button={{
                                text: "중복확인",
                                onPress: checkUsername
                            }}
                        />

                        <InputField
                            icon="lock-closed-outline"
                            placeholder="비밀번호"
                            value={formData.password}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, password: text}));
                                setErrors(prev => ({...prev, password: ''}));
                            }}
                            error={errors.password}
                            secureTextEntry
                        />

                        <InputField
                            icon="lock-closed-outline"
                            placeholder="비밀번호 확인"
                            value={formData.confirmPassword}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, confirmPassword: text}));
                                setErrors(prev => ({...prev, confirmPassword: ''}));
                            }}
                            error={errors.confirmPassword}
                            secureTextEntry
                            showPasswordMatch={true}
                            passwordMatch={formData.password === formData.confirmPassword}
                        />
                        {formData.confirmPassword !== '' && (
                            <PasswordMatchIndicator
                                isMatching={formData.password === formData.confirmPassword}
                            />
                        )}

                        <InputField
                            icon="person-outline"
                            placeholder="이름"
                            value={formData.name}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, name: text}));
                                setErrors(prev => ({...prev, name: ''}));
                            }}
                            error={errors.name}
                        />

                        <InputField
                            icon="calendar-outline"
                            placeholder="생년월일 (YYYY-MM-DD)"
                            value={formData.birthdate}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, birthdate: text}));
                                setErrors(prev => ({...prev, birthdate: ''}));
                            }}
                            error={errors.birthdate}
                            keyboardType="numeric"
                        />

                        <InputField
                            icon="call-outline"
                            placeholder="전화번호"
                            value={formData.phoneNumber}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, phoneNumber: text}));
                                setErrors(prev => ({...prev, phoneNumber: ''}));
                            }}
                            error={errors.phoneNumber}
                            keyboardType="phone-pad"
                        />

                        <InputField
                            icon="mail-outline"
                            placeholder="이메일"
                            value={formData.email}
                            onChangeText={(text) => {
                                setFormData(prev => ({...prev, email: text}));
                                setErrors(prev => ({...prev, email: ''}));
                            }}
                            error={errors.email}
                            button={{
                                text: "인증코드 발송",
                                onPress: requestVerificationCode
                            }}
                            keyboardType="email-address"
                        />

                        <InputField
                            icon="key-outline"
                            placeholder="인증코드 입력"
                            value={verificationCode}
                            onChangeText={(text) => {
                                setVerificationCode(text);
                                setErrors(prev => ({...prev, verificationCode: ''}));
                            }}
                            error={errors.verificationCode}
                            button={{
                                text: "확인",
                                onPress: verifyCode
                            }}
                            keyboardType="numeric"
                        />
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
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
    }
});

export default SignUpScreen;