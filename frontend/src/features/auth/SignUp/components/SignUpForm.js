import React from 'react';
import { View, Text } from 'react-native';
import FormInput from './FormInput';
import VerificationSection from './VerificationSection';
import Button from '../../../../components/common/Button';
import { useSignUp } from '../hooks/useSignUp';
import styles from '../styles';

const SignUpForm = ({ navigation }) => {
    const {
        formData,
        isUsernameValid,
        isEmailVerified,
        passwordMatch,
        handleInputChange,
        checkUsername,
        handleSignup
    } = useSignUp();

    return (
        <View>
            <Text style={styles.title}>회원가입</Text>

            <FormInput
                icon="person-outline"
                placeholder="아이디"
                value={formData.username}
                onChangeText={(text) => handleInputChange('username', text)}
                onCheckPress={checkUsername}
                showCheckButton
                isValid={isUsernameValid}
            />

            <FormInput
                icon="lock-closed-outline"
                placeholder="비밀번호"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry
            />

            <FormInput
                icon="lock-closed-outline"
                placeholder="비밀번호 재입력"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry
                showValidation
                isValid={passwordMatch}
            />

            <FormInput
                icon="person-outline"
                placeholder="이름"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
            />

            <FormInput
                icon="calendar-outline"
                placeholder="생년월일 (YYYY-MM-DD)"
                value={formData.birthdate}
                onChangeText={(text) => handleInputChange('birthdate', text)}
                keyboardType="numeric"
            />

            <FormInput
                icon="call-outline"
                placeholder="전화번호"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="numeric"
            />

            <VerificationSection
                email={formData.email}
                onEmailChange={(text) => handleInputChange('email', text)}
                isVerified={isEmailVerified}
            />

            <Button
                title="회원가입"
                onPress={handleSignup}
                style={styles.signupButton}
                textStyle={styles.signupButtonText}
            />
        </View>
    );
};

export default SignUpForm;