// features/home/components/StudyGroupSection/GroupSummary.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useStudyGroup } from '../../../hooks/useStudyGroup';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../../../../components/common/ProgressBar';
import styles from './styles';

const GroupSummary = () => {
    const { groups } = useStudyGroup();
    const navigation = useNavigation();

    const handleGroupPress = (groupId) => {
        navigation.navigate('GroupDetail', { groupId });
    };

    return (
        <View style={styles.summarySection}>
            <View style={styles.header}>
                <Text style={styles.title}>스터디 그룹 활동</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
                    <Text style={styles.viewAll}>전체보기</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {groups.map((group) => (
                    <TouchableOpacity
                        key={group.id}
                        style={styles.groupCard}
                        onPress={() => handleGroupPress(group.id)}
                    >
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupDescription}>{group.description}</Text>
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressLabel}>목표 진행률</Text>
                            <ProgressBar progress={group.progress} />
                            <Text style={styles.progressText}>{group.progress}%</Text>
                        </View>
                        <View style={styles.groupInfo}>
                            <Text style={styles.memberCount}>{group.memberCount}명 참여중</Text>
                            <Text style={styles.nextMeeting}>
                                다음 모임: {group.nextMeeting}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default GroupSummary;