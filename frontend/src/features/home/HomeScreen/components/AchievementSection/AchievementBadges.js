// features/home/components/AchievementSection/AchievementBadges.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAchievements } from '../../../hooks/useAchievements';
import { useNavigation } from '@react-navigation/native';
import Badge from '../../../../../components/common/Badge';
import styles from './styles';

const AchievementBadges = () => {
    const { badges } = useAchievements();
    const navigation = useNavigation();

    const handleBadgePress = (badgeId) => {
        navigation.navigate('BadgeDetail', { badgeId });
    };

    return (
        <View style={styles.badgeSection}>
            <View style={styles.header}>
                <Text style={styles.title}>최근 획득한 배지</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgeScrollView}
            >
                {badges.map((badge) => (
                    <TouchableOpacity
                        key={badge.id}
                        style={styles.badgeContainer}
                        onPress={() => handleBadgePress(badge.id)}
                    >
                        <Badge type={badge.type} size="large" />
                        <Text style={styles.badgeTitle}>{badge.title}</Text>
                        <Text style={styles.badgeDate}>{badge.earnedDate}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default AchievementBadges;