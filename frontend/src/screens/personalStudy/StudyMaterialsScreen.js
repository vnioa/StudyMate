import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as DocumentPicker from 'expo-document-picker';
import { materialsAPI } from '../../services/api';

const StudyMaterialsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isUploadModalVisible, setUploadModalVisible] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        title: '',
        description: '',
        tags: [],
        version: '1.0',
        shared: false,
        file: null
    });

    const availableTags = [
        '프로그래밍', '디자인', '마케팅', '비즈니스',
        '개인 프로젝트', '팀 프로젝트', '참고 자료', '과제'
    ];

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await materialsAPI.getMaterials();
            if (response.data) {
                setMaterials(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '학습 자료를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!newMaterial.title.trim()) {
            Alert.alert('알림', '자료 제목을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();

            Object.keys(newMaterial).forEach(key => {
                if (key === 'file' && newMaterial.file) {
                    formData.append('file', {
                        uri: newMaterial.file.uri,
                        type: newMaterial.file.mimeType,
                        name: newMaterial.file.name
                    });
                } else {
                    formData.append(key, newMaterial[key]);
                }
            });

            const response = await materialsAPI.uploadMaterial(formData);
            if (response.data.success) {
                setMaterials(prev => [response.data.material, ...prev]);
                setUploadModalVisible(false);
                resetNewMaterial();
                Alert.alert('성공', '자료가 업로드되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '자료 업로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });

            if (result.type === 'success') {
                setNewMaterial(prev => ({ ...prev, file: result }));
            }
        } catch (error) {
            Alert.alert('오류', '파일 선택에 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            '자료 삭제',
            '정말 이 자료를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await materialsAPI.deleteMaterial(id);
                            setMaterials(prev => prev.filter(item => item.id !== id));
                            Alert.alert('성공', '자료가 삭제되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', '자료 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async (item) => {
        try {
            await materialsAPI.shareMaterial(item.id);
            Alert.alert('성공', '자료가 공유되었습니다.');
            await fetchMaterials();
        } catch (error) {
            Alert.alert('오류', '자료 공유에 실패했습니다.');
        }
    };

    const handleVersionUpdate = async (item) => {
        try {
            const response = await materialsAPI.updateVersion(item.id);
            if (response.data.success) {
                await fetchMaterials();
                Alert.alert('성공', '버전이 업데이트되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '버전 업데이트에 실패했습니다.');
        }
    };

    const resetNewMaterial = () => {
        setNewMaterial({
            title: '',
            description: '',
            tags: [],
            version: '1.0',
            shared: false,
            file: null
        });
    };

    const filteredMaterials = materials.filter(material => {
        const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            material.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 ||
            selectedTags.every(tag => material.tags.includes(tag));
        return matchesSearch && matchesTags;
    });

    const renderMaterialItem = ({ item }) => (
        <Pressable
            style={styles.materialItem}
            onPress={() => navigation.navigate('StudyMaterialDetail', { materialId: item.id })}
        >
            <View style={styles.materialInfo}>
                <Text style={styles.materialTitle}>{item.title}</Text>
                <Text style={styles.materialDescription}>{item.description}</Text>
                <View style={styles.tagContainer}>
                    {item.tags.map(tag => (
                        <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.materialActions}>
                <Pressable onPress={() => handleShare(item)}>
                    <Icon name="share-2" size={20} color="#666" />
                </Pressable>
                <Pressable onPress={() => handleVersionUpdate(item)}>
                    <Icon name="git-branch" size={20} color="#666" />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)}>
                    <Icon name="trash-2" size={20} color="#666" />
                </Pressable>
            </View>
        </Pressable>
    );

    if (loading && !materials.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 자료</Text>
                <Pressable onPress={() => setUploadModalVisible(true)}>
                    <Icon name="plus" size={24} color="#333" />
                </Pressable>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="자료 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                horizontal
                style={styles.tagsScrollView}
                showsHorizontalScrollIndicator={false}
            >
                {availableTags.map(tag => (
                    <Pressable
                        key={tag}
                        style={[
                            styles.tagChoice,
                            selectedTags.includes(tag) && styles.tagChoiceSelected
                        ]}
                        onPress={() => {
                            setSelectedTags(prev =>
                                prev.includes(tag)
                                    ? prev.filter(t => t !== tag)
                                    : [...prev, tag]
                            );
                        }}
                    >
                        <Text
                            style={[
                                styles.tagChoiceText,
                                selectedTags.includes(tag) && styles.tagChoiceTextSelected
                            ]}
                        >
                            {tag}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <FlatList
                data={filteredMaterials}
                renderItem={renderMaterialItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.materialsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchMaterials}
                        colors={['#4A90E2']}
                    />
                }
            />

            <Modal
                visible={isUploadModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>새 자료 추가</Text>
                            <Pressable onPress={() => setUploadModalVisible(false)}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <ScrollView>
                            <TextInput
                                style={styles.input}
                                placeholder="자료 제목"
                                value={newMaterial.title}
                                onChangeText={(text) => setNewMaterial({...newMaterial, title: text})}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="자료 설명"
                                value={newMaterial.description}
                                onChangeText={(text) => setNewMaterial({...newMaterial, description: text})}
                                multiline
                            />

                            <Text style={styles.label}>태그 선택</Text>
                            <ScrollView
                                horizontal
                                style={styles.tagsScrollView}
                                showsHorizontalScrollIndicator={false}
                            >
                                {availableTags.map(tag => (
                                    <Pressable
                                        key={tag}
                                        style={[
                                            styles.tagChoice,
                                            newMaterial.tags.includes(tag) && styles.tagChoiceSelected
                                        ]}
                                        onPress={() => {
                                            setNewMaterial(prev => ({
                                                ...prev,
                                                tags: prev.tags.includes(tag)
                                                    ? prev.tags.filter(t => t !== tag)
                                                    : [...prev.tags, tag]
                                            }));
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.tagChoiceText,
                                                newMaterial.tags.includes(tag) && styles.tagChoiceTextSelected
                                            ]}
                                        >
                                            {tag}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            <Pressable
                                style={styles.filePickerButton}
                                onPress={handleFilePick}
                            >
                                <Icon name="file-plus" size={20} color="#666" />
                                <Text style={styles.filePickerText}>
                                    파일 선택
                                </Text>
                            </Pressable>

                            {newMaterial.file && (
                                <Text style={styles.selectedFileName}>
                                    선택된 파일: {newMaterial.file.name}
                                </Text>
                            )}

                            <Pressable
                                style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
                                onPress={handleAddMaterial}
                                disabled={loading}
                            >
                                <Text style={styles.uploadButtonText}>
                                    {loading ? '업로드 중...' : '추가하기'}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchSection: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        marginLeft: 8,
    },
    materialsList: {
        padding: 16,
    },
    materialItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    materialInfo: {
        flex: 1,
    },
    materialTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    materialDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 14,
        color: '#666',
    },
    materialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    tagsScrollView: {
        marginBottom: 16,
    },
    tagChoice: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    tagChoiceSelected: {
        backgroundColor: '#4A90E2',
    },
    tagChoiceText: {
        color: '#666',
    },
    tagChoiceTextSelected: {
        color: '#fff',
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    filePickerText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    selectedFileName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    uploadButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    uploadButtonDisabled: {
        opacity: 0.5,
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default StudyMaterialsScreen;