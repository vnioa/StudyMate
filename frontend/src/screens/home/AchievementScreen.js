import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { achievementAPI } from '../../services/api';

const AchievementScreen = () => {
    const navigation = useNavigation();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        acquired: 0,
        total: 0
    });

    const fetchAchievements = async () => {
        try {
            const response = await achievementAPI.getAchievements();
            setAchievements(response.data.achievements);
            setStats({
                acquired: response.data.stats.acquired,
                total: response.data.stats.total
            });
        } catch (error) {
            console.error('업적 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAchievements();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.buttonPressed
                    ]}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>성취 뱃지</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#2196F3"]}
                    />
                }
            >
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>획득한 뱃지</Text>
                    <Text style={styles.summaryCount}>{stats.acquired}개</Text>
                    <Text style={styles.summarySubtext}>전체 {stats.total}개 중</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${(stats.acquired / stats.total) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.badgeList}>
                    {achievements.map(badge => (
                        <Pressable
                            key={badge.id}
                            onPress={() => navigation.navigate('AchievementDetail', { achievementId: badge.id })}
                            style={({ pressed }) => [
                                styles.badgeItem,
                                pressed && styles.badgePressed
                            ]}
                        >
                            <View style={[
                                styles.iconContainer,
                                !badge.acquired && styles.inactiveIcon
                            ]}>
                                <Icon
                                    name={badge.icon}
                                    size={24}
                                    color={badge.acquired ? '#2196F3' : '#9E9E9E'}
                                />
                            </View>
                            <View style={styles.badgeInfo}>
                                <Text style={styles.badgeTitle}>{badge.title}</Text>
                                <Text style={styles.badgeDescription}>{badge.description}</Text>
                                {badge.acquired ? (
                                    <Text style={styles.badgeDate}>획득일: {badge.date}</Text>
                                ) : (
                                    <View style={styles.progressContainer}>
                                        <View style={styles.miniProgressBar}>
                                            <View
                                                style={[
                                                    styles.miniProgressFill,
                                                    { width: badge.progress }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.badgeProgress}>{badge.progress}</Text>
                                    </View>
                                )}
                            </View>
                            {badge.acquired && (
                                <Icon name="check" size={20} color="#4CAF50" />
                            )}
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    summaryCount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    summarySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    badgeList: {
        padding: 15,
    },
    badgeItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    inactiveIcon: {
        backgroundColor: '#F5F5F5',
    },
    badgeInfo: {
        flex: 1,
    },
    badgeTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    badgeDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    badgeDate: {
        fontSize: 12,
        color: '#999',
    },
    badgeProgress: {
        fontSize: 12,
        color: '#2196F3',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    buttonPressed: {
        opacity: 0.7,
    },
    badgePressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#E3F2FD',
        borderRadius: 3,
        marginTop: 10,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 3,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniProgressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E3F2FD',
        borderRadius: 2,
        marginRight: 8,
    },
    miniProgressFill: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 2,
    },
    backButton: {
        padding: 8,
    }
});

export default AchievementScreen;