// features/home/screens/HomeScreen/index.js
import React from 'react';
import { SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import WelcomeSection from '../components/WelcomeSection';
import AchievementSection from '../components/AchievementSection';
import GoalSection from '../components/GoalSection';
import LearningSection from '../components/LearningSection';
import StudyGroupSection from '../components/StudyGroupSection';
import { useHome } from '../hooks/useHome';
import styles from './styles';

const HomeScreen = () => {
    const { refreshing, onRefresh } = useHome();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                        tintColor="#007AFF"
                    />
                }
            >
                <WelcomeSection />
                <AchievementSection />
                <GoalSection />
                <LearningSection />
                <StudyGroupSection />
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;