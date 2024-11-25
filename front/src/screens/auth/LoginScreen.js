import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Animated, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginForm from '../../components/auth/LoginForm';
import SocialLogin from '../../components/auth/SocialLogin';

const LoginScreen = ({ navigation }) => {
    // State 관리
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const fadeAnim = new Animated.Value(0);

// 애니메이션 효과
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

// 로그인 상태 확인
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

    const handleLoginSuccess = async (token) => {
        await AsyncStorage.setItem('userToken', token);
        navigation.navigate('HomeScreen');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>로그인</Text>

                    <LoginForm
                        username={username}
                        password={password}
                        setUsername={setUsername}
                        setPassword={setPassword}
                        isPasswordVisible={isPasswordVisible}
                        setIsPasswordVisible={setIsPasswordVisible}
                    />

                    <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                        <Text style={styles.loginButtonText}>로그인</Text>
                    </TouchableOpacity>

                    <SocialLogin onLoginSuccess={handleLoginSuccess} />

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
        backgroundColor: '#F5F7FA'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center'
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 30,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5
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
        paddingHorizontal: 10
    },
    icon: {
        marginRight: 10
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16
    },
    eyeIcon: {
        position: 'absolute',
        right: 15
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
        elevation: 6
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '80%'
    },
    linkText: {
        color: '#0057D9',
        fontWeight: 'bold',
        fontSize: 14,
        padding: 5
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
        gap: 20
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    socialIcon: {
        width: 30,
        height: 30
    }
});

export default LoginScreen;