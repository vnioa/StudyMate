import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFindAccount } from './hooks/useFindAccount';
import { useNavigation } from '@react-navigation/native';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import styles from './styles';

const FindPasswordTab = () => {
    const navigation = useNavigation();
    const {
        formData,
        loading,
        isVerified,
        timer,
        handleInputChange,
        handleSendVerification,
        handleVerifyCode
    } = useFindAccount('password');

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.container}>
            <Input
                placeholder="아이디"
                value={formData.username}
                onChangeText={(text) => handleInputChange('username', text)}
                style={styles.input}
            />
            <Input
                placeholder="이메일"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                style={styles.input}
            />

            {!isVerified && (
                <>
                    <Button
                        title="인증코드 발송"
                        onPress={handleSendVerification}
                        loading={loading}
                        style={styles.button}
                    />
                    {timer > 0 && (
                        <Text style={styles.timerText}>
                            남은 시간: {formatTime(timer)}
                        </Text>
                    )}
                    <Input
                        placeholder="인증코드 입력"
                        value={formData.verificationCode}
                        onChangeText={(text) => handleInputChange('verificationCode', text)}
                        keyboardType="number-pad"
                        style={[styles.input, styles.verificationCodeInput]}
                    />
                    <Button
                        title="인증하기"
                        onPress={handleVerifyCode}
                        style={styles.button}
                    />
                </>
            )}

            {isVerified && (
                <Button
                    title="비밀번호 재설정"
                    onPress={() => navigation.navigate('ResetPassword', {
                        username: formData.username,
                        email: formData.email
                    })}
                    style={styles.button}
                />
            )}
        </View>
    );
};

export default FindPasswordTab;