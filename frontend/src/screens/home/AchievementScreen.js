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
import { useNavigation } from '@react-navigation/native';
import { achievementAPI } from '../../services/api';
import Modal from 'react-native-modal';

const AchievementScreen = () => {
    const navigation = useNavigation();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        acquired: 0,
        total: 0
    });
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

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

    const handleUpdateProgress = async (achievementId, progress) => {
        try {
            const response = await achievementAPI.updateProgress(achievementId, progress);
            if (response.success) {
                // 업데이트된 진행도 반영
                setAchievements(prev => 
                    prev.map(achievement => 
                        achievement.id === achievementId 
                            ? { ...achievement, progress: response.progress }
                            : achievement
                    )
                );
            }
        } catch (error) {
            Alert.alert('오류', '진행도 업데이트에 실패했습니다');
        }
    };

    const handleAcquireAchievement = async (achievementId) => {
        try {
            const response = await achievementAPI.acquireAchievement(achievementId);
            if (response.success) {
                // 획득한 업적 상태 업데이트
                setAchievements(prev => 
                    prev.map(achievement => 
                        achievement.id === achievementId 
                            ? { 
                                ...achievement, 
                                acquired: true, 
                                date: response.acquiredAt 
                              }
                            : achievement
                    )
                );
                setStats(prev => ({
                    ...prev,
                    acquired: prev.acquired + 1
                }));
                Alert.alert('축하합니다!', '새로운 업적을 획득했습니다!');
            }
        } catch (error) {
            Alert.alert('오류', '업적 획득에 실패했습니다');
        }
    };

    const handleAchievementPress = async (achievementId) => {
        try {
            const response = await achievementAPI.getAchievementDetail(achievementId);
            setSelectedAchievement(response.data.achievement);
            setIsModalVisible(true);
        } catch (error) {
            Alert.alert('오류', '업적 상세 정보를 불러오는데 실패했습니다');
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
                            onPress={() => handleAchievementPress(badge.id)}
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
                                                    { width: `${badge.progress}%` }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.badgeProgress}>{badge.progress}%</Text>
                                        {badge.progress >= 100 && (
                                            <TouchableOpacity
                                                onPress={() => handleAcquireAchievement(badge.id)}
                                                style={styles.acquireButton}
                                            >
                                                <Text style={styles.acquireButtonText}>획득하기</Text>
                                            </TouchableOpacity>
                                        )}
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

            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => setIsModalVisible(false)}
                onSwipeComplete={() => setIsModalVisible(false)}
                swipeDirection={['down']}
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Icon name="x" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>업적 상세</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    {selectedAchievement && (
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.iconContainer}>
                                <Icon
                                    name={selectedAchievement.icon}
                                    size={40}
                                    color={selectedAchievement.acquired ? '#2196F3' : '#9E9E9E'}
                                />
                            </View>
                            <Text style={styles.modalAchievementTitle}>
                                {selectedAchievement.title}
                            </Text>
                            <Text style={styles.modalDescription}>
                                {selectedAchievement.description}
                            </Text>
                            <Text style={styles.modalDate}>
                                획득일: {selectedAchievement.date || '미획득'}
                            </Text>
                            <View style={styles.modalProgressContainer}>
                                <Text style={styles.modalProgress}>
                                    진행도: {selectedAchievement.progress}%
                                </Text>
                                <View style={styles.modalProgressBar}>
                                    <View
                                        style={[
                                            styles.modalProgressFill,
                                            { width: `${selectedAchievement.progress}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                    )}
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
    },
    acquireButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginLeft: 8,
    },
    acquireButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    modalAchievementTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    modalDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    modalDate: {
        fontSize: 12,
        color: '#999',
    },
    modalProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    modalProgress: {
        fontSize: 12,
        color: '#2196F3',
    },
    modalProgressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E3F2FD',
        borderRadius: 2,
        marginLeft: 8,
    },
    modalProgressFill: {
        height: '100%',
        backgroundColor: '#2196F3',
        borderRadius: 2,
    },
});

export default AchievementScreen;