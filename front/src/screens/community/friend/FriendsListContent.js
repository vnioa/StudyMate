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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import debounce from 'lodash/debounce';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const GroupChip = memo(({ group, isSelected, onPress, isOnline }) => (
    <Pressable
        style={[
            styles.groupChip,
            isSelected && styles.selectedGroupChip,
            !isOnline && styles.groupChipDisabled
        ]}
        onPress={onPress}
        disabled={!isOnline}
    >
        <Text style={[
            styles.groupText,
            isSelected && styles.selectedGroupText,
            !isOnline && styles.textDisabled
        ]}>
            {group}
        </Text>
    </Pressable>
));

const FriendItem = memo(({ friend, onPress, isOnline }) => (
    <Pressable
        style={[
            styles.friendItem,
            !isOnline && styles.friendItemDisabled
        ]}
        onPress={onPress}
        disabled={!isOnline}
    >
        <View style={styles.friendInfo}>
            <View style={styles.profileImage}>
                {friend.avatar ? (
                    <Image
                        source={{ uri: friend.avatar }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <Icon
                        name="user"
                        size={24}
                        color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                    />
                )}
                <View style={[
                    styles.statusIndicator,
                    {
                        backgroundColor: friend.status === '온라인'
                            ? theme.colors.success
                            : theme.colors.inactive
                    }
                ]} />
            </View>
            <View style={styles.friendDetails}>
                <Text style={[
                    styles.friendName,
                    !isOnline && styles.textDisabled
                ]}>
                    {friend.name}
                </Text>
                <Text style={[
                    styles.statusMessage,
                    !isOnline && styles.textDisabled
                ]}>
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

    const searchFriends = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                fetchData();
                return;
            }

            if (!(await checkNetwork())) return;

            try {
                setLoading(true);
                const response = await api.get(`/api/friends/search?query=${query}`);
                if (response.data.success) {
                    setFriends(response.data.friends || []);
                    await AsyncStorage.setItem('lastSearchResults',
                        JSON.stringify(response.data.friends));
                }
            } catch (error) {
                const cachedResults = await AsyncStorage.getItem('lastSearchResults');
                if (cachedResults) {
                    setFriends(JSON.parse(cachedResults));
                }
                Alert.alert('오류',
                    error.response?.data?.message || '친구 검색에 실패했습니다');
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
        if (!(await checkNetwork())) {
            const cachedGroups = await AsyncStorage.getItem('friendGroups');
            if (cachedGroups) {
                setGroups(['전체', ...JSON.parse(cachedGroups)]);
            }
            return;
        }

        try {
            const response = await api.get('/api/friends/groups');
            if (response.data.success) {
                const groupsList = ['전체', ...(response.data.groups || [])];
                setGroups(groupsList);
                await AsyncStorage.setItem('friendGroups',
                    JSON.stringify(response.data.groups));
            }
        } catch (error) {
            console.error('그룹 목록 로딩 실패:', error);
            setGroups(['전체']);
        }
    }, []);

    const fetchData = useCallback(async () => {
        if (!(await checkNetwork())) {
            const [cachedFriends, cachedProfile] = await Promise.all([
                AsyncStorage.getItem('friends'),
                AsyncStorage.getItem('myProfile')
            ]);
            if (cachedFriends) setFriends(JSON.parse(cachedFriends));
            if (cachedProfile) setMyProfile(JSON.parse(cachedProfile));
            return;
        }

        try {
            setLoading(true);
            const [friendsResponse, profileResponse] = await Promise.all([
                api.get('/api/friends'),
                api.get('/api/users/profile')
            ]);

            if (friendsResponse.data.success) {
                setFriends(friendsResponse.data.friends);
                await AsyncStorage.setItem('friends',
                    JSON.stringify(friendsResponse.data.friends));
            }

            if (profileResponse.data.success) {
                setMyProfile(profileResponse.data.profile);
                await AsyncStorage.setItem('myProfile',
                    JSON.stringify(profileResponse.data.profile));
            }

            await fetchGroups();
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '데이터를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [fetchGroups]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
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
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put('/api/users/status', { message });
            if (response.data.success) {
                setMyProfile(prev => ({ ...prev, statusMessage: message }));
                await AsyncStorage.setItem('myProfile',
                    JSON.stringify({ ...myProfile, statusMessage: message }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '상태 메시지 업데이트에 실패했습니다'
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
                    <Icon
                        name="search"
                        size={20}
                        color={theme.colors.textSecondary}
                    />
                    <TextInput
                        style={[
                            styles.searchInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="친구 검색..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholderTextColor={theme.colors.textTertiary}
                        editable={isOnline}
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
                            isOnline={isOnline}
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
                        enabled={isOnline}
                    />
                }
            >
                {myProfile && (
                    <Pressable
                        style={[
                            styles.myProfile,
                            !isOnline && styles.profileDisabled
                        ]}
                        onPress={() => navigation.navigate('MyProfile')}
                        disabled={!isOnline}
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
                                    color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
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
                            <Text style={[
                                styles.myName,
                                !isOnline && styles.textDisabled
                            ]}>
                                {myProfile.name}
                            </Text>
                            <Text
                                style={[
                                    styles.statusMessage,
                                    !isOnline && styles.textDisabled
                                ]}
                                onPress={() => {
                                    if (isOnline) {
                                        navigation.navigate('EditStatus', {
                                            currentMessage: myProfile.statusMessage,
                                            onUpdate: updateStatusMessage
                                        });
                                    }
                                }}
                            >
                                {myProfile.statusMessage || '상태메시지를 입력해주세요'}
                            </Text>
                        </View>
                    </Pressable>
                )}

                <View style={styles.friendsList}>
                    <Text style={[
                        styles.friendsCount,
                        !isOnline && styles.textDisabled
                    ]}>
                        친구 {filteredFriends.length}
                    </Text>
                    {filteredFriends.map(friend => (
                        <FriendItem
                            key={friend.id}
                            friend={friend}
                            onPress={() => navigation.navigate('FriendProfile', {
                                friendId: friend.id
                            })}
                            isOnline={isOnline}
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
    }
});

export default FriendsListContent;