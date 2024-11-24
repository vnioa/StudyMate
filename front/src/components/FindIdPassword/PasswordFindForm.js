import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { requestVerificationCodeForPassword } from '../../api/AuthApi';
import {styles} from '../../styles/FindIdPasswordStyles';

const PasswordFindForm = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);

    // 인증 코드 요청
    const handleRequestVerificationCode = async () => {
        if (!username || !email) {
            Alert.alert('아이디와 이메일을 모두 입력해주세요.');
            return;
        }
        try {
            const response = await requestVerificationCodeForPassword(username, email);
            if (response.data.success) {
                setReceivedCode(response.data.code);
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('입력한 정보와 일치하는 계정을 찾을 수 없습니다.');
            }
        } catch (error) {
            Alert.alert('인증 코드 요청에 실패했습니다.');
        }
    };

    // 인증 코드 검증
    const handleVerifyCode = () => {
        if (verificationCode === receivedCode) {
            setIsCodeVerified(true);
            Alert.alert('인증이 완료되었습니다.');
        } else {
            Alert.alert('인증 코드가 일치하지 않습니다.');
        }
    };

    return (
        <View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={username}
                    onChangeText={setUsername}
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="등록된 이메일"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>
            {!isCodeVerified && (
                <>
                    <TouchableOpacity style={styles.button} onPress={handleRequestVerificationCode}>
                        <Text style={styles.buttonText}>인증코드 발송</Text>
                    </TouchableOpacity>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="인증코드 입력"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                        />
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
                        <Text style={styles.buttonText}>코드 확인</Text>
                    </TouchableOpacity>
                </>
            )}
            {isCodeVerified && (
                <TouchableOpacity
                    style={[styles.button, styles.resetButton]}
                    onPress={() => navigation.navigate('ResetPasswordScreen')}
                >
                    <Text>비밀번호 재설정</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default PasswordFindForm;