// src/components/Chat/FileAttachment.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { sendFile } from '../../api/chatAPI';

const FileAttachment = ({ roomId, token, onFileSent }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // 파일 선택 함수 (이미지 선택)
    const pickFile = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert("파일 접근 권한이 필요합니다.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.cancelled) {
            setFile(result);
        }
    };

    // 파일 전송
    const handleSendFile = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const sentFileMessage = await sendFile(roomId, file, token);
            onFileSent(sentFileMessage); // 상위 컴포넌트에서 메시지 목록 업데이트
            setFile(null); // 파일 초기화
        } catch (error) {
            console.error("Error sending file:", error);
            alert("파일 전송 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {file ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: file.uri }} style={styles.imagePreview} />
                    <TouchableOpacity onPress={() => setFile(null)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity onPress={pickFile} style={styles.pickButton}>
                    <Text style={styles.pickButtonText}>Attach File</Text>
                </TouchableOpacity>
            )}
            {file && (
                <TouchableOpacity onPress={handleSendFile} style={styles.sendButton} disabled={uploading}>
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    pickButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    pickButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    previewContainer: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 5,
    },
    removeButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        padding: 5,
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    sendButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#28a745',
        borderRadius: 5,
        marginLeft: 10,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FileAttachment;
