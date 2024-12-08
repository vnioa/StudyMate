// ResetPasswordScreen.js

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
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from "../../services/api";
import axios from 'axios';

const BASE_URL = 'http://121.127.165.43:3000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const ResetPasswordScreen = ({ route, navigation }) => {
    const { email, userId, sessionId } = route.params;
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        password: '',
        confirmPassword: ''
    });

    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (formData.password.length < 8) {
            newErrors.password = '비밀번호는 8자 이상이어야 합니다';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = '대문자를 포함해야 합니다';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = '숫자를 포함해야 합니다';
        } else if (!/[!@#$%^&*]/.test(formData.password)) {
            newErrors.password = '특수문자를 포함해야 합니다';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호를 다시 입력해주세요';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await api.post('/api/auth/reset-password', {
                email: email.trim(),
                userId: userId.trim(),
                newPassword: formData.password,
                sessionId: sessionId
            });

            if (response.data.success) {
                Alert.alert(
                    '성공',
                    '비밀번호가 재설정되었습니다.\n새로운 비밀번호로 로그인해주세요.',
                    [{
                        text: '확인',
                        onPress: () => {
                            navigation.navigate('Login', { userId });
                        }
                    }]
                );
            }
        } catch (error) {
            let errorMessage = '비밀번호 재설정에 실패했습니다.';

            if (error.response) {
                switch (error.response.data?.code) {
                    case 'SESSION_EXPIRED':
                        errorMessage = '인증 세션이 만료되었습니다. 다시 시도해주세요.';
                        navigation.navigate('FindAccount');
                        break;
                    case 'INVALID_PASSWORD':
                        errorMessage = '비밀번호 형식이 올바르지 않습니다.';
                        break;
                    case 'USER_NOT_FOUND':
                        errorMessage = '사용자를 찾을 수 없습니다.';
                        navigation.navigate('FindAccount');
                        break;
                    default:
                        errorMessage = error.response.data?.message || '일시적인 오류가 발생했습니다.';
                }
            }

            Alert.alert('오류', errorMessage);
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
                <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                        >
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.title}>비밀번호 재설정</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <Text style={styles.description}>
                        새로운 비밀번호를 입력해주세요.{'\n'}
                        영문 대소문자, 숫자, 특수문자를 포함하여 8자 이상
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="새 비밀번호"
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

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.confirmPassword && styles.inputError]}
                            placeholder="새 비밀번호 확인"
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

                    <TouchableOpacity
                        style={[styles.resetButton, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>비밀번호 변경</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: 15,
    },
    resetButton: {
        backgroundColor: '#0066FF',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ResetPasswordScreen;