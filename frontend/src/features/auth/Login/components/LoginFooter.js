import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles';

const LoginFooter = ({ navigation }) => {
    return (
        <View style={styles.footerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.footerText}>회원가입</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('FindAccount')}>
                <Text style={styles.footerText}>아이디/비밀번호 찾기</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LoginFooter;