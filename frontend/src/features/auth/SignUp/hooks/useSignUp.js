import { useState, useEffect } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import { authService } from '../../services/authService';

export const useSignUp = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        birthdate: '',
        phoneNumber: '',
        email: '',
        verificationCode: ''
    });

    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(false);
    const [receivedCode, setReceivedCode] = useState('');
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'username') {
            validateUsername(value);
        } else if (field === 'confirmPassword') {
            setPasswordMatch(formData.password === value);
        }
    };

    const validateUsername = (value) => {
        const regex = /^[a-zA-Z0-9]+$/;
        setIsUsernameValid(regex.test(value));
    };

    const checkUsername = async () => {
        if (!isUsernameValid) {
            Alert.alert('아이디는 영문과 숫자로만 구성되어야 합니다.');
            return;
        }

        try {
            const response = await authService.checkUsername(formData.username);
            if (response.available) {
                setIsUsernameValid(true);
                Alert.alert('사용 가능한 아이디입니다.');
            } else {
                setIsUsernameValid(false);
                Alert.alert('이미 사용 중인 아이디입니다.');
            }
        } catch (error) {
            Alert.alert('아이디 중복 확인에 실패했습니다.');
        }
    };

    const requestVerificationCode = async () => {
        try {
            const response = await authService.sendVerificationCode(formData.email);
            if (response.success) {
                setReceivedCode(response.code);
                Alert.alert('인증코드가 발송되었습니다.');
            }
        } catch (error) {
            Alert.alert('인증코드 발송에 실패했습니다.');
        }
    };

    const verifyCode = () => {
        if (formData.verificationCode === receivedCode) {
            setIsEmailVerified(true);
            Alert.alert('인증이 완료되었습니다.');
        } else {
            Alert.alert('인증코드가 일치하지 않습니다.');
        }
    };

    const handleSignup = async () => {
        if (!isUsernameValid || !isEmailVerified) {
            Alert.alert('모든 검증 절차를 완료해주세요.');
            return;
        }

        try {
            const response = await authService.register(formData);
            if (response.success) {
                Alert.alert('회원가입이 완료되었습니다.');
                navigation.navigate('Login');
            }
        } catch (error) {
            Alert.alert('회원가입에 실패했습니다.');
        }
    };

    return {
        formData,
        isUsernameValid,
        isEmailVerified,
        passwordMatch,
        fadeAnim,
        handleInputChange,
        checkUsername,
        requestVerificationCode,
        verifyCode,
        handleSignup
    };
};