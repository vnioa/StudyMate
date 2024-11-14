// 파일 암호화 전송 기능

import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { encryptFile } from '../../utils/encryptionUtils';
import { uploadEncryptedFile } from '../../api/chat';

const EncryptedFileUpload = ({ chatId }) => {
    const handleFileSelect = async () => {
        const result = await DocumentPicker.getDocumentAsync({});
        if (result.type === 'success') {
            try {
                const encryptedFile = await encryptFile(result);
                await uploadEncryptedFile(chatId, encryptedFile);
                Alert.alert('암호화된 파일이 성공적으로 전송되었습니다.');
            } catch (error) {
                Alert.alert('파일 전송 실패', error.message);
            }
        }
    };

    return (
        <View>
            <Button title="암호화 파일 전송" onPress={handleFileSelect} />
        </View>
    );
};

export default EncryptedFileUpload;
