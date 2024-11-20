import { useState, useEffect } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/authService';

export const useLogin = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            try {
                const response = await authService.validateToken(token);
                if (response.success) {
                    navigation.navigate('Main');
                } else {
                    await AsyncStorage.removeItem('userToken');
                }
            } catch (error) {
                console.error('토큰 검증 오류:', error);
            }
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const response = await authService.login(username, password);
            if (response.success) {
                await AsyncStorage.setItem('userToken', response.token);
                Alert.alert('알림', '로그인에 성공했습니다.');
                navigation.navigate('Main');
            } else {
                Alert.alert('알림', '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
            }
        } catch (error) {
            Alert.alert('오류', '로그인 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return {
        username,
        setUsername,
        password,
        setPassword,
        isPasswordVisible,
        setIsPasswordVisible,
        fadeAnim,
        handleLogin
    };
};