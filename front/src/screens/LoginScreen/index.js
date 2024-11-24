import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Animated,
    Easing,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import {useGoogleLogin} from '../../hooks/useGoogleLogin';
import {LoginScreenStyles} from '../../styles/LoginScreenStyles';
import {validateToken, loginUser} from '../../api/AuthAPI';

const LoginScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const fadeAnim = new Animated.Value(0);

    // 구글 로그인 커스텀 훅
    const {googlePromptAsync, handleGoogleResponse} = useGoogleLogin(navigation);

    // 애니메이션 효과 적용
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    // 자동 로그인 체크 및 처리
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('userToken');
            if(token) {
                try{
                    const response = await validateToken(token);
                    if(response.success) {
                        navigation.navigate('Main');
                    } else {
                        await AsyncStorage.removeItem('userToken');
                    }
                } catch(error) {
                    console.error('토큰 검증 오류: ', error);
                }
            }
        };
        checkLoginStatus();
    }, []);

    // 일반 로그인 함수
    const handleLogin = async () => {
        if(!username || !password) {
            Alert.alert('아이디와 비밀번호를 모두 입력해 주세요.');
            return;
        }
        try{
            const response = await loginUser(username, password);
            if(response.success) {
                await AsyncStorage.setItem('userToken', response.token);
                Alert.alert('로그인에 성공했습니다.');
                navigation.navigate('Main');
            } else {
                Alert.alert('로그인 요청에 실패했습니다. 다시 시도해 주세요.');
            }
        } catch(error) {
            Alert.alert('로그인 요청에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                bahavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.View style={[styles.innerContainer, {opacity: fadeAnim}]}>
                    <Text style={styles.title}>로그인</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="아이디를 입력하세요"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>
                    <View sytle={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#888"
                            style={styles.icon}
                        />
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
                            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                        <Text style={styles.loginButtonText}>로그인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => googlePromptAsync()}
                        style={[styles.loginButton, styles.googleButton]}
                    >
                        <Ionicons name="logo-google" size={20} color="#fff" />
                        <Text style={[styles.loginButtonText, styles.googleButton]}>Google로 로그인</Text>
                    </TouchableOpacity>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.linkText}>회원가입</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FindIdPassword')}>
                            <Text style={styles.linkText}>아이디/비밀번호 찾기</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;