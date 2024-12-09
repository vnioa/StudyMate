import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../../api/api';

const DeviceStorageScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [savedFilePath, setSavedFilePath] = useState(null);

    const saveToDevice = useCallback(async (fileData) => {
        try {
            const directory = `${FileSystem.documentDirectory}studyFiles/`;
            const dirInfo = await FileSystem.getInfoAsync(directory);

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }

            const filename = `file_${new Date().getTime()}.pdf`;
            const filePath = `${directory}${filename}`;

            await FileSystem.writeAsStringAsync(filePath, fileData, {
                encoding: FileSystem.EncodingType.Base64
            });

            setSavedFilePath(filePath);

            await api.post('/storage/save-path', {
                path: filePath,
                filename: filename
            });

            return filePath;
        } catch (error) {
            throw new Error('파일 저장에 실패했습니다.');
        }
    }, []);

    const openFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: false
            });

            if (result.type === 'success') {
                const fileUri = result.uri;
                await FileSystem.readAsStringAsync(fileUri, {
                    encoding: FileSystem.EncodingType.Base64
                });
            }
        } catch (error) {
            Alert.alert('오류', '파일을 열 수 없습니다.');
        }
    }, []);

    const handleSaveFile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/files/download', {
                responseType: 'arraybuffer'
            });

            const base64Data = Buffer.from(response.data, 'binary').toString('base64');
            const savedPath = await saveToDevice(base64Data);

            Alert.alert('성공', '파일이 저장되었습니다.', [
                {
                    text: '확인',
                    onPress: () => {
                        // 저장 완료 후 처리
                    }
                }
            ]);
        } catch (error) {
            Alert.alert('오류', error.message || '파일 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [saveToDevice]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>파일 저장소</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSaveFile}
                    disabled={loading}
                >
                    <Icon name="download" size={24} color="#fff" />
                    <Text style={styles.buttonText}>파일 저장하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={openFile}
                    disabled={loading}
                >
                    <Icon name="folder" size={24} color="#fff" />
                    <Text style={styles.buttonText}>파일 열기</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        gap: 20
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 8,
        gap: 10
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default DeviceStorageScreen;