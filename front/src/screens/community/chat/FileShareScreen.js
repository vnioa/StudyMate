import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    Platform,
    StatusBar,
    Image,
    Switch,
    ActivityIndicator,
    Alert,
    WebView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../../api/api';
const FileShareScreen = ({ navigation, route }) => {
    const { roomId } = route.params;
    const [searchQuery, setSearchQuery] = useState('');
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchFiles = async () => {
        if (!(await checkNetwork())) {
            const cachedFiles = await AsyncStorage.getItem(`files_${roomId}`);
            if (cachedFiles) {
                const parsed = JSON.parse(cachedFiles);
                setFiles(parsed);
                setFilteredFiles(parsed);
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/chat/rooms/${roomId}/files`);
            if (response.data.success) {
                setFiles(response.data.files);
                setFilteredFiles(response.data.files);
                await AsyncStorage.setItem(`files_${roomId}`, JSON.stringify(response.data.files));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '파일 목록을 불러오는데 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    const handleRefresh = async () => {
        if (!(await checkNetwork())) return;
        setRefreshing(true);
        await fetchFiles();
        setRefreshing(false);
    };

    const filterFiles = async (type) => {
        if (!(await checkNetwork())) return;

        try {
            if (type === 'All') {
                setFilteredFiles(files);
                return;
            }

            const filtered = files.filter(file => {
                switch (type.toLowerCase()) {
                    case 'pdf':
                        return file.type.toLowerCase().includes('pdf');
                    case 'image':
                        return file.type.toLowerCase().startsWith('image/');
                    case 'video':
                        return file.type.toLowerCase().startsWith('video/');
                    default:
                        return true;
                }
            });
            
            setFilteredFiles(filtered);

            // 필터 적용 시 검색어 초기화
            setSearchQuery('');
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '파일 필터링에 실패했습니다.'
            );
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!(await checkNetwork())) return;

        try {
            if (query.trim()) {
                const response = await api.get(`/api/files/search?query=${query}`);
                if (response.data.success) {
                    setFilteredFiles(response.data.files);
                }
            } else {
                setFilteredFiles(files);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '파일 검색에 실패했습니다.'
            );
        }
    };

    const toggleFileSharing = async (fileId, currentStatus) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/files/${fileId}/share`, {
                isShared: !currentStatus
            });

            if (response.data.success) {
                const updatedFiles = files.map(file =>
                    file.id === fileId ? { ...file, isShared: !currentStatus } : file
                );
                setFiles(updatedFiles);
                setFilteredFiles(updatedFiles);
                await AsyncStorage.setItem('files', JSON.stringify(updatedFiles));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '공유 설정 변경에 실패했습니다.'
            );
        }
    };

    const setFileExpiry = async (fileId, date) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/files/${fileId}/expiry`, {
                expiryDate: date.toISOString()
            });

            if (response.data.success) {
                const updatedFiles = files.map(file =>
                    file.id === fileId ? {
                        ...file,
                        expiryDate: date.toISOString().split('T')[0]
                    } : file
                );
                setFiles(updatedFiles);
                setFilteredFiles(updatedFiles);
                await AsyncStorage.setItem('files', JSON.stringify(updatedFiles));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '만료일 설정에 실패했습니다.'
            );
        } finally {
            setShowDatePicker(false);
        }
    };

    const handleFilePreview = async (file) => {
        if (!(await checkNetwork())) return;

        try {
            setPreviewLoading(true);
            setSelectedFile(file);
            setModalVisible(true);

            const response = await api.get(`/api/files/${file.id}/preview`);
            if (response.data.success) {
                setSelectedFile(prev => ({
                    ...prev,
                    previewUrl: response.data.url,
                    previewType: response.data.type
                }));
            }
        } catch (error) {
            Alert.alert('오류', '파일 미리보기를 불러오는데 실패했습니다.');
            setModalVisible(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleFileDelete = async (fileId) => {
        if (!(await checkNetwork())) return;

        Alert.alert(
            '파일 삭제',
            '정말 이 파일을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.delete(`/api/files/${fileId}`);
                            if (response.data.success) {
                                const updatedFiles = files.filter(file => file.id !== fileId);
                                setFiles(updatedFiles);
                                setFilteredFiles(updatedFiles);
                                await AsyncStorage.setItem('files',
                                    JSON.stringify(updatedFiles));
                                Alert.alert('성공', '파일이 삭제되었습니다.');
                            }
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                error.response?.data?.message || '파일 삭제에 실패했습니다.'
                            );
                        }
                    }
                }
            ]
        );
    };

    const renderFileIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'pdf':
                return <Icon name="file-text" size={24} color={theme.colors.primary} />;
            case 'image':
                return <Icon name="image" size={24} color={theme.colors.success} />;
            case 'video':
                return <Icon name="video" size={24} color={theme.colors.warning} />;
            default:
                return <Icon name="file" size={24} color={theme.colors.textSecondary} />;
        }
    };

    const renderFileItem = ({ item }) => (
        <View style={[
            styles.fileItem,
            !isOnline && styles.fileItemDisabled
        ]}>
            <TouchableOpacity
                style={styles.fileInfo}
                onPress={() => handleFilePreview(item)}
                disabled={!isOnline}
            >
                {renderFileIcon(item.type)}
                <View style={styles.fileDetails}>
                    <Text style={[
                        styles.fileName,
                        !isOnline && styles.textDisabled
                    ]}>{item.name}</Text>
                    <Text style={[
                        styles.fileMetadata,
                        !isOnline && styles.textDisabled
                    ]}>
                        {item.size} • {item.date}
                    </Text>
                    {item.expiryDate && (
                        <Text style={styles.expiryDate}>
                            만료: {item.expiryDate}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
            <View style={styles.fileActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleFileDelete(item.id)}
                    disabled={!isOnline}
                >
                    <Icon
                        name="trash-2"
                        size={20}
                        color={isOnline ? theme.colors.error : theme.colors.textDisabled}
                    />
                </TouchableOpacity>
                <Switch
                    value={item.isShared}
                    onValueChange={() => toggleFileSharing(item.id, item.isShared)}
                    disabled={!isOnline}
                />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setSelectedFile(item);
                        setShowDatePicker(true);
                    }}
                    disabled={!isOnline}
                >
                    <Icon
                        name="clock"
                        size={20}
                        color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPreviewContent = () => {
        if (!selectedFile) return null;

        if (previewLoading) {
            return <ActivityIndicator size="large" color={theme.colors.primary} />;
        }

        switch (selectedFile.previewType) {
            case 'image':
                return (
                    <Image
                        source={{ uri: selectedFile.previewUrl }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                );
            case 'pdf':
                return (
                    <WebView
                        source={{ uri: selectedFile.previewUrl }}
                        style={styles.previewPdf}
                    />
                );
            default:
                return (
                    <Text style={styles.noPreviewText}>
                        미리보기를 지원하지 않는 파일 형식입니다.
                    </Text>
                );
        }
    };

    const getFilterButtonStyle = (type) => {
        const currentFilter = filteredFiles.length < files.length ? type : 'All';
        return [
            styles.filterButton,
            !isOnline && styles.filterButtonDisabled,
            currentFilter === type && styles.filterButtonActive
        ];
    };

    const getFilterTextStyle = (type) => {
        const currentFilter = filteredFiles.length < files.length ? type : 'All';
        return [
            styles.filterText,
            !isOnline && styles.textDisabled,
            currentFilter === type && styles.filterTextActive
        ];
    };

    if (loading && !files.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>채팅방 공유 파일</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                    style={[
                        styles.searchInput,
                        !isOnline && styles.inputDisabled
                    ]}
                    placeholder="파일 검색"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    editable={isOnline}
                />
            </View>

            <View style={styles.filterContainer}>
                {['All', 'PDF', 'Image', 'Video'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => filterFiles(type)}
                        style={getFilterButtonStyle(type)}
                        disabled={!isOnline}
                    >
                        <Text style={getFilterTextStyle(type)}>
                            {type === 'All' ? '전체' : type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={renderFileItem}
                style={styles.fileList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Icon name="x" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                        {renderPreviewContent()}
                        {selectedFile && (
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>
                                    {selectedFile.name}
                                </Text>
                                <Text style={styles.fileMetadata}>
                                    {selectedFile.size} • {selectedFile.date}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        if (date) setFileExpiry(selectedFile.id, date);
                        setShowDatePicker(false);
                    }}
                    minimumDate={new Date()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    filterButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.large,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterButtonDisabled: {
        backgroundColor: theme.colors.disabled,
        borderColor: theme.colors.disabled,
    },
    filterText: {
        color: theme.colors.text,
        ...theme.typography.bodyMedium,
        fontWeight: '500',
    },
    filterTextActive: {
        color: theme.colors.white,
    },
    fileList: {
        flex: 1,
    },
    fileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    fileItemDisabled: {
        opacity: 0.5,
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fileDetails: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    fileName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: 4,
    },
    fileMetadata: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    fileActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    actionButton: {
        padding: theme.spacing.sm,
    },
    expiryDate: {
        ...theme.typography.bodySmall,
        color: theme.colors.error,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.large,
        width: '90%',
        maxHeight: '80%',
        ...Platform.select({
            ios: theme.shadows.large,
            android: { elevation: 5 }
        }),
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: theme.spacing.sm,
    },
    previewImage: {
        width: '100%',
        height: 300,
        marginVertical: theme.spacing.md,
    },
    previewPdf: {
        width: '100%',
        height: 400,
        marginVertical: theme.spacing.md,
    },
    noPreviewText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginVertical: theme.spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    }
});

export default FileShareScreen;