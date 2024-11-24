import React, { useState } from 'react';
import {Text, View} from 'react-native';
import UsernameInput from '../../components/ResetPassword/UsernameInput';
import PasswordInput from '../../components/ResetPassword/PasswordInput';
import StrengthBar from '../../components/ResetPassword/StrengthBar';
import ResetButton from '../../components/ResetPassword/ResetButton';
import styles from '../../styles/ResetPasswordStyles';
import { resetPassword } from '../../api/AuthApi';

const ResetPasswordScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordMatch, setIsPasswordMatch] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [strengthBarWidth] = useState(new Animated.Value(0));

    // 비밀번호 강도 검사 및 애니메이션
    const checkPasswordStrength = (password) => {
        let strength = '';
        let width = 0;

        if (password.length >= 8) {
            if (
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
            ) {
                strength = '강함';
                width = 1;
            } else if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
                strength = '중간';
                width = 0.7;
            } else {
                strength = '약함';
                width = 0.4;
            }
        } else {
            strength = '너무 짧음';
            width = 0.2;
        }

        setPasswordStrength(strength);
        Animated.timing(strengthBarWidth, {
            toValue: width,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    // 비밀번호 재설정 함수
    const handleResetPassword = async () => {
        if (!username || !newPassword || !confirmPassword) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await resetPassword(username, newPassword);
            if (response.data.success) {
                alert('비밀번호가 성공적으로 재설정되었습니다.');
                navigation.navigate('LoginScreen');
            } else {
                alert('비밀번호 재설정에 실패했습니다.');
            }
        } catch (error) {
            alert('비밀번호 재설정 요청에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <UsernameInput username={username} setUsername={setUsername} />
                <PasswordInput password={newPassword} setPassword={(value) => {
                    setNewPassword(value);
                    checkPasswordStrength(value);
                    setIsPasswordMatch(value === confirmPassword);
                }} placeholder="새 비밀번호" />
                <StrengthBar strength={passwordStrength} strengthBarWidth={strengthBarWidth} />
                <PasswordInput password={confirmPassword} setPassword={(value) => {
                    setConfirmPassword(value);
                    setIsPasswordMatch(newPassword === value);
                }} placeholder="비밀번호 재입력" />
                {!isPasswordMatch && (
                    <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                )}
                <ResetButton onPress={handleResetPassword} disabled={!newPassword || !confirmPassword || !isPasswordMatch} />
            </View>
        </View>
    );
};

export default ResetPasswordScreen;