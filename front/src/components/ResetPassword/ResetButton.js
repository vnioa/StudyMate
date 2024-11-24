import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../../styles/ResetPasswordStyles';

const ResetButton = ({ onPress, disabled }) => (
    <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <Text style={styles.buttonText}>비밀번호 재설정</Text>
    </TouchableOpacity>
);

export default ResetButton;