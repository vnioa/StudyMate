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
    Image,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { friendsAPI, profileAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';
import debounce from 'lodash/debounce';

const GroupChip = memo(({ group, isSelected, onPress }) => (
    <Pressable
        style={[styles.groupChip, isSelected && styles.selectedGroupChip]}
        onPress={onPress}
    >
        <Text style={[styles.groupText, isSelected && styles.selectedGroupText]}>
            {group}
        </Text>
    </Pressable>
));

const FriendItem = memo(({ friend, onPress }) => (
    <Pressable style={styles.friendItem} onPress={onPress}>
        <View style={styles.friendInfo}>
            <View style={styles.profileImage}>
                {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
                ) : (
                    <Icon name="user" size={24} color={theme.colors.textSecondary} />
                )}
                <View style={[
                    styles.statusIndicator,
                    { backgroundColor: friend.status === '온라인' ? theme.colors.success : theme.colors.inactive }
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
));

const FriendsListContent = memo(({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myProfile, setMyProfile] = useState(null);
    const [groups, setGroups] = useState(['전체']);
    const [selectedGroup, setSelectedGroup] = useState('전체');

    const searchFriends = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                fetchData();
                return;
            }

            try {
                setLoading(true);
                const response = await friendsAPI.searchFriends(query);
                setFriends(response.friends || []);
            } catch (error) {
                Alert.alert('오류', error.message || '친구 검색에 실패했습니다');
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        searchFriends(text);
    }, [searchFriends]);

    const fetchGroups = useCallback(async () => {
        try {
            const response = await friendsAPI.getGroups();
            setGroups(['전체', ...(response.groups || [])]);
        } catch (error) {
            console.error('그룹 목록 로딩 실패:', error);
            setGroups(['전체']);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [friendsResponse, profileResponse] = await Promise.all([
                friendsAPI.getFriends(),
                profileAPI.getMyProfile(),
                fetchGroups()
            ]);

            setFriends(friendsResponse.friends);
            setMyProfile(profileResponse.profile);
        } catch (error) {
            Alert.alert('오류', error.message || '데이터를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [fetchGroups]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            return () => {
                setFriends([]);
                setMyProfile(null);
            };
        }, [fetchData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const updateStatusMessage = async (message) => {
        try {
            await profileAPI.updateStatus(message);
            setMyProfile(prev => ({
                ...prev,
                statusMessage: message
            }));
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '상태 메시지 업데이트에 실패했습니다'
            );
        }
    };

    const filteredFriends = friends.filter(friend => {
        const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = selectedGroup === '전체' || friend.group === selectedGroup;
        return matchesSearch && matchesGroup;
    });

    if (loading && !friends.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="친구 검색..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholderTextColor={theme.colors.textTertiary}
                    />
                </View>
            </View>

            {!searchQuery && (
                <ScrollView
                    horizontal
                    style={styles.groupFilter}
                    contentContainerStyle={styles.groupFilterContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {groups.map((group, index) => (
                        <GroupChip
                            key={index}
                            group={group}
                            isSelected={selectedGroup === group}
                            onPress={() => setSelectedGroup(group)}
                        />
                    ))}
                </ScrollView>
            )}

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
                                <Icon
                                    name="user"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                />
                            )}
                            <View style={[
                                styles.statusIndicator,
                                {
                                    backgroundColor: myProfile.status === '온라인'
                                        ? theme.colors.success
                                        : theme.colors.inactive
                                }
                            ]} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.myName}>{myProfile.name}</Text>
                            <Text
                                style={styles.statusMessage}
                                onPress={() => {
                                    navigation.navigate('EditStatus', {
                                        currentMessage: myProfile.statusMessage,
                                        onUpdate: updateStatusMessage
                                    });
                                }}
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
                        <FriendItem
                            key={friend.id}
                            friend={friend}
                            onPress={() => navigation.navigate('FriendProfile', {
                                friendId: friend.id
                            })}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchSection: {
        padding: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    groupFilter: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    groupFilterContainer: {
        padding: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.large,
        backgroundColor: theme.colors.surface,
        marginRight: theme.spacing.sm,
    },
    selectedGroupChip: {
        backgroundColor: theme.colors.primary,
    },
    groupText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    selectedGroupText: {
        color: theme.colors.white,
    },
    content: {
        flex: 1,
    },
    myProfile: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.surface,
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
        borderColor: theme.colors.background,
    },
    profileInfo: {
        marginLeft: theme.spacing.sm,
        flex: 1,
        justifyContent: 'center',
    },
    myName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: 4,
    },
    friendsList: {
        flex: 1,
    },
    friendsCount: {
        padding: theme.spacing.md,
        color: theme.colors.textSecondary,
        ...theme.typography.bodyMedium,
    },
    friendItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendDetails: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    friendName: {
        ...theme.typography.bodyLarge,
        fontWeight: '500',
        marginBottom: 4,
    },
    statusMessage: {
        color: theme.colors.textSecondary,
        ...theme.typography.bodyMedium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
});

FriendsListContent.displayName = 'FriendsListContent';

export default FriendsListContent;