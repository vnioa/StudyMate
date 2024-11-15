import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Animated } from 'react-native';
import SignUpForm from './components/SignUpForm';
import { useSignUp } from './hooks/useSignUp';
import styles from './styles';

const SignUpScreen = ({ navigation }) => {
    const { fadeAnim } = useSignUp();

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.avoidingView}
                keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                        <SignUpForm navigation={navigation} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUpScreen;