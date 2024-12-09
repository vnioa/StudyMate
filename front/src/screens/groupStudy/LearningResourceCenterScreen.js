import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../api/api';

const LearningResourceCenterScreen = ({ navigation }) => {
    const [resources, setResources] = useState({
        courses: [],
        externalLinks: [],
        trends: [],
        portfolios: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchResources = async () => {
        try {
            setError(null);
            const [
                coursesResponse,
                linksResponse,
                trendsResponse,
                portfoliosResponse
            ] = await Promise.all([
                axios.get('/api/learning/courses'),
                axios.get('/api/learning/external-links'),
                axios.get('/api/learning/trends'),
                axios.get('/api/learning/portfolios')
            ]);

            setResources({
                courses: coursesResponse.data,
                externalLinks: linksResponse.data,
                trends: trendsResponse.data,
                portfolios: portfoliosResponse.data
            });
        } catch (err) {
            setError('리소스를 불러오는데 실패했습니다.');
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchResources();
    }, []);

    const handleSectionPress = (sectionType) => {
        navigation.navigate('ResourceDetail', { type: sectionType, data: resources[sectionType] });
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
                <Text style={styles.headerTitle}>학습 리소스 센터</Text>
                <Pressable
                    onPress={onRefresh}
                    style={styles.refreshButton}
                >
                    <Icon name="refresh-cw" size={20} color="#333" />
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('courses')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="video" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>온라인 강의 목록 및 추천</Text>
                            </View>
                            <Text style={styles.sectionCount}>
                                {resources.courses.length}개의 강의
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('externalLinks')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="link" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>외부 학습 리소스</Text>
                            </View>
                            <Text style={styles.sectionCount}>
                                {resources.externalLinks.length}개의 리소스
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('trends')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="trending-up" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>교육 트렌드 및 뉴스</Text>
                            </View>
                            <Text style={styles.sectionCount}>
                                {resources.trends.length}개의 소식
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.section}
                            onPress={() => handleSectionPress('portfolios')}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="folder" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>그룹 학습 포트폴리오</Text>
                            </View>
                            <Text style={styles.sectionCount}>
                                {resources.portfolios.length}개의 포트폴리오
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    refreshButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    section: {
        marginBottom: 15,
        padding: 15,
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
    sectionCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    }
});

export default LearningResourceCenterScreen;