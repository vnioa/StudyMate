import React from 'react';
import { View, TextInput } from 'react-native';
import styles from './styles';

const PasswordInput = ({ password, setPassword, confirmPassword, setConfirmPassword }) => {
    return (
        <>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
            </View>
        </>
    );
};

export default PasswordInput;