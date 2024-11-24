import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../styles/ResetPasswordStyles';

const PasswordInput = ({ password, setPassword, placeholder }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
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