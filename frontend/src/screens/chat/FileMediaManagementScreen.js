// screens/FileMediaManagerScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Alert, TouchableOpacity, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { fetchChatFiles, uploadFile, deleteFile } from '../../api/chat';
import { isFileSizeValid, compressImage, showFileAlert, sortFilesByDate } from '../../utils/fileUtils';
import { encryptFile } from '../../utils/encryptionUtils';
import FileMediaManagerStyles from '../styles/FileMediaManagementScreenStyle';

const FileMediaManagerScreen = ({ route }) => {
    const [files, setFiles] = useState([]);
    const chatId = route.params.chatId;

    useEffect(async () => {
        await loadFiles();
    }, []);

    // 파일 목록을 서버에서 로드
    const loadFiles = async () => {
        try {
            const chatFiles = await fetchChatFiles(chatId);
            const sortedFiles = sortFilesByDate(chatFiles);
            setFiles(sortedFiles);
        } catch (error) {
            console.error('Error loading files:', error);
            Alert.alert('Error', 'Failed to load files');
        }
    };

    // 파일 업로드 처리
    const handleFileUpload = async () => {
        const result = await DocumentPicker.getDocumentAsync({});
        if (result.type === 'success') {
            // 대용량 파일 체크 및 압축
            if (!isFileSizeValid(result.size)) {
                showFileAlert('파일이 너무 커서 압축 후 전송합니다.');
                const compressedFile = await compressImage(result.uri);
                result.uri = compressedFile.uri;
                result.size = compressedFile.size;
            }
            // 파일 암호화 처리
            const encryptedFile = await encryptFile(result);
            uploadSelectedFile(encryptedFile);
        }
    };

    // 서버에 파일 업로드 로직
    const uploadSelectedFile = async (file) => {
        try {
            const uploadedFile = await uploadFile(chatId, file);
            setFiles((prevFiles) => [uploadedFile, ...prevFiles]);
            Alert.alert('파일 업로드 완료');
        } catch (error) {
            console.error('Failed to upload file:', error);
            Alert.alert('Error', 'Failed to upload file');
        }
    };

    // 파일 삭제 처리
    const handleFileDelete = async (fileId) => {
        try {
            await deleteFile(chatId, fileId);
            setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
            Alert.alert('파일 삭제 완료');
        } catch (error) {
            console.error('Failed to delete file:', error);
            Alert.alert('Error', 'Failed to delete file');
        }
    };

    const renderFileItem = ({ item }) => (
        <View style={FileMediaManagerStyles.fileContainer}>
            {item.type === 'image' && <Image source={{ uri: item.uri }} style={FileMediaManagerStyles.image} />}
            <Text style={FileMediaManagerStyles.fileName}>{item.name}</Text>
            <Text style={FileMediaManagerStyles.fileSize}>크기: {item.size} bytes</Text>
            <TouchableOpacity
                onPress={() => handleFileDelete(item.id)}
                style={FileMediaManagerStyles.deleteButton}
            >
                <Text style={FileMediaManagerStyles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={FileMediaManagerStyles.container}>
            <Text style={FileMediaManagerStyles.header}>파일 및 미디어 관리</Text>
            <Button title="파일 선택" onPress={handleFileUpload} />
            <FlatList
                data={files}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFileItem}
                style={FileMediaManagerStyles.fileList}
            />
        </View>
    );
};

export default FileMediaManagerScreen;
