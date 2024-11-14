// src/components/Common/Input.js

import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const Input = ({
                   value,
                   onChangeText,
                   placeholder,
                   secureTextEntry = false,
                   keyboardType = 'default',
                   error,
                   style,
                   ...props
               }) => {
    return (
        <View style={[styles.container, style]}>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
    },
    input: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#ff4d4d',
    },
    errorText: {
        color: '#ff4d4d',
        fontSize: 12,
        marginTop: 5,
    },
});

export default Input;
