import React, { useState, useCallback, useEffect, memo } from 'react';
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
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../services/api";
import { useSignUp } from '../../hooks/useSignUp';
import { theme } from '../../styles/theme';

const InputField = memo(({ icon, placeholder, value, onChangeText, secureTextEntry, error, rightElement }) => (
    <View style={[styles.inputContainer, error && styles.inputError]}>
        <Ionicons name={icon} size={20} color={theme.colors.gray} />
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            placeholderTextColor={theme.colors.placeholder}
            autoCapitalize="none"
        />
        {rightElement}
    </View>
));

const SignUpScreen = ({ navigation }) => {
    const { register, loading, error } = useSignUp();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        authCode: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isIdAvailable, setIsIdAvailable] = useState(false);
    const [isAuthCodeSent, setIsAuthCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        let interval;
        if (isAuthCodeSent && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isAuthCodeSent, timer]);

    const validateEmail = useCallback((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validatePassword = useCallback((password) => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }, []);

    const checkUsername = async () => {
        if (!formData.username.trim()) {
            setErrors(prev => ({ ...prev, username: '아이디를 입력해주세요' }));
            return;
        }

        try {
            const response = await authAPI.checkUsername({
                username: formData.username.trim()
            });
            setIsIdAvailable(response.data.available);
            if (response.data.available) {
                Alert.alert('확인', '사용 가능한 아이디입니다.');
            } else {
                setErrors(prev => ({ ...prev, username: '이미 사용 중인 아이디입니다' }));
            }
        } catch (error) {
            Alert.alert('오류', '중복 확인 중 오류가 발생했습니다.');
        }
    };

    const sendAuthCode = async () => {
        if (!validateEmail(formData.email)) {
            setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
            return;
        }

        try {
            const response = await authAPI.sendAuthCode({
                email: formData.email.trim(),
                type: 'signup'
            });
            setIsAuthCodeSent(true);
            setTimer(180);
            Alert.alert('알림', '인증코드가 발송되었습니다.');
        } catch (error) {
            Alert.alert('오류', '인증코드 발송에 실패했습니다.');
        }
    };

    const verifyAuthCode = async () => {
        if (!formData.authCode) {
            setErrors(prev => ({ ...prev, authCode: '인증코드를 입력해주세요' }));
            return;
        }

        try {
            const response = await authAPI.verifyAuthCode({
                email: formData.email.trim(),
                code: formData.authCode.trim(),
                type: 'signup'
            });
            setIsEmailVerified(true);
            Alert.alert('확인', '이메일 인증이 완료되었습니다.');
        } catch (error) {
            Alert.alert('오류', '인증코드가 일치하지 않습니다.');
        }
    };

    const handleSignUp = async () => {
        const newErrors = {};

        if (!isIdAvailable) {
            newErrors.username = '아이디 중복 확인이 필요합니다';
        }
        if (!validatePassword(formData.password)) {
            newErrors.password = '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }
        if (!isEmailVerified) {
            newErrors.email = '이메일 인증이 필요합니다';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            const response = await authAPI.register({
                username: formData.username.trim(),
                password: formData.password,
                email: formData.email.trim()
            });

            Alert.alert('성공', '회원가입이 완료되었습니다.', [
                { text: '확인', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert('오류', '회원가입 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={styles.title}>회원가입</Text>

                {/* 아이디 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        placeholder="아이디"
                        value={formData.username}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, username: text }));
                            setIsIdAvailable(false);
                            setErrors(prev => ({ ...prev, username: '' }));
                        }}
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.checkButton,
                            isIdAvailable && styles.checkedButton,
                            loading && styles.buttonDisabled
                        ]}
                        onPress={checkUsername}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.checkButtonText}>중복확인</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                )}

                {/* 비밀번호 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="비밀번호"
                        value={formData.password}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, password: text }));
                            setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                    >
                        <Ionicons
                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                )}

                {/* 비밀번호 확인 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                        placeholder="비밀번호 재입력"
                        value={formData.confirmPassword}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, confirmPassword: text }));
                            setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                    >
                        <Ionicons
                            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}

                {/* 이메일 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="이메일"
                        value={formData.email}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, email: text }));
                            setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading && !isEmailVerified}
                    />
                    <TouchableOpacity
                        style={[
                            styles.checkButton,
                            isAuthCodeSent && styles.checkedButton,
                            loading && styles.buttonDisabled
                        ]}
                        onPress={sendAuthCode}
                        disabled={loading || isEmailVerified}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.checkButtonText}>
                                {isAuthCodeSent ? '재발송' : '인증코드'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
                {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                )}

                {/* 인증코드 입력 */}
                {isAuthCodeSent && (
                    <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.authCode && styles.inputError]}
                            placeholder="인증코드 입력"
                            value={formData.authCode}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, authCode: text }));
                                setErrors(prev => ({ ...prev, authCode: '' }));
                            }}
                            keyboardType="number-pad"
                            editable={!loading && !isEmailVerified}
                        />
                        {timer > 0 && (
                            <Text style={styles.timerText}>
                                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.checkButton,
                                isEmailVerified && styles.checkedButton,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={verifyAuthCode}
                            disabled={loading || isEmailVerified}
                        >
                            <Text style={styles.checkButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {errors.authCode && (
                    <Text style={styles.errorText}>{errors.authCode}</Text>
                )}

                {/* 회원가입 버튼 */}
                <TouchableOpacity
                    style={[
                        styles.signupButton,
                        (!isIdAvailable || !isEmailVerified || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleSignUp}
                    disabled={!isIdAvailable || !isEmailVerified || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.signupButtonText}>회원가입</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#000',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 56,
        backgroundColor: '#F8F9FA',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#212529',
    },
    inputError: {
        borderColor: '#DC3545',
    },
    checkButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    checkedButton: {
        backgroundColor: '#4CAF50',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    errorText: {
        color: '#DC3545',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 15,
    },
    signupButton: {
        backgroundColor: '#0066FF',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    timerText: {
        color: '#FF3B30',
        fontSize: 14,
        marginRight: 10,
    },
});

export default SignUpScreen;