import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { goalAPI } from '../../services/api';

const StudyGoalsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
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
            setGoals(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '목표를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditGoal = (goal) => {
        navigation.navigate('EditGoal', {
            goal,
            onUpdate: fetchGoals
        });
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

    const renderGoalSection = (title, goalsList) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {goalsList.length > 0 ? (
                goalsList.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={styles.goalItem}
                        onPress={() => handleEditGoal(goal)}
                        disabled={loading}
                    >
                        <View style={styles.goalContent}>
                            <Text style={styles.goalTitle}>{goal.title}</Text>
                            <Text style={styles.deadline}>{goal.deadline}</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progress, { width: `${goal.progress * 100}%` }]} />
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
                        refreshing={loading}
                        onRefresh={fetchGoals}
                    />
                }
            >
                {renderGoalSection('단기 목표', goals.short)}
                {renderGoalSection('중기 목표', goals.mid)}
                {renderGoalSection('장기 목표', goals.long)}
            </ScrollView>
        </View>
    );
};

// Add these styles to existing styles
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
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    goalItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    goalContent: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    deadline: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 3,
    },
    deleteButton: {
        padding: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 10
    },
});

export default StudyGoalsScreen;