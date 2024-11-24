import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import {styles} from '../../styles/LoginScreenStyles';

const NavigationLinks = ({ navigation }) => (
    <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
            <Text style={styles.linkText}>회원가입</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('FindIdPasswordScreen')}>
            <Text style={styles.linkText}>아이디/비밀번호 찾기</Text>
        </TouchableOpacity>
    </View>
);

export default NavigationLinks;