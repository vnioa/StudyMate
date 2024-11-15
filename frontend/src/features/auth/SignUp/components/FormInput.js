import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

const FormInput = ({
                       icon,
                       placeholder,
                       value,
                       onChangeText,
                       secureTextEntry,
                       keyboardType,
                       showCheckButton,
                       onCheckPress,
                       showValidation,
                       isValid
                   }) => {
    return (
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={24} color="#0057D9" style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize="none"
                placeholderTextColor="#888"
            />
            {showCheckButton && (
                <TouchableOpacity onPress={onCheckPress} style={styles.checkButton}>
                    <Text style={styles.checkButtonText}>중복 확인</Text>
                </TouchableOpacity>
            )}
            {showValidation && (
                <Ionicons
                    name={isValid ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={isValid ? '#4CAF50' : '#F44336'}
                    style={styles.validationIcon}
                />
            )}
        </View>
    );
};

export default React.memo(FormInput);