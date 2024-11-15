import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import PasswordForm from './components/PasswordForm';
import { useResetPassword } from './hooks/useResetPassword';
import styles from './styles';

const ResetPasswordScreen = ({ navigation, route }) => {
    const { fadeAnim } = useResetPassword();
    const { username, email } = route.params || {};

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                    <PasswordForm
                        navigation={navigation}
                        username={username}
                        email={email}
                    />
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ResetPasswordScreen;