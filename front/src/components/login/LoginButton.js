import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import {styles} from '../../styles/LoginScreenStyles';

const LoginButton = ({ onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.loginButton}>
        <Text style={styles.loginButtonText}>로그인</Text>
    </TouchableOpacity>
);

export default LoginButton;