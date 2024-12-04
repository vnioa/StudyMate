import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { levelAPI } from '../../services/api';

const LevelDetailScreen = ({ navigation }) => {
    const [levelInfo, setLevelInfo] = useState(null);
    const [levelStats, setLevelStats] = useState(null);
    const [requirements, setRequirements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchLevelData = async () => {
        try {
            setError(null);
            const [infoRes, statsRes, reqRes] = await Promise.all([
                levelAPI.getLevelInfo(),
                levelAPI.getLevelStats(),
                levelAPI.getLevelRequirements()
            ]);

            setLevelInfo(infoRes.data);
            setLevelStats(statsRes.data);
            setRequirements(reqRes.data);
        } catch (err) {
            setError('데이터를 불러오는데 실패했습니다.');
            console.error('Level data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLevelData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchLevelData();
    }, []);

    const calculateProgress = (current, total) => {
        return (current / total * 100).toFixed(0) + '%';
    };

    // 경험치 획득 함수
    // api에 획득 요소들 추가 필요
    const handleGainExperience = async (amount, type) => {
        try {
            const response = await levelAPI.gainExperience({
                amount,
                type
            });

            if (response.success) {
                // 경험치 획득 성공 시 레벨 데이터 새로고침
                await fetchLevelData();
                
                if (response.levelUp) {
                    Alert.alert('축하합니다!', '레벨업을 달성했습니다!');
                }
            }
        } catch (error) {
            Alert.alert('오류', '경험치 획득에 실패했습니다');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchLevelData}
                >
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#2196F3"]}
                />
            }
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>레벨 정보</Text>
            </View>

            {levelInfo && (
                <View style={styles.currentLevelCard}>
                    <Text style={styles.cardTitle}>현재 레벨</Text>
                    <View style={styles.levelInfo}>
                        <Text style={styles.levelNumber}>{levelInfo.currentLevel}</Text>
                        <Text style={styles.levelText}>레벨</Text>
                    </View>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progress,
                                { width: calculateProgress(levelInfo.currentXP, levelInfo.nextLevelXP) }
                            ]} />
                        </View>
                        <Text style={styles.progressText}>
                            다음 레벨까지 {levelInfo.nextLevelXP - levelInfo.currentXP}XP
                        </Text>
                    </View>
                </View>
            )}

            {levelStats && (
                <View style={styles.statsCard}>
                    <Text style={styles.cardTitle}>레벨 통계</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{levelStats.totalXP.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>총 획득 XP</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{levelStats.studyStreak}</Text>
                            <Text style={styles.statLabel}>연속 학습일</Text>
                        </View>
                    </View>
                </View>
            )}

            {requirements && (
                <View style={styles.levelRequirementsCard}>
                    <Text style={styles.cardTitle}>다음 레벨 달성 조건</Text>
                    {requirements.map((req, index) => (
                        <View key={index} style={styles.requirementItem}>
                            <View style={styles.requirementProgress}>
                                <Text style={styles.requirementText}>{req.name}</Text>
                                <Text style={styles.requirementValue}>
                                    {req.current}/{req.required} {req.unit}
                                </Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[
                                    styles.progress,
                                    { width: calculateProgress(req.current, req.required) }
                                ]} />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 10,
        position: 'absolute',
        left: 10,
        zIndex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    currentLevelCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
    },
    levelInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 15,
    },
    levelNumber: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    levelText: {
        fontSize: 16,
        marginLeft: 5,
        marginBottom: 8,
    },
    progressContainer: {
        marginTop: 10,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
    progress: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    statsCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    levelRequirementsCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    requirementItem: {
        marginBottom: 15,
    },
    requirementProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 14,
        color: '#333',
    },
    requirementValue: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ff4444',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default LevelDetailScreen;