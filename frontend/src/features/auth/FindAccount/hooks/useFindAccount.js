import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {authService} from '../../services/authService';

export const useFindAccount = (type) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        verificationCode: ''
    });
    const [isVerified, setIsVerified] = useState(false);
    const [foundId, setFoundId] = useState('');
    const [timer, setTimer] = useState(0);
    const [receivedCode, setReceivedCode] = useState('');

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const startTimer = useCallback(() => {
        setTimer(180); // 3분
        const interval = setInterval(() => {
            setTimer((prevTimer) => {
                if (prevTimer <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prevTimer - 1;
            });
        }, 1000);
        return interval;
    }, []);

    const handleSendVerification = useCallback(async () => {
        try {
            setLoading(true);
            const { email, name, username } = formData;

            if (type === 'id' && (!name || !email)) {
                Alert.alert('알림', '이름과 이메일을 입력해주세요.');
                return;
            }

            if (type === 'password' && (!username || !email)) {
                Alert.alert('알림', '아이디와 이메일을 입력해주세요.');
                return;
            }

            const response = await authService.sendVerificationCode({ email });
            if (response.success) {
                setReceivedCode(response.code);
                const interval = startTimer();
                Alert.alert('알림', '인증코드가 발송되었습니다.');
                return () => clearInterval(interval);
            }
        } catch (error) {
            Alert.alert('오류', '인증코드 발송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [formData, type, startTimer]);

    const handleVerifyCode = useCallback(() => {
        if (formData.verificationCode === receivedCode) {
            setIsVerified(true);
            Alert.alert('알림', '인증이 완료되었습니다.');
        } else {
            Alert.alert('오류', '인증코드가 일치하지 않습니다.');
        }
    }, [formData.verificationCode, receivedCode]);

    const handleFindId = useCallback(async () => {
        if (!isVerified) {
            Alert.alert('알림', '이메일 인증을 먼저 완료해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await authService.findId({
                name: formData.name,
                email: formData.email
            });

            if (response.success) {
                setFoundId(response.username);
            }
        } catch (error) {
            Alert.alert('오류', '아이디 찾기에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [isVerified, formData]);

    return {
        formData,
        loading,
        isVerified,
        foundId,
        timer,
        handleInputChange,
        handleSendVerification,
        handleVerifyCode,
        handleFindId
    };
};