// 파일 전송 기능 컴포넌트

import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile, validateFileSize } from '../../api/chat';

const FileUpload = ({ chatId }) => {
    const handleFileSelect = async () => {
        const result = await DocumentPicker.getDocumentAsync({});
        if (result.type === 'success') {
            try {
                validateFileSize(result, 5000000); // 최대 파일 크기: 5MB
                await uploadFile(chatId, result);
                Alert.alert('파일이 성공적으로 전송되었습니다.');
            } catch (error) {
                Alert.alert('파일 전송 실패', error.message);
            }
        }
    };

    return (
        <View>
            <Button title="파일 선택 및 전송" onPress={handleFileSelect} />
        </View>
    );
};

export default FileUpload;
