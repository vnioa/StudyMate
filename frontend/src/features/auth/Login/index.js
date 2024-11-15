import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import LoginForm from './components/LoginForm';
import SocialLogin from './components/SocialLogin';
import LoginFooter from './components/LoginFooter';
import { useLogin } from './hooks/useLogin';
import styles from './styles';

const LoginScreen = ({ navigation }) => {
    const { fadeAnim } = useLogin();

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                    <LoginForm />
                    <SocialLogin />
                    <LoginFooter navigation={navigation} />
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;