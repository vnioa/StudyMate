import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const FriendsListContent = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myProfile, setMyProfile] = useState(null);
    const [groups, setGroups] = useState(['전체']);
    const [selectedGroup, setSelectedGroup] = useState('전체');

    useEffect(() => {
        fetchFriends();
        fetchMyProfile();
    }, []);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const response = await friendsApi.getFriends();
            setFriends(response.data);

            // 그룹 목록 추출
            const uniqueGroups = ['전체', ...new Set(response.data.map(friend => friend.group))];
            setGroups(uniqueGroups);
        } catch (error) {
            Alert.alert('오류', '친구 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyProfile = async () => {
        try {
            const response = await profileApi.getMyProfile();
            setMyProfile(response.data);
        } catch (error) {
            console.error('프로필 로딩 실패:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchFriends(), fetchMyProfile()]);
        } finally {
            setRefreshing(false);
        }
    };

    const filteredFriends = friends.filter(friend => {
        const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = selectedGroup === '전체' || friend.group === selectedGroup;
        return matchesSearch && matchesGroup;
    });

    const updateStatusMessage = async (message) => {
        try {
            await profileApi.updateStatus(message);
            setMyProfile(prev => ({ ...prev, statusMessage: message }));
        } catch (error) {
            Alert.alert('오류', '상태 메시지 업데이트에 실패했습니다');
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="친구 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                horizontal
                style={styles.groupFilter}
                contentContainerStyle={styles.groupFilterContainer}
                showsHorizontalScrollIndicator={false}
            >
                {groups.map((group, index) => (
                    <Pressable
                        key={index}
                        style={[
                            styles.groupChip,
                            selectedGroup === group && styles.selectedGroupChip
                        ]}
                        onPress={() => setSelectedGroup(group)}
                    >
                        <Text style={[
                            styles.groupText,
                            selectedGroup === group && styles.selectedGroupText
                        ]}>
                            {group}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {myProfile && (
                    <Pressable
                        style={styles.myProfile}
                        onPress={() => navigation.navigate('MyProfile')}
                    >
                        <View style={styles.profileImage}>
                            {myProfile.avatar ? (
                                <Image
                                    source={{ uri: myProfile.avatar }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Icon name="user" size={24} color="#666" />
                            )}
                            <View style={[
                                styles.statusIndicator,
                                { backgroundColor: myProfile.status === '온라인' ? '#4CAF50' : '#999' }
                            ]} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.myName}>{myProfile.name}</Text>
                            <Text
                                style={styles.statusMessage}
                                onPress={() => navigation.navigate('EditStatus')}
                            >
                                {myProfile.statusMessage || '상태메시지를 입력해주세요'}
                            </Text>
                        </View>
                    </Pressable>
                )}

                <View style={styles.friendsList}>
                    <Text style={styles.friendsCount}>
                        친구 {filteredFriends.length}
                    </Text>
                    {filteredFriends.map(friend => (
                        <Pressable
                            key={friend.id}
                            style={styles.friendItem}
                            onPress={() => navigation.navigate('FriendProfile', { friendId: friend.id })}
                        >
                            <View style={styles.friendInfo}>
                                <View style={styles.profileImage}>
                                    {friend.avatar ? (
                                        <Image
                                            source={{ uri: friend.avatar }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <Icon name="user" size={24} color="#666" />
                                    )}
                                    <View style={[
                                        styles.statusIndicator,
                                        { backgroundColor: friend.status === '온라인' ? '#4CAF50' : '#999' }
                                    ]} />
                                </View>
                                <View style={styles.friendDetails}>
                                    <Text style={styles.friendName}>{friend.name}</Text>
                                    <Text style={styles.statusMessage}>
                                        {friend.statusMessage}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    groupFilter: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    groupFilterContainer: {
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    selectedGroupChip: {
        backgroundColor: '#4A90E2',
    },
    groupText: {
        fontSize: 14,
        color: '#666',
    },
    selectedGroupText: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    myProfile: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        marginLeft: 12,
        flex: 1,
        justifyContent: 'center',
    },
    myName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    friendsList: {
        flex: 1,
    },
    friendsCount: {
        padding: 16,
        color: '#666',
        fontSize: 14,
    },
    friendItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendDetails: {
        marginLeft: 12,
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    statusMessage: {
        color: '#666',
        fontSize: 14,
    },
});

export default FriendsListContent;