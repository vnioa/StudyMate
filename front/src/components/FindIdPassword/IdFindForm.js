import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { requestVerificationCode, findId } from '../../api/AuthApi';
import {styles} from '../../styles/FindIdPasswordStyles';

const IdFindForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [foundUsername, setFoundUsername] = useState('');

    // 인증 코드 요청
    const handleRequestVerificationCode = async () => {
        if (!name || !email) {
            Alert.alert('이름과 이메일을 모두 입력해주세요.');
            return;
        }
        try {
            const response = await requestVerificationCode(email);
            if (response.data.success) {
                setReceivedCode(response.data.code);
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('인증 코드 발송에 실패했습니다.');
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

    // 아이디 찾기 요청
    const handleFindId = async () => {
        if (!isCodeVerified) {
            Alert.alert('이메일 인증을 완료해주세요.');
            return;
        }
        try {
            const response = await findId(name, email);
            if (response.data.success) {
                setFoundUsername(response.data.username);
                Alert.alert(`아이디는 ${response.data.username}입니다.`);
            } else {
                Alert.alert('입력한 정보와 일치하는 아이디가 없습니다.');
            }
        } catch (error) {
            Alert.alert('아이디 찾기 요청에 실패했습니다.');
        }
    };

    return (
        <View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="이름"
                    value={name}
                    onChangeText={setName}
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
                <TouchableOpacity style={styles.button} onPress={handleFindId}>
                    <Text style={styles.buttonText}>아이디 찾기</Text>
                </TouchableOpacity>
            )}
            {foundUsername && (
                <View style={styles.resultContainer}>
                    <Text>찾은 아이디: {foundUsername}</Text>
                </View>
            )}
        </View>
    );
};

export default IdFindForm;