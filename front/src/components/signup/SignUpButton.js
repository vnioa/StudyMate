import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import {styles} from '../../styles/SignUpScreenStyles';

const SignUpButton = ({ onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.signupButton}>
        <Text style={styles.signupButtonText}>회원가입</Text>
    </TouchableOpacity>
);

export default SignUpButton;