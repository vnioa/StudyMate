import React from 'react';
import { Button, Alert } from 'react-native';
import { encryptFile } from '../../../utils/encryption';
import * as DocumentPicker from 'expo-document-picker';

const EncryptedFileTransfer = ({ onSendFile }) => {
    const handleFileTransfer = async () => {
        const file = await DocumentPicker.getDocumentAsync();
        if (file.type === 'success') {
            const encryptedFile = await encryptFile(file);
            onSendFile(encryptedFile);
            Alert.alert("File sent securely");
        }
    };

    return (
        <Button title="Send Encrypted File" onPress={handleFileTransfer} />
    );
};

export default EncryptedFileTransfer;
