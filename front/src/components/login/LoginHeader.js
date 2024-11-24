import React from 'react';
import { Text, View } from 'react-native';
import {styles} from '../../styles/LoginScreenStyles';

const LoginHeader = () => (
    <View style={styles.headerContainer}>
        <Text style={styles.title}>로그인</Text>
    </View>
);

export default LoginHeader;