// screens/intro/components/IntroButtons.js
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../styles';

const IntroButtons = ({ navigation }) => {
    return (
        <>
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
        </>
    );
};

export default React.memo(IntroButtons);