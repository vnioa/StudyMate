import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, validateToken } from '../../api/AuthApi';
import LoginHeader from '../../components/Login/LoginHeader';
import UsernameInput from '../../components/Login/UsernameInput';
import PasswordInput from '../../components/Login/PasswordInput';
import LoginButton from '../../components/Login/LoginButton';
import NavigationLinks from '../../components/Login/NavigationLinks';
import {styles} from '../../styles/LoginScreenStyles';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const fadeAnim = new Animated.Value(0);

    // 애니메이션 효과 적용
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    // 앱 시작 시 로그인 상태 확인
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                try {
                    const response = await validateToken(token);
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

    // 로그인 처리 함수
    const handleLogin = async () => {
        if (!username || !password) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const response = await loginUser(username, password);
            if (response.data.success) {
                await AsyncStorage.setItem('userToken', response.data.token);
                alert('로그인에 성공했습니다.');
                navigation.navigate('HomeScreen');
            } else {
                alert('로그인에 실패했습니다.');
            }
        } catch (error) {
            alert('로그인 요청에 실패했습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                    <LoginHeader />
                    <UsernameInput username={username} setUsername={setUsername} />
                    <PasswordInput password={password} setPassword={setPassword} />
                    <LoginButton onPress={handleLogin} />
                    <NavigationLinks navigation={navigation} />
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;