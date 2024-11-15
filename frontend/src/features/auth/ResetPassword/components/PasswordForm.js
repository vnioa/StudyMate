import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StrengthIndicator from './StrengthIndicator';
import { useResetPassword } from '../hooks/useResetPassword';
import styles from '../styles';

const PasswordForm = ({ navigation, username, email }) => {
    const {
        newPassword,
        confirmPassword,
        isPasswordVisible,
        passwordStrength,
        strengthBarWidth,
        handlePasswordChange,
        handleConfirmPasswordChange,
        togglePasswordVisibility,
        handleResetPassword,
        isPasswordMatch
    } = useResetPassword();

    return (
        <View style={styles.card}>
            <Text style={styles.title}>비밀번호 재설정</Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888"
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                        size={20}
                        color="#888"
                    />
                </TouchableOpacity>
            </View>

            <StrengthIndicator
                strength={passwordStrength}
                barWidth={strengthBarWidth}
            />

            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888"
                    style={styles.inputIcon}
                />
                <TextInput
                    style={[styles.input, !isPasswordMatch && styles.inputError]}
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                />
            </View>

            {!isPasswordMatch && (
                <Text style={styles.errorText}>
                    비밀번호가 일치하지 않습니다.
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.button,
                    (!newPassword || !confirmPassword || !isPasswordMatch) &&
                    styles.buttonDisabled
                ]}
                onPress={() => handleResetPassword(username, email)}
                disabled={!newPassword || !confirmPassword || !isPasswordMatch}
            >
                <Text style={styles.buttonText}>비밀번호 재설정</Text>
            </TouchableOpacity>
        </View>
    );
};

export default PasswordForm;