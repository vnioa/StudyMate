// src/screens/chat/FileShareScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date, file } from '../../utils/helpers';
import api from '../../services/api';

export default function FileShareScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { roomId } = route.params;

    // 상태 관리
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    // 파일 목록 로드
    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const response = await api.chat.getFiles(roomId);
            setFiles(response);
        } catch (error) {
            Alert.alert('오류', '파일 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    // 파일 선택 및 업로드
    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: true
            });

            if (result.type === 'success') {
                const fileInfo = {
                    uri: result.uri,
                    name: result.name,
                    size: result.size,
                    type: result.mimeType
                };

                if (fileInfo.size > 100 * 1024 * 1024) { // 100MB 제한
                    Alert.alert('오류', '파일 크기는 100MB를 초과할 수 없습니다.');
                    return;
                }

                await uploadFile(fileInfo);
            }
        } catch (error) {
            Alert.alert('오류', '파일 선택에 실패했습니다.');
        }
    };

    // 파일 업로드
    const uploadFile = async (fileInfo) => {
        try {
            setUploading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const formData = new FormData();
            formData.append('file', {
                uri: fileInfo.uri,
                name: fileInfo.name,
                type: fileInfo.type
            });

            const response = await api.chat.uploadFile(roomId, formData, (progress) => {
                setUploadProgress(progress);
            });

            setFiles(prev => [response, ...prev]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '파일 업로드에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // 파일 다운로드
    const handleDownload = async (fileUrl, fileName) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const callback = downloadProgress => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                // 다운로드 진행률 표시 로직
            };

            const downloadResumable = FileSystem.createDownloadResumable(
                fileUrl,
                FileSystem.documentDirectory + fileName,
                {},
                callback
            );

            const { uri } = await downloadResumable.downloadAsync();

            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                // Android에서는 다운로드 완료 알림
                Alert.alert('완료', '파일이 다운로드 되었습니다.');
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '파일 다운로드에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 파일 삭제
    const handleDelete = async (fileIds) => {
        Alert.alert(
            '파일 삭제',
            `선택한 ${fileIds.length}개의 파일을 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(fileIds.map(id => api.chat.deleteFile(roomId, id)));
                            setFiles(prev => prev.filter(file => !fileIds.includes(file.id)));
                            setSelectedFiles(new Set());
                            setIsSelectMode(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '파일 삭제에 실패했습니다.');
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }
                }
            ]
        );
    };

    // 파일 선택 모드 토글
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedFiles(new Set());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 파일 선택/해제
    const toggleFileSelection = (fileId) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 파일 아이템 렌더링
    const renderFileItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.fileItem,
                isSelectMode && selectedFiles.has(item.id) && styles.selectedFile
            ]}
            onPress={() => isSelectMode ? toggleFileSelection(item.id) : handleDownload(item.url, item.name)}
            onLongPress={() => {
                if (!isSelectMode) {
                    toggleSelectMode();
                    toggleFileSelection(item.id);
                }
            }}
        >
            <View style={styles.fileIcon}>
                <Ionicons
                    name={getFileIcon(item.type)}
                    size={24}
                    color={theme.colors.primary.main}
                />
            </View>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.fileDetail}>
                    {file.formatFileSize(item.size)} • {date.formatRelative(item.createdAt)}
                </Text>
                {item.uploadedBy && (
                    <Text style={styles.fileUploader}>
                        업로더: {item.uploadedBy.name}
                    </Text>
                )}
            </View>
            {isSelectMode ? (
                <Ionicons
                    name={selectedFiles.has(item.id) ? "checkbox" : "square-outline"}
                    size={24}
                    color={theme.colors.primary.main}
                />
            ) : (
                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(item.url, item.name)}
                >
                    <Ionicons
                        name="download-outline"
                        size={24}
                        color={theme.colors.primary.main}
                    />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    // 파일 타입별 아이콘
    const getFileIcon = (type) => {
        if (type.includes('image')) return 'image-outline';
        if (type.includes('video')) return 'videocam-outline';
        if (type.includes('audio')) return 'musical-notes-outline';
        if (type.includes('pdf')) return 'document-text-outline';
        return 'document-outline';
    };

    // 헤더 설정
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRight}>
                    {isSelectMode ? (
                        <>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => handleDelete(Array.from(selectedFiles))}
                                disabled={selectedFiles.size === 0}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={24}
                                    color={selectedFiles.size === 0
                                        ? theme.colors.text.disabled
                                        : theme.colors.status.error
                                    }
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={toggleSelectMode}
                            >
                                <Text style={styles.cancelText}>취소</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={toggleSelectMode}
                        >
                            <Ionicons
                                name="checkbox-outline"
                                size={24}
                                color={theme.colors.primary.main}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            ),
        });
    }, [navigation, isSelectMode, selectedFiles]);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={files}
                renderItem={renderFileItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.fileList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="document-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>공유된 파일이 없습니다</Text>
                    </View>
                }
            />

            {uploading && (
                <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary.main} />
                    <Text style={styles.uploadingText}>
                        업로드 중... {uploadProgress}%
                    </Text>
                </View>
            )}

            {!isSelectMode && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleFilePick}
                    disabled={uploading}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: theme.spacing.md,
    },
    headerButton: {
        padding: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    cancelText: {
        fontSize: theme.typography.size.body1,
        color: theme.colors.primary.main,
        fontFamily: theme.typography.fontFamily.medium,
    },
    fileList: {
        padding: theme.spacing.md,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    selectedFile: {
        backgroundColor: theme.colors.primary.main + '20',
    },
    fileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    fileInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    fileName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    fileDetail: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    fileUploader: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    downloadButton: {
        padding: theme.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl * 2,
    },
    emptyText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    uploadingText: {
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg + (Platform.OS === 'ios' ? 20 : 0),
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    progressBar: {
        height: 3,
        backgroundColor: theme.colors.primary.main,
        position: 'absolute',
        left: 0,
        bottom: 0,
    },
    headerTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    selectedCount: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
    }
});