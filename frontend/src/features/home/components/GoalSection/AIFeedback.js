// features/home/components/GoalSection/AIFeedback.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useGoals } from '../../hooks/useGoals';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const AIFeedback = () => {
    const { feedback } = useGoals();

    return (
        <View style={styles.feedbackContainer}>
            <Text style={styles.title}>AI 학습 피드백</Text>
            <View style={styles.feedbackCard}>
                <Icon
                    name="robot"
                    size={24}
                    color="#007AFF"
                    style={styles.aiIcon}
                />
                <Text style={styles.feedbackText}>{feedback.message}</Text>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>피드백 적용하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AIFeedback;