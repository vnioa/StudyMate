import React, { useState, useEffect } from 'react';
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
import * as Google from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import GoogleLogo from '../../../assets/google.png';
import KakaoLogo from '../../../assets/kakao.png';
import NaverLogo from '../../../assets/naver.PNG';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: 'YOUR_EXPO_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            handleGoogleLogin(response.authentication.accessToken);
        }
    }, [response]);

    const handleLogin = async () => {
        try {
            if (!username || !password) {
                Alert.alert('알림', '아이디와 비밀번호를 입력해주세요.');
                return;
            }

            const response = await axios.post('http://121.127.165.43:3000/api/users/login', {
                username,
                password,
            });

            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                navigation.navigate('Home');
            }
        } catch (error) {
            Alert.alert('로그인 실패', '아이디 또는 비밀번호를 확인해주세요.');
        }
    };

    const handleGoogleLogin = async (token) => {
        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/login/google', {
                token,
            });

            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                navigation.navigate('Home');
            }
        } catch (error) {
            Alert.alert('로그인 실패', 'Google 로그인에 실패했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>로그인</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="아이디를 입력하세요"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChangeText={setPassword}
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

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>로그인</Text>
                </TouchableOpacity>

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => promptAsync()}
                    >
                        <Image
                            source={GoogleLogo}
                            style={styles.socialLogo}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image
                            source={KakaoLogo}
                            style={styles.socialLogo}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                        <Image
                            source={NaverLogo}
                            style={styles.socialLogo}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.bottomText}>회원가입</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('FindAccount')}>
                        <Text style={styles.bottomText}>아이디/비밀번호 찾기</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    loginButton: {
        backgroundColor: '#1A73E8',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
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
    socialText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    bottomText: {
        color: '#666',
        fontSize: 14,
    },
    socialLogo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

export default LoginScreen;