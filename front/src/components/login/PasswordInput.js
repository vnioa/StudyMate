import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {styles} from '../../styles/LoginScreenStyles';

const PasswordInput = ({ password, setPassword }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
            >
                <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color="#888" />
            </TouchableOpacity>
        </View>
    );
};

export default PasswordInput;