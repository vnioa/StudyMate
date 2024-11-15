import { useState, useEffect } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import { authService } from '../../../../services/authService';

export const useResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [isPasswordMatch, setIsPasswordMatch] = useState(true);
    const strengthBarWidth = new Animated.Value(0);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const checkPasswordStrength = (password) => {
        let strength = '';
        let width = 0;

        if (password.length >= 8) {
            if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
                strength = '강함';
                width = 1;
            } else if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
                strength = '중간';
                width = 0.7;
            } else {
                strength = '약함';
                width = 0.4;
            }
        } else {
            strength = '너무 짧음';
            width = 0.2;
        }

        setPasswordStrength(strength);
        Animated.timing(strengthBarWidth, {
            toValue: width,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: false,
        }).start();
    };

    const handlePasswordChange = (value) => {
        setNewPassword(value);
        checkPasswordStrength(value);
        setIsPasswordMatch(value === confirmPassword);
    };

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
        setIsPasswordMatch(newPassword === value);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleResetPassword = async (username, email) => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('모든 필드를 입력해주세요.');
            return;
        }

        if (!isPasswordMatch) {
            Alert.alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await authService.resetPassword({
                username,
                email,
                newPassword
            });

            if (response.success) {
                Alert.alert(
                    '성공',
                    '비밀번호가 성공적으로 재설정되었습니다.',
                    [
                        {
                            text: '확인',
                            onPress: () => navigation.navigate('Login')
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('오류', '비밀번호 재설정에 실패했습니다.');
        }
    };

    return {
        newPassword,
        confirmPassword,
        isPasswordVisible,
        passwordStrength,
        strengthBarWidth,
        fadeAnim,
        isPasswordMatch,
        handlePasswordChange,
        handleConfirmPasswordChange,
        togglePasswordVisibility,
        handleResetPassword
    };
};