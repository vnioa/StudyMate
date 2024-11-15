import React from 'react';
import { View } from 'react-native';
import FormInput from './FormInput';
import Button from '../../../../components/common/Button';
import { useSignUp } from '../hooks/useSignUp';
import styles from '../styles';

const VerificationSection = ({ email, onEmailChange, isVerified }) => {
    const {
        verificationCode,
        handleInputChange,
        requestVerificationCode,
        verifyCode
    } = useSignUp();

    return (
        <View>
            <FormInput
                icon="mail-outline"
                placeholder="이메일"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
            />

            {!isVerified && (
                <>
                    <Button
                        title="인증코드 발송"
                        onPress={requestVerificationCode}
                        style={styles.verificationButton}
                    />

                    <FormInput
                        icon="key-outline"
                        placeholder="인증코드 입력"
                        value={verificationCode}
                        onChangeText={(text) => handleInputChange('verificationCode', text)}
                        keyboardType="numeric"
                    />

                    <Button
                        title="코드 확인"
                        onPress={verifyCode}
                        style={styles.verificationButton}
                    />
                </>
            )}
        </View>
    );
};

export default VerificationSection;