import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { checkUsername } from '../../api/AuthApi';
import styles from '../styles';

const UsernameInput = ({ username, setUsername }) => {
    const [isUsernameValid, setIsUsernameValid] = useState(false);

    const handleCheckUsername = async () => {
        if (!username.match(/^[a-zA-Z0-9]+$/)) {
            Alert.alert('아이디는 영문과 숫자로만 구성되어야 합니다.');
            return;
        }
        try {
            const response = await checkUsername(username);
            if (response.data.available) {
                setIsUsernameValid(true);
                Alert.alert('사용 가능한 아이디입니다.');
            } else {
                Alert.alert('이미 사용 중인 아이디입니다.');
            }
        } catch (error) {
            console.error('아이디 중복 확인 오류:', error);
            Alert.alert('아이디 중복 확인에 실패했습니다.');
        }
    };

    return (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="아이디"
                value={username}
                onChangeText={setUsername}
            />
            <TouchableOpacity onPress={handleCheckUsername} style={styles.checkButton}>
                <Text style={styles.checkButtonText}>중복 확인</Text>
            </TouchableOpacity>
        </View>
    );
};

export default UsernameInput;