import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Switch,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const GroupDetailScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [groupData, setGroupData] = useState({
        name: '',
        category: '',
        memberCount: 0,
        isPublic: false,
        image: null,
        members: [],
        feeds: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupDetails(groupId);
            setGroupData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async (value) => {
        try {
            const response = await groupAPI.updateGroupSettings(groupId, {
                isPublic: value
            });
            if (response.data.success) {
                setGroupData(prev => ({
                    ...prev,
                    isPublic: value
                }));
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        }
    };

    const handleFeedAction = async (feedId, actionType) => {
        try {
            const response = await groupAPI.handleFeedAction(groupId, feedId, actionType);
            if (response.data.success) {
                fetchGroupDetails(); // 피드 데이터 새로고침
            }
        } catch (error) {
            Alert.alert('오류', '작업을 수행할 수 없습니다.');
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchGroupDetails}
                />
            }
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 상세</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('GroupSettings', { groupId })}
                    style={styles.iconButton}
                >
                    <Ionicons name="settings-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.groupInfo}>
                <Image
                    source={{ uri: groupData.image || 'default_group_image_url' }}
                    style={styles.groupImage}
                />
                <Text style={styles.groupName}>{groupData.name}</Text>
                <Text style={styles.groupDetails}>{groupData.category}</Text>
                <Text style={styles.groupMembers}>{groupData.memberCount}명의 멤버</Text>
            </View>

            <View style={styles.publicMode}>
                <Text style={styles.publicModeText}>공개 모드</Text>
                <Switch
                    value={groupData.isPublic}
                    onValueChange={handleTogglePublic}
                />
            </View>

            <View style={styles.membersSection}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('MemberManage', { groupId })}
                    style={styles.memberButton}
                >
                    <Text style={styles.memberButtonText}>멤버 관리</Text>
                </TouchableOpacity>

                {groupData.members.slice(0, 3).map((member) => (
                    <TouchableOpacity key={member.id} style={styles.memberItem}>
                        <Image
                            source={{ uri: member.profileImage || 'default_profile_image_url' }}
                            style={styles.memberImage}
                        />
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.feedSection}>
                <Text style={styles.sectionTitle}>그룹 피드</Text>
                {groupData.feeds.map((feed) => (
                    <View key={feed.id} style={styles.feedItem}>
                        <Image
                            source={{ uri: feed.image || 'default_feed_image_url' }}
                            style={styles.feedImage}
                        />
                        <Text style={styles.feedText}>{feed.content}</Text>
                        <View style={styles.feedActions}>
                            <TouchableOpacity onPress={() => handleFeedAction(feed.id, 'like')}>
                                <Ionicons
                                    name={feed.isLiked ? "thumbs-up" : "thumbs-up-outline"}
                                    size={20}
                                    color={feed.isLiked ? "#0066FF" : "gray"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.actionText}>{feed.likeCount}</Text>

                            <TouchableOpacity onPress={() => handleFeedAction(feed.id, 'comment')}>
                                <Ionicons name="chatbubble-outline" size={20} color="gray" />
                            </TouchableOpacity>
                            <Text style={styles.actionText}>{feed.commentCount}</Text>

                            <TouchableOpacity onPress={() => handleFeedAction(feed.id, 'share')}>
                                <Ionicons name="share-outline" size={20} color="gray" />
                            </TouchableOpacity>
                            <Text style={styles.actionText}>{feed.shareCount}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    publicMode: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    publicModeText: {
        fontSize: 18,
    },
    groupInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    groupDetails: {
        fontSize: 16,
        color: '#888',
    },
    groupMembers: {
        fontSize: 16,
        color: '#888',
    },
    membersSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    memberName: {
        flex: 1,
        fontSize: 16,
    },
    feedSection: {
        marginBottom: 20,
    },
    feedItem: {
        marginBottom: 20,
    },
    feedImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    feedText: {
        fontSize: 16,
        marginBottom: 10,
    },
    feedActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 5,
        marginRight: 15,
        fontSize: 16,
    },
    iconButton: {
        padding: 10,
    },
    memberButton: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
    },
    memberButtonText: {
        fontSize: 16,
        color: '#333',
    },
});

export default GroupDetailScreen;