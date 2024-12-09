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
import { theme } from '../../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../../api/api';

const TabButton = memo(({ title, isActive, onPress, isOnline }) => (
    <Pressable
        style={[
            styles.tab,
            isActive && styles.activeTab,
            !isOnline && styles.tabDisabled
        ]}
        onPress={onPress}
        disabled={!isOnline}
    >
        <Text style={[
            styles.tabText,
            isActive && styles.activeTabText,
            !isOnline && styles.textDisabled
        ]}>
            {title}
        </Text>
    </Pressable>
));

const StudyCommunityScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('qna');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        qnaList: [],
        mentors: []
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchData = useCallback(async (isLoadMore = false) => {
        if (!activeTab || (isLoadMore && !hasMore)) return;

        if (!(await checkNetwork())) {
            const cachedData = await AsyncStorage.getItem(`community_${activeTab}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setData(prev => ({ ...prev, [activeTab]: parsed }));
            }
            return;
        }

        try {
            setLoading(true);
            let response;

            if (activeTab === 'qna') {
                response = await api.get(`/api/community/questions?page=${isLoadMore ? page + 1 : 1}&limit=20`);
                if (response.data.success) {
                    const formattedQuestions = response.data.questions.map(question => ({
                        id: question.id,
                        title: question.title,
                        author: question.author,
                        time: question.createdAt,
                        replies: question.answersCount || 0
                    }));

                    setData(prev => ({
                        ...prev,
                        qnaList: isLoadMore ? [...prev.qnaList, ...formattedQuestions] : formattedQuestions
                    }));
                    setPage(isLoadMore ? page + 1 : 1);
                    setHasMore(formattedQuestions.length === 20);
                    await AsyncStorage.setItem('community_qna',
                        JSON.stringify(formattedQuestions));
                }
            } else {
                response = await api.get(`/api/community/${activeTab}`);
                if (response.data.success) {
                    setData(prev => ({ ...prev, [activeTab]: response.data.items }));
                    await AsyncStorage.setItem(`community_${activeTab}`,
                        JSON.stringify(response.data.items));
                }
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, hasMore]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setData({
                    qnaList: [],
                    mentors: []
                });
            };
        }, [fetchData])
    );

    const handleRefresh = useCallback(async () => {
        if (!(await checkNetwork())) return;
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
                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    !isOnline && styles.buttonDisabled
                                ]}
                                onPress={() => navigation.navigate('CreateQuestion')}
                                disabled={!isOnline}
                            >
                                <Text style={[
                                    styles.createButtonText,
                                    !isOnline && styles.textDisabled
                                ]}>
                                    질문하기
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={data.qnaList}
                            renderItem={({ item: question }) => (
                                <Pressable
                                    style={[
                                        styles.qnaCard,
                                        !isOnline && styles.cardDisabled
                                    ]}
                                    onPress={() => navigation.navigate('QuestionDetail', {
                                        questionId: question.id
                                    })}
                                    disabled={!isOnline}
                                >
                                    <Text style={[
                                        styles.qnaTitle,
                                        !isOnline && styles.textDisabled
                                    ]}>
                                        {question.title}
                                    </Text>
                                    <View style={styles.qnaInfo}>
                                        <Text style={[
                                            styles.qnaAuthor,
                                            !isOnline && styles.textDisabled
                                        ]}>
                                            {question.author}
                                        </Text>
                                        <Text style={[
                                            styles.qnaTime,
                                            !isOnline && styles.textDisabled
                                        ]}>
                                            {question.time}
                                        </Text>
                                        <Text style={[
                                            styles.qnaReplies,
                                            !isOnline && styles.textDisabled
                                        ]}>
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
                                    enabled={isOnline}
                                />
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                );
            default:
                return null;
        }
    }, [activeTab, data, loading, navigation, refreshing, handleRefresh, isOnline]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>학습 커뮤니티</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={!isOnline}
                >
                    <Icon
                        name="bell"
                        size={24}
                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                    />
                </TouchableOpacity>
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
                        isOnline={isOnline}
                    />
                    <TabButton
                        title="멘토링"
                        isActive={activeTab === 'mentoring'}
                        onPress={() => setActiveTab('mentoring')}
                        isOnline={isOnline}
                    />
                </ScrollView>
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
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
    tabDisabled: {
        opacity: 0.5,
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
    cardDisabled: {
        opacity: 0.5,
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
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

StudyCommunityScreen.displayName = 'StudyCommunityScreen';

export default memo(StudyCommunityScreen);