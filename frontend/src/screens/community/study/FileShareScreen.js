import React, { useState, useEffect } from 'react';
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
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fileAPI } from '../../../services/api';

const FileShareScreen = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await fileAPI.getFiles();
            setFiles(response.data);
            setFilteredFiles(response.data);
        } catch (error) {
            Alert.alert('오류', '파일 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFiles();
        setRefreshing(false);
    };

    const filterFiles = async (type) => {
        try {
            if (type === 'All') {
                setFilteredFiles(files);
            } else {
                const response = await fileAPI.filterFilesByType(type);
                setFilteredFiles(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '파일 필터링에 실패했습니다.');
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        try {
            if (query.trim()) {
                const response = await fileAPI.searchFiles(query);
                setFilteredFiles(response.data);
            } else {
                setFilteredFiles(files);
            }
        } catch (error) {
            Alert.alert('오류', '파일 검색에 실패했습니다.');
        }
    };

    const toggleFileSharing = async (fileId, currentStatus) => {
        try {
            await fileAPI.updateFileSharing(fileId, !currentStatus);
            const updatedFiles = files.map(file =>
                file.id === fileId ? { ...file, isShared: !currentStatus } : file
            );
            setFiles(updatedFiles);
            setFilteredFiles(updatedFiles);
        } catch (error) {
            Alert.alert('오류', '공유 설정 변경에 실패했습니다.');
        }
    };

    const setFileExpiry = async (fileId, date) => {
        try {
            await fileAPI.setFileExpiry(fileId, date.toISOString());
            const updatedFiles = files.map(file =>
                file.id === fileId ? { ...file, expiryDate: date.toISOString().split('T')[0] } : file
            );
            setFiles(updatedFiles);
            setFilteredFiles(updatedFiles);
        } catch (error) {
            Alert.alert('오류', '만료일 설정에 실패했습니다.');
        }
        setShowDatePicker(false);
    };

    const renderFileItem = ({ item }) => (
        <View style={styles.fileItem}>
            <TouchableOpacity
                style={styles.fileInfo}
                onPress={() => openFilePreview(item)}
            >
                {renderFileIcon(item.type)}
                <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{item.name}</Text>
                    <Text style={styles.fileMetadata}>
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
                <Switch
                    value={item.isShared}
                    onValueChange={() => toggleFileSharing(item.id, item.isShared)}
                />
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        setSelectedFile(item);
                        setShowDatePicker(true);
                    }}
                >
                    <Icon name="clock" size={20} color="#4A90E2" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>공유 파일</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="파일 검색"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            <View style={styles.filterContainer}>
                {['All', 'PDF', 'Image', 'Video'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => filterFiles(type)}
                        style={styles.filterButton}
                    >
                        <Text style={styles.filterText}>
                            {type === 'All' ? '전체' : type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.fileItem}>
                        <TouchableOpacity
                            style={styles.fileInfo}
                            onPress={() => handleFileItemPress(item)}
                        >
                            {renderFileIcon(item.type)}
                            <View style={styles.fileDetails}>
                                <Text style={styles.fileName}>{item.name}</Text>
                                <Text style={styles.fileMetadata}>
                                    {item.size} • {item.date}
                                </Text>
                                {item.expiryDate && (
                                    <Text style={styles.expiryDate}>만료: {item.expiryDate}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                        <View style={styles.fileActions}>
                            <Switch
                                value={item.isShared}
                                onValueChange={() => toggleFileSharing(item.id)}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedFile(item);
                                    setShowDatePicker(true);
                                }}
                                style={styles.actionButton}
                            >
                                <Icon name="clock" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                style={styles.fileList}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <Icon name="x" size={24} color="#333" />
                        </TouchableOpacity>
                        {selectedFile && (
                            <>
                                <Image source={{ uri: selectedFile.preview }} style={styles.previewImage} />
                                <Text style={styles.fileName}>{selectedFile.name}</Text>
                                <Text style={styles.fileMetadata}>
                                    {selectedFile.size} • {selectedFile.date}
                                </Text>
                            </>
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
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                paddingTop: 44,
            },
            android: {
                paddingTop: StatusBar.currentHeight,
            },
        }),
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 20,
        marginRight: 8,
    },
    filterText: {
        color: '#fff',
        fontWeight: '500',
    },
    fileList: {
        flex: 1,
    },
    fileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fileDetails: {
        marginLeft: 12,
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    fileMetadata: {
        fontSize: 14,
        color: '#666',
    },
    fileActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    expiryDate: {
        fontSize: 12,
        color: '#FF5252',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    previewImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center'
    },
    errorText: {
        color: '#FF5252',
        marginTop: 10
    },
    refreshButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#4A90E2',
        borderRadius: 5
    },
    refreshButtonText: {
        color: '#fff'
    }
});

export default FileShareScreen;