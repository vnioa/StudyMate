import React from 'react';
import { View, TextInput } from 'react-native';
import {styles} from '../../styles/SignUpScreenStyles';

const BasicInfoInput = ({ name, setName, birthdate, setBirthdate, phoneNumber, setPhoneNumber }) => {
    return (
        <>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="이름"
                    value={name}
                    onChangeText={setName}
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="생년월일 (YYYY-MM-DD)"
                    value={birthdate}
                    onChangeText={setBirthdate}
                />
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="전화번호"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
            </View>
        </>
    );
};

export default BasicInfoInput;