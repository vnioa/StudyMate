import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const StudyCommunityScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('groups');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        studyGroups: [],
        qnaList: [],
        mentors: []
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await communityApi.getData(activeTab);
            setData(prev => ({ ...prev, [activeTab]: response.data }));
        } catch (error) {
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateGroup = async () => {
        try {
            navigation.navigate('CreateStudyGroup');
        } catch (error) {
            Alert.alert('오류', '그룹 생성에 실패했습니다');
        }
    };

    const renderTabContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />;
        }

        switch (activeTab) {
            case 'groups':
                return (
                    <View>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>스터디 그룹</Text>
                            <Pressable
                                style={styles.createButton}
                                onPress={handleCreateGroup}
                            >
                                <Text style={styles.createButtonText}>그룹 만들기</Text>
                            </Pressable>
                        </View>
                        {data.studyGroups.map(group => (
                            <Pressable
                                key={group.id}
                                style={styles.groupCard}
                                onPress={() => navigation.navigate('StudyGroupDetail', { groupId: group.id })}
                            >
                                <View style={styles.groupInfo}>
                                    <Text style={styles.groupName}>{group.name}</Text>
                                    <View style={styles.groupTags}>
                                        <Text style={styles.groupCategory}>{group.category}</Text>
                                        <Text style={styles.groupMembers}>{group.members}명 참여중</Text>
                                    </View>
                                    <Text style={styles.groupDescription}>{group.description}</Text>
                                </View>
                                <Icon name="chevron-right" size={20} color="#666" />
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
                                <Text style={styles.createButtonText}>질문하기</Text>
                            </Pressable>
                        </View>
                        {data.qnaList.map(question => (
                            <Pressable
                                key={question.id}
                                style={styles.qnaCard}
                                onPress={() => navigation.navigate('QuestionDetail', { questionId: question.id })}
                            >
                                <Text style={styles.qnaTitle}>{question.title}</Text>
                                <View style={styles.qnaInfo}>
                                    <Text style={styles.qnaAuthor}>{question.author}</Text>
                                    <Text style={styles.qnaTime}>{question.time}</Text>
                                    <Text style={styles.qnaReplies}>답변 {question.replies}</Text>
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
                                <Text style={styles.createButtonText}>멘토 등록</Text>
                            </Pressable>
                        </View>
                        {data.mentors.map(mentor => (
                            <Pressable
                                key={mentor.id}
                                style={styles.mentorCard}
                                onPress={() => navigation.navigate('MentorDetail', { mentorId: mentor.id })}
                            >
                                <View style={styles.mentorInfo}>
                                    <Text style={styles.mentorName}>{mentor.name}</Text>
                                    <Text style={styles.mentorField}>{mentor.field}</Text>
                                    <Text style={styles.mentorExperience}>경력 {mentor.experience}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Icon name="star" size={16} color="#FFD700" />
                                        <Text style={styles.rating}>{mentor.rating}</Text>
                                    </View>
                                </View>
                                <Pressable
                                    style={styles.contactButton}
                                    onPress={() => navigation.navigate('Chat', { mentorId: mentor.id })}
                                >
                                    <Text style={styles.contactButtonText}>연락하기</Text>
                                </Pressable>
                            </Pressable>
                        ))}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 커뮤니티</Text>
                <Pressable onPress={() => navigation.navigate('Notifications')}>
                    <Icon name="bell" size={24} color="#333" />
                </Pressable>
            </View>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Pressable
                        style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
                        onPress={() => setActiveTab('groups')}
                    >
                        <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
                            스터디 그룹
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === 'qna' && styles.activeTab]}
                        onPress={() => setActiveTab('qna')}
                    >
                        <Text style={[styles.tabText, activeTab === 'qna' && styles.activeTabText]}>
                            Q&A
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === 'mentoring' && styles.activeTab]}
                        onPress={() => setActiveTab('mentoring')}
                    >
                        <Text style={[styles.tabText, activeTab === 'mentoring' && styles.activeTabText]}>
                            멘토링
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                {renderTabContent()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4A90E2',
    },
    tabText: {
        color: '#666',
    },
    activeTabText: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    groupCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    groupTags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    groupCategory: {
        color: '#666',
        fontSize: 14,
    },
    groupDescription: {
        color: '#666',
        fontSize: 14,
    },
    groupMembers: {
        color: '#4A90E2',
        fontSize: 14,
    },
    qnaCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    qnaTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    qnaInfo: {
        flexDirection: 'row',
        gap: 10,
    },
    qnaAuthor: {
        color: '#666',
    },
    qnaTime: {
        color: '#999',
    },
    qnaReplies: {
        color: '#4A90E2',
    },
    mentorCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    mentorInfo: {
        flex: 1,
    },
    mentorName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    mentorField: {
        color: '#666',
        marginBottom: 2,
    },
    mentorExperience: {
        color: '#666',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        color: '#666',
    },
    contactButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    contactButtonText: {
        color: '#fff',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
});

export default StudyCommunityScreen;