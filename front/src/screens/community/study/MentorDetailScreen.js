import React, { useState, useCallback, memo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mentorAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const MentorDetailScreen = memo(({ route, navigation }) => {
    const { mentorId } = route.params;
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const fetchMentorDetail = useCallback(async () => {
        try {
            const response = await mentorAPI.getMentorInfo(mentorId);
            setMentor(response.mentor);
            setIsOwnProfile(response.isOwnProfile);
        } catch (error) {
            Alert.alert('오류', error.message || '멘토 정보를 불러오는데 실패했습니다');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [mentorId]);

    useEffect(() => {
        fetchMentorDetail();
    }, [fetchMentorDetail]);

    const handleStartChat = useCallback(async () => {
        try {
            const response = await mentorAPI.startMentorChat(mentorId);
            // 채팅방으로 이동하는 네비게이션 로직 추가
            navigation.navigate('Chat', { chatId: response.chatId });
        } catch (error) {
            Alert.alert('오류', error.message || '채팅 시작에 실패했습니다');
        }
    }, [mentorId]);

    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditMentorProfile', {
            mentorId,
            currentData: {
                field: mentor.field,
                experience: mentor.experience,
                introduction: mentor.introduction
            }
        });
    }, [navigation, mentorId, mentor]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멘토 프로필</Text>
                {isOwnProfile && (
                    <TouchableOpacity onPress={handleEditProfile}>
                        <Ionicons name="pencil" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.profileSection}>
                    <Text style={styles.name}>{mentor.name}</Text>
                    <Text style={styles.field}>{mentor.field}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>경력</Text>
                    <Text style={styles.sectionContent}>{mentor.experience}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>자기소개</Text>
                    <Text style={styles.sectionContent}>{mentor.introduction}</Text>
                </View>

                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.menteeCount}</Text>
                        <Text style={styles.statLabel}>멘티</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.rating}</Text>
                        <Text style={styles.statLabel}>평점</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{mentor.reviewCount}</Text>
                        <Text style={styles.statLabel}>후기</Text>
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.chatButton}
                onPress={handleStartChat}
            >
                <Text style={styles.chatButtonText}>채팅하기</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    name: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    field: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    sectionContent: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        lineHeight: 24,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...theme.typography.headlineSmall,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    chatButton: {
        margin: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.large,
        alignItems: 'center',
    },
    chatButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
});

MentorDetailScreen.displayName = 'MentorDetailScreen';

export default MentorDetailScreen;