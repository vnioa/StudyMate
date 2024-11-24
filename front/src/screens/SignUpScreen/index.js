import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import UsernameInput from '../../components/signup/UsernameInput';
import PasswordInput from '../../components/signup/PasswordInput';
import EmailVerification from '../../components/signup/EmailVerification';
import BasicInfoInput from '../../components/signup/BasicInfoInput';
import SignUpButton from '../../components/signup/SignUpButton';
import styles from './styles';
import { registerUser } from '../../api/AuthApi';

const SignupScreen = ({ navigation }) => {
    // State variables for user input
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // 회원가입 처리 함수
    const handleSignup = async () => {
        // 입력값 검증
        if (!isUsernameValid) {
            Alert.alert('아이디 중복 확인을 완료해주세요.');
            return;
        }
        if (!isEmailVerified) {
            Alert.alert('이메일 인증을 완료해주세요.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password)) {
            Alert.alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
            return;
        }

        try {
            // 회원가입 API 호출
            const response = await registerUser({
                username,
                password,
                name,
                birthdate,
                phoneNumber,
                email,
            });

            if (response.data.success) {
                Alert.alert('회원가입이 완료되었습니다.');
                navigation.navigate('IntroScreen'); // 회원가입 후 Intro 화면으로 이동
            } else {
                Alert.alert('회원가입에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('회원가입 오류:', error.response ? error.response.data : error.message);
            Alert.alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* 아이디 입력 및 중복 확인 */}
                <UsernameInput
                    username={username}
                    setUsername={setUsername}
                    isValid={isUsernameValid}
                    setIsValid={setIsUsernameValid}
                />

                {/* 비밀번호 및 비밀번호 확인 */}
                <PasswordInput
                    password={password}
                    confirmPassword={confirmPassword}
                    setPassword={setPassword}
                    setConfirmPassword={setConfirmPassword}
                />

                {/* 이메일 인증 */}
                <EmailVerification
                    email={email}
                    setEmail={setEmail}
                    isVerified={isEmailVerified}
                    setIsVerified={setIsEmailVerified}
                />

                {/* 기본 정보 입력 */}
                <BasicInfoInput
                    name={name}
                    birthdate={birthdate}
                    phoneNumber={phoneNumber}
                    setName={setName}
                    setBirthdate={setBirthdate}
                    setPhoneNumber={setPhoneNumber}
                />

                {/* 회원가입 버튼 */}
                <SignUpButton onPress={handleSignup} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignupScreen;