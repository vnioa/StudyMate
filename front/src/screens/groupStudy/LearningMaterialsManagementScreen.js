import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../api/api';

const LearningMaterialsManagementScreen = ({ navigation }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/learning-materials');
            setMaterials(response.data);
        } catch (err) {
            setError('학습 자료를 불러오는데 실패했습니다.');
            Alert.alert('오류', '학습 자료를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAndTag = async () => {
        try {
            const response = await axios.post('/api/materials/upload', {
                // 업로드 데이터
            });
            Alert.alert('성공', '자료가 업로드되었습니다.');
            fetchMaterials(); // 목록 새로고침
        } catch (error) {
            Alert.alert('오류', '자료 업로드에 실패했습니다.');
        }
    };

    const handleAdvancedSearch = async (searchParams) => {
        try {
            setLoading(true);
            const response = await axios.get('/api/materials/search', {
                params: searchParams
            });
            setMaterials(response.data);
        } catch (error) {
            Alert.alert('오류', '검색에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleShareAndCollaborate = async (materialId) => {
        try {
            const response = await axios.post('/api/materials/share', {
                materialId,
                // 공유 설정
            });
            Alert.alert('성공', '자료가 공유되었습니다.');
        } catch (error) {
            Alert.alert('오류', '자료 공유에 실패했습니다.');
        }
    };

    const handleVersionControl = async (materialId, version) => {
        try {
            const response = await axios.post('/api/materials/version', {
                materialId,
                version
            });
            Alert.alert('성공', '버전이 업데이트되었습니다.');
            fetchMaterials();
        } catch (error) {
            Alert.alert('오류', '버전 관리에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 자료 관리</Text>
                <Pressable
                    onPress={fetchMaterials}
                    style={styles.refreshButton}
                >
                    <Icon name="refresh-cw" size={20} color="#333" />
                </Pressable>
            </View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <ScrollView>
                    <Pressable
                        style={styles.section}
                        onPress={handleUploadAndTag}
                    >
                        <Icon name="upload" size={20} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>자료 업로드 및 분류</Text>
                    </Pressable>

                    <Pressable
                        style={styles.section}
                        onPress={handleAdvancedSearch}
                    >
                        <Icon name="search" size={20} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>고급 검색 및 필터링</Text>
                    </Pressable>

                    <Pressable
                        style={styles.section}
                        onPress={handleShareAndCollaborate}
                    >
                        <Icon name="share-2" size={20} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>자료 공유 및 협업</Text>
                    </Pressable>

                    <Pressable
                        style={styles.section}
                        onPress={handleVersionControl}
                    >
                        <Icon name="git-branch" size={20} color="#4A90E2" />
                        <Text style={styles.sectionTitle}>자료 버전 관리</Text>
                    </Pressable>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        marginTop: 40,
    },
    backButton: {
        padding: 5,
    },
    refreshButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 15,
        color: '#333',
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default LearningMaterialsManagementScreen;