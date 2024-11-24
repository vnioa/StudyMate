import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {styles} from '../../styles/LoginScreenStyles';

const UsernameInput = ({ username, setUsername }) => (
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
);

export default UsernameInput;