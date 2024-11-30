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
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import * as Google from 'expo-auth-session/providers/google';
import * as KakaoLogin from '@react-native-seoul/kakao-login';

// 소셜 로그인 이미지 import
import GoogleLogo from '../../../assets/google.png';
import KakaoLogo from '../../../assets/kakao.png';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation, route }) => {
    // 상태 관리
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

    // 폼 유효성 검사
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

    // 로그인 처리 개선
    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await authAPI.login({
                username: formData.username.trim(),
                password: formData.password
            });

            if (response.success) {
                await AsyncStorage.multiSet([
                    ['userToken', response.data.token],
                    ['refreshToken', response.data.refreshToken],
                    ['userData', JSON.stringify(response.data.user)]
                ]);

                // 자동 로그인 설정 저장
                await AsyncStorage.setItem('autoLogin', 'true');

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                });
            }
        } catch (error) {
            let errorMessage = '로그인에 실패했습니다.';

            switch (error.code) {
                case 'AUTH_INVALID_CREDENTIALS':
                    errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
                    break;
                case 'AUTH_ACCOUNT_LOCKED':
                    errorMessage = '계정이 잠겼습니다. 고객센터에 문의해주세요.';
                    break;
                case 'AUTH_REQUIRED_EMAIL_VERIFICATION':
                    errorMessage = '이메일 인증이 필요합니다.';
                    break;
                default:
                    errorMessage = error.message || '일시적인 오류가 발생했습니다.';
            }

            Alert.alert('로그인 실패', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 소셜 로그인 처리
    const handleSocialLogin = async (provider) => {
        try {
            setLoading(true);

            // 소셜 로그인 SDK 초기화
            const socialLoginConfig = {
                google: {
                    clientId: GOOGLE_CLIENT_ID,
                    scopes: ['profile', 'email']
                },
                kakao: {
                    appKey: KAKAO_APP_KEY
                }
            };

            // 소셜 로그인 실행
            const socialLoginResult = await initializeSocialLogin(provider, socialLoginConfig[provider]);

            if (socialLoginResult.success) {
                const response = await authAPI[`${provider}Login`]({
                    accessToken: socialLoginResult.accessToken,
                    userInfo: socialLoginResult.userInfo
                });

                if (response.success) {
                    await AsyncStorage.multiSet([
                        ['userToken', response.data.token],
                        ['refreshToken', response.data.refreshToken],
                        ['userData', JSON.stringify(response.data.user)],
                        ['loginProvider', provider]
                    ]);

                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }]
                    });
                }
            }
        } catch (error) {
            let errorMessage = '소셜 로그인에 실패했습니다.';

            switch (error.code) {
                case 'SOCIAL_AUTH_CANCELLED':
                    errorMessage = '로그인이 취소되었습니다.';
                    break;
                case 'SOCIAL_AUTH_FAILED':
                    errorMessage = '인증에 실패했습니다. 다시 시도해주세요.';
                    break;
                case 'SOCIAL_AUTH_EMAIL_EXISTS':
                    errorMessage = '이미 가입된 이메일입니다. 일반 로그인을 이용해주세요.';
                    break;
                default:
                    errorMessage = error.message || '일시적인 오류가 발생했습니다.';
            }

            Alert.alert('로그인 실패', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 자동 로그인 체크
    useEffect(() => {
        const checkAutoLogin = async () => {
            try {
                const [autoLogin, token, refreshToken] = await AsyncStorage.multiGet([
                    'autoLogin',
                    'userToken',
                    'refreshToken'
                ]);

                if (autoLogin[1] === 'true' && token[1] && refreshToken[1]) {
                    // 토큰 유효성 검증
                    const isValid = await authAPI.checkLoginStatus();
                    if (isValid.success) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }]
                        });
                    }
                }
            } catch (error) {
                console.log('자동 로그인 체크 실패:', error);
            }
        };

        checkAutoLogin();
    }, []);

    // 소셜 로그인 초기화 함수
    const initializeSocialLogin = async (provider, config) => {
        try {
            switch (provider) {
                case 'google':
                    const [request, response, promptAsync] = Google.useAuthRequest({
                        clientId: config.clientId,
                        scopes: config.scopes
                    });

                    if (response?.type === 'success') {
                        const { authentication } = response;
                        return {
                            success: true,
                            accessToken: authentication.accessToken,
                            userInfo: await fetchGoogleUserInfo(authentication.accessToken)
                        };
                    }
                    return { success: false };

                case 'kakao':
                    await KakaoLogin.login();
                    const profile = await KakaoLogin.getProfile();
                    return {
                        success: true,
                        accessToken: await KakaoLogin.getAccessToken(),
                        userInfo: {
                            id: profile.id,
                            email: profile.email,
                            name: profile.nickname,
                            profileImage: profile.profileImageUrl
                        }
                    };

                default:
                    throw new Error('지원하지 않는 소셜 로그인입니다.');
            }
        } catch (error) {
            console.error('소셜 로그인 초기화 실패:', error);
            throw {
                code: 'SOCIAL_AUTH_FAILED',
                message: '소셜 로그인 연동에 실패했습니다.'
            };
        }
    };

// Google 사용자 정보 조회
    const fetchGoogleUserInfo = async (accessToken) => {
        const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userInfo = await response.json();
        return {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            profileImage: userInfo.picture
        };
    };

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
                            <Image source={GoogleLogo} style={styles.socialLogo} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialLogin('kakao')}
                            disabled={loading}
                        >
                            <Image source={KakaoLogo} style={styles.socialLogo} />
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