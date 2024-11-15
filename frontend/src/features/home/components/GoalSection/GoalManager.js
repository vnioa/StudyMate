// features/home/components/GoalSection/GoalManager.js
import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useGoals } from '../../hooks/useGoals';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../../../components/common/ProgressBar';
import styles from './styles';

const GoalManager = () => {
    const { goals, updateGoalProgress } = useGoals();
    const navigation = useNavigation();

    const handleGoalPress = (goalId) => {
        navigation.navigate('GoalDetail', { goalId });
    };

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return '#FFE5E5';
            case 'medium': return '#FFF4E5';
            case 'low': return '#E5F6FF';
            default: return '#F5F5F5';
        }
    };

    const renderGoalItem = ({ item }) => (
        <TouchableOpacity
            style={styles.goalItem}
            onPress={() => handleGoalPress(item.id)}
        >
            <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.deadline}>{item.deadline}</Text>
            </View>
            <ProgressBar progress={item.progress} />
            <View style={styles.goalFooter}>
                <Text style={styles.progressText}>{item.progress}% 완료</Text>
                <Text style={[
                    styles.priorityTag,
                    { backgroundColor: getPriorityColor(item.priority) }
                ]}>
                    {item.priority}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>학습 목표 관리</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddGoal')}
                >
                    <Text style={styles.addButtonText}>+ 목표 추가</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={goals}
                renderItem={renderGoalItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>설정된 목표가 없습니다.</Text>
                }
            />
        </View>
    );
};

export default GoalManager;