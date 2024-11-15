import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFindAccount } from './hooks/useFindAccount';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import styles from './styles';

const FindIdTab = () => {
    const {
        formData,
        loading,
        isVerified,
        foundId,
        timer,
        handleInputChange,
        handleSendVerification,
        handleVerifyCode,
        handleFindId
    } = useFindAccount('id');

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.container}>
            <Input
                placeholder="이름"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
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
                    title="아이디 찾기"
                    onPress={handleFindId}
                    loading={loading}
                    style={styles.button}
                />
            )}

            {foundId && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>
                        찾은 아이디: {foundId}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default FindIdTab;