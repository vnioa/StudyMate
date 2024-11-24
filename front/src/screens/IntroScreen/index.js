import React from 'react';
import { View } from 'react-native';
import Title from '../../components/Intro/Title';
import IntroImage from '../../components/Intro/IntroImage';
import IntroButton from '../../components/Intro/IntroButton';
import styles from '../../styles/IntroScreenStyles';

const IntroScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            {/* 앱 타이틀 */}
            <Title />

            {/* 인트로 이미지 */}
            <IntroImage />

            {/* 로그인 버튼 */}
            <IntroButton
                text="로그인"
                onPress={() => navigation.navigate('LoginScreen')}
            />

            {/* 회원가입 버튼 */}
            <IntroButton
                text="회원가입"
                onPress={() => navigation.navigate('SignupScreen')}
                style={styles.signupButton}
            />
        </View>
    );
};

export default IntroScreen;