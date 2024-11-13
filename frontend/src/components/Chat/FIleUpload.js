// components/FileUpload.js

import React, { useState } from 'react';
import { Button, View, Text, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const FileUpload = ({ onUpload }) => {
    const [fileName, setFileName] = useState(null);
    const [fileSize, setFileSize] = useState(null);
    const [fileType, setFileType] = useState(null);

    const handleFileSelect = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // 모든 파일 유형을 허용, 필요시 'application/pdf', 'image/*' 등으로 제한 가능
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                const { name, size, mimeType, uri } = result;

                // 파일 크기 제한 (5MB)
                if (size > 5000000) {
                    Alert.alert('파일이 너무 큽니다.', '5MB 이하의 파일만 업로드 가능합니다.');
                    return;
                }

                // 상태 업데이트
                setFileName(name);
                setFileSize(size);
                setFileType(mimeType);

                // 부모 컴포넌트로 파일 정보 전달
                onUpload({
                    uri,
                    name,
                    type: mimeType,
                    size,
                });
            }
        } catch (error) {
            console.error("파일 선택 중 오류 발생:", error);
        }
    };

    return (
        <View style={{ padding: 10 }}>
            <Button title="파일 선택" onPress={handleFileSelect} />
            {fileName && (
                <View style={{ marginTop: 10 }}>
                    <Text>파일 이름: {fileName}</Text>
                    <Text>파일 크기: {(fileSize / 1024).toFixed(2)} KB</Text>
                    <Text>파일 타입: {fileType}</Text>
                </View>
            )}
        </View>
    );
};

export default FileUpload;
