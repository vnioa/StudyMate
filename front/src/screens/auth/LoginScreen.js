// LoginScreen.js

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
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from "expo-secure-store";
import api from '../../api/api';

const LoginScreen = ({ navigation, route }) => {
    const [formData, setFormData] = useState({
        username: route.params?.userId || '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    });

    // 애니메이션 값
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.95));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = '아이디를 입력해주세요';
        }
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await api.post('/api/auth/login', {
                userId: formData.username.trim(),
                password: formData.password
            });

            if (response.data.success) {
                // JWT 토큰 저장
                await SecureStore.setItemAsync('userToken', response.data.accessToken);

                // Refresh Token 저장
                if (response.data.refreshToken) {
                    await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
                }

                await Promise.all([
                    SecureStore.setItemAsync('userToken', response.data.accessToken),
                    response.data.refreshToken && SecureStore.setItemAsync('refreshToken', response.data.refreshToken),
                    SecureStore.setItemAsync('userData', JSON.stringify(response.data.user)),
                ]);

                // 모든 API 요청에 토큰 자동 포함되도록 설정
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

                navigation.navigate('MainTab');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            Alert.alert(
                '로그인 실패',
                error.response?.data?.message || '로그인에 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAutoLogin = async () => {
            try {
                const [autoLogin, token, refreshToken] = await Promise.all([
                    SecureStore.getItemAsync('autoLogin'),
                    SecureStore.getItemAsync('userToken'),
                    SecureStore.getItemAsync('refreshToken'),
                ]);

                if (autoLogin === 'true' && token) {
                    const response = await api.get('/api/auth/status', {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.data.success) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTab' }],
                        });
                    } else if (refreshToken) {
                        // Access Token 만료 시 Refresh Token으로 갱신
                        const refreshResponse = await api.post('/api/auth/refresh', { refreshToken });
                        if (refreshResponse.data.success) {
                            await SecureStore.setItemAsync('userToken', refreshResponse.data.accessToken);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'MainTab' }],
                            });
                        }
                    }
                }
            } catch (error) {
                console.log('자동 로그인 체크 실패:', error);
            }
        };
        checkAutoLogin();
    }, []);


    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <Animated.View style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <Text style={styles.title}>로그인</Text>

                    {/* 아이디 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.username && styles.inputError]}
                            placeholder="아이디를 입력하세요"
                            value={formData.username}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, username: text }));
                                setErrors(prev => ({ ...prev, username: '' }));
                            }}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>
                    {errors.username && (
                        <Text style={styles.errorText}>{errors.username}</Text>
                    )}

                    {/* 비밀번호 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" />
                        <TextInput
                            style={[styles.input, errors.password && styles.inputError]}
                            placeholder="비밀번호를 입력하세요"
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

                    {/* 로그인 버튼 */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>로그인</Text>
                        )}
                    </TouchableOpacity>

                    {/* 소셜 로그인 버튼 */}
                    <View style={styles.socialContainer}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialLogin('google')}
                            disabled={loading}
                        >
                            <Image source={require('../../../assets/naver.jpg')} style={styles.socialLogo} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialLogin('kakao')}
                            disabled={loading}
                        >
                            <Image source={require('../../../assets/kakao.png')} style={styles.socialLogo} />
                        </TouchableOpacity>
                    </View>

                    {/* 하단 링크 */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('SignUp')}
                            disabled={loading}
                        >
                            <Text style={styles.bottomText}>회원가입</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FindAccount')}
                            disabled={loading}
                        >
                            <Text style={styles.bottomText}>아이디/비밀번호 찾기</Text>
                        </TouchableOpacity>
                    </View>
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
    formContainer: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
        justifyContent: 'center',
    },
    contentContainer: {
        width: '100%',
    },
    title: {
        fontSize: 35,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 70,
        color: '#1A1A1A',
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
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 15,
    },
    loginButton: {
        backgroundColor: '#1A73E8',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        gap: 20,
    },
    socialButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialLogo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    bottomText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoginScreen;