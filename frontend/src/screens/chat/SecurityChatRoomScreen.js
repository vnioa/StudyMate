import React, { useState } from 'react';
import { View, Text, Switch, Button, TextInput, Alert } from 'react-native';
import { initiateSecureSession, encryptMessage, decryptMessage } from '../utils/encryption';
import SecurityChatRoomScreenStyles from '../styles/SecurityChatRoomScreenStyles';

const SecurityChatRoomScreen = () => {
    const [secureSession, setSecureSession] = useState(false);
    const [message, setMessage] = useState('');
    const [encryptedMessage, setEncryptedMessage] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');

    const toggleSecureSession = () => {
        if (secureSession) {
            Alert.alert('Secure session ended');
            setSecureSession(false);
        } else {
            initiateSecureSession();
            setSecureSession(true);
            Alert.alert('Secure session started');
        }
    };

    const handleEncryptMessage = () => {
        const encrypted = encryptMessage(message);
        setEncryptedMessage(encrypted);
        Alert.alert('Message encrypted');
    };

    const handleDecryptMessage = () => {
        try {
            const decrypted = decryptMessage(encryptedMessage);
            setDecryptedMessage(decrypted);
        } catch (error) {
            Alert.alert('Error decrypting message');
        }
    };

    return (
        <View style={SecurityChatRoomScreenStyles.container}>
            <Text style={SecurityChatRoomScreenStyles.header}>보안 및 암호화 설정</Text>
            <View style={SecurityChatRoomScreenStyles.switchContainer}>
                <Text>보안 채팅 활성화</Text>
                <Switch value={secureSession} onValueChange={toggleSecureSession} />
            </View>
            <TextInput
                placeholder="메시지 입력"
                style={SecurityChatRoomScreenStyles.input}
                value={message}
                onChangeText={setMessage}
            />
            <Button title="메시지 암호화" onPress={handleEncryptMessage} />
            {encryptedMessage ? (
                <View style={SecurityChatRoomScreenStyles.encryptedMessageContainer}>
                    <Text style={SecurityChatRoomScreenStyles.encryptedMessageText}>암호화된 메시지: {encryptedMessage}</Text>
                </View>
            ) : null}
            <Button title="메시지 복호화" onPress={handleDecryptMessage} />
            {decryptedMessage ? (
                <View style={SecurityChatRoomScreenStyles.decryptedMessageContainer}>
                    <Text style={SecurityChatRoomScreenStyles.decryptedMessageText}>복호화된 메시지: {decryptedMessage}</Text>
                </View>
            ) : null}
        </View>
    );
};

export default SecurityChatRoomScreen;
