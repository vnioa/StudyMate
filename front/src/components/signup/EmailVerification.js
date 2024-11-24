import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { requestVerificationCode, verifyCode } from '../../api/AuthApi';
import {styles} from '../../styles/SignUpScreenStyles';

const EmailVerification = ({ email, setEmail }) => {
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const handleRequestVerificationCode = async () => {
        try {
            const response = await requestVerificationCode(email);
            if (response.data.success) {
                setReceivedCode(response.data.code);
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('이메일 인증 요청에 실패했습니다.');
            }
        } catch (error) {
            console.error('이메일 인증 요청 오류:', error);
            Alert.alert('이메일 인증 요청에 실패했습니다.');
        }
    };

    const handleVerifyCode = () => {
        if (verificationCode === receivedCode) {
            setIsEmailVerified(true);
            Alert.alert('이메일 인증이 완료되었습니다.');
        } else {
            Alert.alert('인증 코드가 일치하지 않습니다.');
        }
    };

    return (
        <>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="이메일"
                    value={email}
                    onChangeText={setEmail}
                />
                <TouchableOpacity onPress={handleRequestVerificationCode} style={styles.checkButton}>
                    <Text style={styles.checkButtonText}>인증코드 발송</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="인증코드 입력"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                />
                <TouchableOpacity onPress={handleVerifyCode} style={styles.checkButton}>
                    <Text style={styles.checkButtonText}>코드 확인</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

export default EmailVerification;