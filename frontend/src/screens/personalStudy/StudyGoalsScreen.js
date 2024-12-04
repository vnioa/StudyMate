import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { goalAPI } from '../../services/api';

const StudyGoalsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        short: true,
        mid: true,
        long: true
    });
    const [goals, setGoals] = useState({
        short: [],
        mid: [],
        long: []
    });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const response = await goalAPI.getGoals();
            if (response.data) {
                setGoals(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '목표를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEditGoal = async (goal) => {
        try {
            const response = await goalAPI.getGoalDetail(goal.id);
            navigation.navigate('EditGoal', {
                goal: response.data,
                onUpdate: fetchGoals
            });
        } catch (error) {
            Alert.alert('오류', '목표 상세 정보를 불러오는데 실패했습니다.');
        }
    };

    const handleDeleteGoal = async (goalId) => {
        Alert.alert(
            '목표 삭제',
            '정말 이 목표를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await goalAPI.deleteGoal(goalId);
                            await fetchGoals();
                            Alert.alert('성공', '목표가 삭제되었습니다.');
                        } catch (error) {
                            Alert.alert('오류', '목표 삭제에 실패했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateProgress = async (goalId, progress) => {
        try {
            setLoading(true);
            await goalAPI.updateGoalProgress(goalId, progress);
            await fetchGoals();
        } catch (error) {
            Alert.alert('오류', '진행도 업데이트에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const renderGoalSection = (title, goalsList, section) => (
        <View style={styles.section}>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section)}
            >
                <Text style={styles.sectionTitle}>{title}</Text>
                <Icon
                    name={expandedSections[section] ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                />
            </TouchableOpacity>

            {expandedSections[section] && (
                goalsList.length > 0 ? (
                    goalsList.map((goal) => (
                        <TouchableOpacity
                            key={goal.id}
                            style={styles.goalItem}
                            onPress={() => handleEditGoal(goal)}
                            disabled={loading}
                        >
                            <View style={styles.goalContent}>
                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                <Text style={styles.deadline}>
                                    마감일: {new Date(goal.deadline).toLocaleDateString()}
                                </Text>
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progress,
                                                { width: `${isFinite(goal.progress) ? Math.min(Math.round(goal.progress * 100), 100) : 0}%` }
                                            ]}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.progressButton}
                                        onPress={() => handleUpdateProgress(
                                            goal.id,
                                            Math.min(1, goal.progress + 0.1)
                                        )}
                                        disabled={loading}
                                    >
                                        <Icon name="plus" size={16} color="#4A90E2" />
                                    </TouchableOpacity>
                                    <Text style={styles.progressText}>
                                        {isFinite(goal.progress) ? Math.min(Math.round(goal.progress * 100), 100) : 0}%
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteGoal(goal.id)}
                                disabled={loading}
                            >
                                <Icon name="trash-2" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptyText}>목표가 없습니다</Text>
                )
            )}
        </View>
    );

    if (loading && !Object.values(goals).flat().length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>학습 목표</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddGoal', { onAdd: fetchGoals })}
                    disabled={loading}
                >
                    <Icon name="plus" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchGoals}
                        colors={['#0066FF']}
                    />
                }
            >
                {renderGoalSection('단기 목표', goals.short, 'short')}
                {renderGoalSection('중기 목표', goals.mid, 'mid')}
                {renderGoalSection('장기 목표', goals.long, 'long')}
            </ScrollView>
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
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    goalItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    goalContent: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    deadline: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 8,
    },
    progress: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        width: 40,
        textAlign: 'right',
    },
    deleteButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        padding: 12,
    },
    progressButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#f1f3f5',
        borderRadius: 4,
    },
});

export default StudyGoalsScreen;