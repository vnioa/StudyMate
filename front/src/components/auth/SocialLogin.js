import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import NaverLogin from '@react-native-seoul/naver-login';
import { WebView } from 'react-native-webview';

const SocialLogin = ({ onLoginSuccess }) => {
    const [googleRequest, googleResponse, promptAsync] = Google.useAuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID'
    });

    const handleGoogleLogin = async () => {
        try {
            const result = await promptAsync();
            if (result?.type === 'success') {
                const { id_token } = result.params;
                const response = await axios.post('API_URL/auth/google', { token: id_token });
                onLoginSuccess(response.data.token);
            }
        } catch (error) {
            console.error('Google 로그인 실패:', error);
        }
    };

    const handleNaverLogin = async () => {
        try {
            const token = await NaverLogin.login({
                consumerKey: 'YOUR_NAVER_CLIENT_ID',
                consumerSecret: 'YOUR_NAVER_CLIENT_SECRET',
                serviceUrlScheme: 'YOUR_URL_SCHEME'
            });
            const response = await axios.post('API_URL/auth/naver', { token });
            onLoginSuccess(response.data.token);
        } catch (error) {
            console.error('Naver 로그인 실패:', error);
        }
    };

    return (
        <View style={styles.socialContainer}>
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.socialButton}>
                <Image source={require('../../assets/google-icon.png')} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNaverLogin} style={styles.socialButton}>
                <Image source={require('../../assets/naver-icon.png')} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleKakaoLogin} style={styles.socialButton}>
                <Image source={require('../../assets/kakao-icon.png')} style={styles.socialIcon} />
            </TouchableOpacity>
        </View>
    );
};

export default SocialLogin;