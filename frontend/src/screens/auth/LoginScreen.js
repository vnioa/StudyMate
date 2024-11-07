import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Animated, Easing, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { WebView } from 'react-native-webview';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const fadeAnim = new Animated.Value(0);

    // Google OAuth 관련 상태 및 핸들러 설정
    const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
        clientId: '659041967960-r5s4j788pqtrbhrg2c2ll8kkq8j6a64l.apps.googleusercontent.com',
    });

    // 애니메이션 효과 적용
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    // 앱이 시작될 때 로그인 상태 확인
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const response = await axios.post('http://121.127.165.43:3000/api/users/validate-token', { token });
                    if (response.data.success) {
                        navigation.navigate('HomeScreen');
                    } else {
                        await AsyncStorage.removeItem('userToken');
                    }
                } catch (error) {
                    console.error('토큰 검증 오류:', error);
                }
            }
        };
        checkLoginStatus();
    }, []);

    // 로그인 함수
    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/login', {
                username,
                password,
            });

            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                Alert.alert('로그인에 성공했습니다.');
                navigation.navigate('HomeScreen');
            } else {
                Alert.alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
            }
        } catch (error) {
            Alert.alert('로그인 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // Google 소셜 로그인 처리
    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const { id_token } = googleResponse.params;
            axios.post('http://121.127.165.43:3000/api/users/login/google', { token: id_token })
                .then(async (res) => {
                    await AsyncStorage.setItem('userToken', res.data.token);
                    navigation.navigate('HomeScreen');
                })
                .catch(err => console.error('Google 로그인 실패:', err));
        }
    }, [googleResponse]);

    // Naver/Kakao WebView에서 OAuth 처리
    const handleNaverLogin = () => (
        <WebView
            source={{ uri: 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=<YOUR_NAVER_CLIENT_ID>&redirect_uri=<YOUR_REDIRECT_URI>&state=<RANDOM_STATE>' }}
            onNavigationStateChange={(event) => {
                if (event.url.includes('code=')) {
                    const code = event.url.split('code=')[1].split('&')[0];
                    axios.post('http://121.127.165.43:3000/api/users/login/naver', { code })
                        .then(async (res) => {
                            await AsyncStorage.setItem('userToken', res.data.token);
                            navigation.navigate('HomeScreen');
                        })
                        .catch(err => console.error('Naver 로그인 실패:', err));
                }
            }}
        />
    );

    const handleKakaoLogin = () => (
        <WebView
            source={{ uri: 'https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=<YOUR_KAKAO_CLIENT_ID>&redirect_uri=<YOUR_REDIRECT_URI>' }}
            onNavigationStateChange={(event) => {
                if (event.url.includes('code=')) {
                    const code = event.url.split('code=')[1].split('&')[0];
                    axios.post('http://121.127.165.43:3000/auth/kakao', { code })
                        .then(async (res) => {
                            await AsyncStorage.setItem('userToken', res.data.token);
                            navigation.navigate('HomeScreen');
                        })
                        .catch(err => console.error('Kakao 로그인 실패:', err));
                }
            }}
        />
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>로그인</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="아이디를 입력하세요"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={isPasswordVisible ? 'eye-off' : 'eye'}
                                size={20}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                        <Text style={styles.loginButtonText}>로그인</Text>
                    </TouchableOpacity>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
                            <Text style={styles.linkText}>회원가입</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FindIdPasswordScreen')}>
                            <Text style={styles.linkText}>아이디/비밀번호 찾기</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA', // 부드럽고 깔끔한 배경색 적용
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 30,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        paddingHorizontal: 10,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
    },
    loginButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '80%',
    },
    linkText: {
        color: '#0057D9',
        fontWeight: 'bold',
        fontSize: 14,
        padding: 5,
    },
});

export default LoginScreen;
