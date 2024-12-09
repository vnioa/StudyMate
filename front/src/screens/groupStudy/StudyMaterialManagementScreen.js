import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const StudyMaterialManagementScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchMaterialStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/groups/${groupId}/study-materials/stats`);
            setStats(response.data);
        } catch (error) {
            setError('통계 데이터를 불러오는데 실패했습니다.');
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMaterialStats();
            return () => setStats(null);
        }, [fetchMaterialStats])
    );

    const handleSectionPress = useCallback((section) => {
        const routes = {
            upload: 'MaterialUpload',
            search: 'MaterialSearch',
            share: 'MaterialShare',
            version: 'MaterialVersion'
        };
        navigation.navigate(routes[section], { groupId });
    }, [navigation, groupId]);

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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 자료 관리</Text>
                <Pressable
                    onPress={fetchMaterialStats}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="refresh-cw" size={20} color="#333" />
                </Pressable>
            </View>

            <ScrollView style={styles.content}>
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('upload')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="upload" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>자료 업로드 및 분류</Text>
                            </View>
                            <Text style={styles.sectionContent}>
                                {stats?.uploadCount || 0}개의 자료가 업로드됨
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('search')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="search" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>고급 검색 및 필터링</Text>
                            </View>
                            <Text style={styles.sectionContent}>
                                {stats?.totalFiles || 0}개의 검색 가능한 자료
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('share')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="share-2" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>자료 공유 및 협업</Text>
                            </View>
                            <Text style={styles.sectionContent}>
                                {stats?.sharedFiles || 0}개의 공유된 자료
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('version')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="git-branch" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>자료 버전 관리</Text>
                            </View>
                            <Text style={styles.sectionContent}>
                                {stats?.versionedFiles || 0}개의 버전 관리 중인 자료
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 15,
        padding: 20,
        borderRadius: 8,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
        color: '#333',
    },
    sectionContent: {
        fontSize: 14,
        color: '#666',
        marginLeft: 30,
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    }
});

export default StudyMaterialManagementScreen;