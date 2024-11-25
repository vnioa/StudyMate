import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoginForm = ({ username, password, setUsername, setPassword, isPasswordVisible, setIsPasswordVisible }) => {
    return (
        <>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="아이디를 입력하세요"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>
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
                    <Ionicons
                        name={isPasswordVisible ? 'eye-off' : 'eye'}
                        size={20}
                        color="#888"
                    />
                </TouchableOpacity>
            </View>
        </>
    );
};

export default LoginForm;