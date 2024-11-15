// features/home/components/WelcomeSection/Milestones.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useMilestones } from '../../hooks/useMilestones';
import { useNavigation } from '@react-navigation/native';
import Badge from '../../../../components/common/Badge';
import styles from './styles';

const Milestones = () => {
    const { milestones } = useMilestones();
    const navigation = useNavigation();

    const handleMilestonePress = (milestoneId) => {
        navigation.navigate('MilestoneDetail', { milestoneId });
    };

    return (
        <View style={styles.milestonesContainer}>
            <View style={styles.header}>
                <Text style={styles.title}>주요 성과</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Milestones')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.milestonesList}
            >
                {milestones.map((milestone) => (
                    <TouchableOpacity
                        key={milestone.id}
                        style={styles.milestoneCard}
                        onPress={() => handleMilestonePress(milestone.id)}
                    >
                        <Badge type={milestone.badgeType} style={styles.milestoneBadge} />
                        <Text style={styles.milestoneTitle}>{milestone.achievement}</Text>
                        <Text style={styles.milestoneDate}>{milestone.date}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default Milestones;