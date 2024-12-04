import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform,
    FlatList,
    TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { communityAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = useCallback(async (isLoadMore = false) => {
        if (!activeTab || (isLoadMore && !hasMore)) return;
        
        try {
            setLoading(true);
            let response;
            
            if (activeTab === 'qna') {
                response = await communityAPI.getQuestions({
                    page: isLoadMore ? page + 1 : 1,
                    limit: 20
                });
                
                const formattedQuestions = response.questions.map(question => ({
                    id: question.id,
                    title: question.title,
                    author: question.author,
                    time: question.createdAt,
                    replies: question.answersCount || 0
                }));

                setData(prev => ({
                    ...prev,
                    qnaList: isLoadMore 
                        ? [...prev.qnaList, ...formattedQuestions]
                        : formattedQuestions
                }));
                
                setPage(isLoadMore ? page + 1 : 1);
                setHasMore(response.questions.length === 20);
            } else {
                response = await communityAPI.getData(activeTab);
                if (response?.items) {
                    setData(prev => ({ ...prev, [activeTab]: response.items }));
                }
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '데이터를 불러오는데 실패했습니다'
            );
            setData(prev => ({ ...prev, [activeTab]: [] }));
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, hasMore]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            return () => {
                setData({ studyGroups: [], qnaList: [], mentors: [] });
            };
        }, [fetchData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const renderContent = useCallback(() => {
        if (loading && !data[activeTab]?.length) {
            return (
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.loader}
                />
            );
        }

        switch (activeTab) {
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
                        <FlatList
                            data={data.qnaList}
                            renderItem={({ item: question }) => (
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
                            )}
                            onEndReached={() => fetchData(true)}
                            onEndReachedThreshold={0.5}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[theme.colors.primary]}
                                    tintColor={theme.colors.primary}
                                />
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                );
            case 'mentoring':
                return renderMentorTab();
            default:
                return null;
        }
    }, [activeTab, data, loading, navigation]);

    const renderMentorTab = () => (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>멘토링</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('RegisterMentor')}
                >
                    <Text style={styles.createButtonText}>멘토 등록</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={data.mentors}
                renderItem={({ item: mentor }) => (
                    <TouchableOpacity
                        style={styles.mentorCard}
                        onPress={() => navigation.navigate('MentorDetail', { mentorId: mentor.id })}
                    >
                        <View style={styles.mentorInfo}>
                            <Text style={styles.mentorName}>{mentor.name}</Text>
                            <Text style={styles.mentorField}>{mentor.field}</Text>
                            <Text style={styles.mentorExperience}>{mentor.experience}</Text>
                            <View style={styles.ratingContainer}>
                                <Icon name="star" size={16} color={theme.colors.warning} />
                                <Text style={styles.rating}>{mentor.rating}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => navigation.navigate('Chat', { mentorId: mentor.id })}
                        >
                            <Text style={styles.contactButtonText}>상담하기</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>등록된 멘토가 없습니다</Text>
                    </View>
                }
            />
        </View>
    );

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