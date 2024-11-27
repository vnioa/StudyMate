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
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleLogo from '../../../assets/google.png';
import KakaoLogo from '../../../assets/kakao.png';
import NaverLogo from '../../../assets/naver.jpg';
import { authAPI } from '../../services/api';

WebBrowser.maybeCompleteAuthSession();

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
            const response = await authAPI.login({
                username: formData.username.trim(),
                password: formData.password
            });

            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                });
            }
        } catch (error) {
            const errorMessage = error.response?.status === 401
                ? '아이디 또는 비밀번호가 일치하지 않습니다.'
                : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
            Alert.alert('로그인 실패', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (token) => {
        try {
            setLoading(true);
            const response = await authAPI.googleLogin({ token });

            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }]
                });
            }
        } catch (error) {
            Alert.alert('로그인 실패', 'Google 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <Text style={styles.title}>로그인</Text>

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

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => promptAsync()}
                        disabled={loading}
                    >
                        <Image source={GoogleLogo} style={styles.socialLogo} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        disabled={loading}
                    >
                        <Image source={KakaoLogo} style={styles.socialLogo} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        disabled={loading}
                    >
                        <Image source={NaverLogo} style={styles.socialLogo} />
                    </TouchableOpacity>
                </View>

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
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
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
        borderColor: '#FF3B30'
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 15
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
        opacity: 0.5
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
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
        color: '#666',
        fontSize: 14,
    }
});

export default LoginScreen;