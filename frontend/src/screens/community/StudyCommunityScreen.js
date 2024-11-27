import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { communityAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const TabButton = memo(({ title, isActive, onPress }) => (
    <Pressable
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={onPress}
    >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
            {title}
        </Text>
    </Pressable>
));

const StudyCommunityScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('groups');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        studyGroups: [],
        qnaList: [],
        mentors: []
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await communityAPI.getData(activeTab);
            if (response.data.success) {
                setData(prev => ({
                    ...prev,
                    [activeTab]: response.data.items
                }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            return () => {
                setData({
                    studyGroups: [],
                    qnaList: [],
                    mentors: []
                });
            };
        }, [fetchData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const renderContent = useCallback(() => {
        if (loading && !data[activeTab].length) {
            return (
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.loader}
                />
            );
        }

        switch (activeTab) {
            case 'groups':
                return (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>스터디 그룹</Text>
                            <Pressable
                                style={styles.createButton}
                                onPress={() => navigation.navigate('CreateStudyGroup')}
                            >
                                <Text style={styles.createButtonText}>
                                    그룹 만들기
                                </Text>
                            </Pressable>
                        </View>
                        {data.studyGroups.map(group => (
                            <Pressable
                                key={group.id}
                                style={styles.groupCard}
                                onPress={() => navigation.navigate('StudyGroupDetail', {
                                    groupId: group.id
                                })}
                            >
                                <View style={styles.groupInfo}>
                                    <Text style={styles.groupName}>{group.name}</Text>
                                    <View style={styles.groupTags}>
                                        <Text style={styles.groupCategory}>
                                            {group.category}
                                        </Text>
                                        <Text style={styles.groupMembers}>
                                            {group.members}명 참여중
                                        </Text>
                                    </View>
                                    <Text style={styles.groupDescription}>
                                        {group.description}
                                    </Text>
                                </View>
                                <Icon
                                    name="chevron-right"
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </Pressable>
                        ))}
                    </View>
                );
            case 'qna':
                return (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Q&A</Text>
                            <Pressable
                                style={styles.createButton}
                                onPress={() => navigation.navigate('CreateQuestion')}
                            >
                                <Text style={styles.createButtonText}>
                                    질문하기
                                </Text>
                            </Pressable>
                        </View>
                        {data.qnaList.map(question => (
                            <Pressable
                                key={question.id}
                                style={styles.qnaCard}
                                onPress={() => navigation.navigate('QuestionDetail', {
                                    questionId: question.id
                                })}
                            >
                                <Text style={styles.qnaTitle}>{question.title}</Text>
                                <View style={styles.qnaInfo}>
                                    <Text style={styles.qnaAuthor}>
                                        {question.author}
                                    </Text>
                                    <Text style={styles.qnaTime}>
                                        {question.time}
                                    </Text>
                                    <Text style={styles.qnaReplies}>
                                        답변 {question.replies}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                );
            case 'mentoring':
                return (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>멘토링</Text>
                            <Pressable
                                style={styles.createButton}
                                onPress={() => navigation.navigate('RegisterMentor')}
                            >
                                <Text style={styles.createButtonText}>
                                    멘토 등록
                                </Text>
                            </Pressable>
                        </View>
                        {data.mentors.map(mentor => (
                            <Pressable
                                key={mentor.id}
                                style={styles.mentorCard}
                                onPress={() => navigation.navigate('MentorDetail', {
                                    mentorId: mentor.id
                                })}
                            >
                                <View style={styles.mentorInfo}>
                                    <Text style={styles.mentorName}>
                                        {mentor.name}
                                    </Text>
                                    <Text style={styles.mentorField}>
                                        {mentor.field}
                                    </Text>
                                    <Text style={styles.mentorExperience}>
                                        경력 {mentor.experience}
                                    </Text>
                                    <View style={styles.ratingContainer}>
                                        <Icon
                                            name="star"
                                            size={16}
                                            color={theme.colors.warning}
                                        />
                                        <Text style={styles.rating}>
                                            {mentor.rating}
                                        </Text>
                                    </View>
                                </View>
                                <Pressable
                                    style={styles.contactButton}
                                    onPress={() => navigation.navigate('Chat', {
                                        mentorId: mentor.id
                                    })}
                                >
                                    <Text style={styles.contactButtonText}>
                                        연락하기
                                    </Text>
                                </Pressable>
                            </Pressable>
                        ))}
                    </View>
                );
            default:
                return null;
        }
    }, [activeTab, data, loading, navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>학습 커뮤니티</Text>
                <Pressable
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="bell" size={24} color={theme.colors.text} />
                </Pressable>
            </View>

            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <TabButton
                        title="스터디 그룹"
                        isActive={activeTab === 'groups'}
                        onPress={() => setActiveTab('groups')}
                    />
                    <TabButton
                        title="Q&A"
                        isActive={activeTab === 'qna'}
                        onPress={() => setActiveTab('qna')}
                    />
                    <TabButton
                        title="멘토링"
                        isActive={activeTab === 'mentoring'}
                        onPress={() => setActiveTab('mentoring')}
                    />
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {renderContent()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    tabContainer: {
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    createButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.large,
    },
    createButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
    },
    groupCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: 4,
    },
    groupTags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    groupCategory: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    groupDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    groupMembers: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
    },
    qnaCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    qnaTitle: {
        ...theme.typography.bodyLarge,
        fontWeight: '500',
        marginBottom: theme.spacing.sm,
    },
    qnaInfo: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    qnaAuthor: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    qnaTime: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textTertiary,
    },
    qnaReplies: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
    },
    mentorCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    mentorInfo: {
        flex: 1,
    },
    mentorName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: 4,
    },
    mentorField: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    mentorExperience: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    contactButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.large,
    },
    contactButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default StudyCommunityScreen;