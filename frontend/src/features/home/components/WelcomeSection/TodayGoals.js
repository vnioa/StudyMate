// features/home/components/WelcomeSection/TodayGoals.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useGoals } from '../../hooks/useGoals';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../../../components/common/ProgressBar';
import styles from './styles';

const TodayGoals = () => {
    const { todayGoals } = useGoals();
    const navigation = useNavigation();

    const handleGoalPress = (goalId) => {
        navigation.navigate('GoalDetail', { goalId });
    };

    const renderGoalItem = ({ item }) => (
        <TouchableOpacity
            style={styles.goalItem}
            onPress={() => handleGoalPress(item.id)}
        >
            <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{item.title}</Text>
                <Text style={styles.goalTime}>{item.estimatedTime}분</Text>
            </View>
            <ProgressBar progress={item.progress} />
            <View style={styles.goalFooter}>
                <Text style={styles.progressText}>{item.progress}%</Text>
                <Text style={styles.remainingTime}>
                    {item.remainingTime ? `${item.remainingTime}분 남음` : '완료'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.goalsContainer}>
            <View style={styles.header}>
                <Text style={styles.title}>오늘의 목표</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={todayGoals}
                renderItem={renderGoalItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.goalsList}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>오늘의 목표가 없습니다.</Text>
                }
            />
        </View>
    );
};

export default TodayGoals;