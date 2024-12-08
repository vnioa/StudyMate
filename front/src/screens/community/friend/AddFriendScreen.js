import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    Platform,
    FlatList,
    Image
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

const UserItem = memo(({ user, onPress, isRequested, isOnline }) => (
    <View style={[styles.userItem, !isOnline && styles.userItemDisabled]}>
        <View style={styles.userInfo}>
            <View style={styles.profileImage}>
                {user.profileImage ? (
                    <Image
                        source={{ uri: user.profileImage }}
                        style={styles.avatar}
                    />
                ) : (
                    <Icon
                        name="user"
                        size={24}
                        color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                    />
                )}
            </View>
            <View style={styles.userDetails}>
                <Text style={[styles.userName, !isOnline && styles.textDisabled]}>
                    {user.name}
                </Text>
                <Text style={[styles.userEmail, !isOnline && styles.textDisabled]}>
                    {user.email}
                </Text>
            </View>
        </View>
        <Pressable
            style={[
                styles.addButton,
                isRequested && styles.requestedButton,
                !isOnline && styles.buttonDisabled
            ]}
            onPress={onPress}
            disabled={isRequested || !isOnline}
        >
            <Text style={[
                styles.addButtonText,
                isRequested && styles.requestedButtonText,
                !isOnline && styles.textDisabled
            ]}>
                {isRequested ? '요청됨' : '친구 추가'}
            </Text>
        </Pressable>
    </View>
));

const RequestItem = memo(({ request, onAccept, onReject, loading, isOnline }) => (
    <View style={[styles.userItem, !isOnline && styles.userItemDisabled]}>
        <View style={styles.userInfo}>
            <View style={styles.profileImage}>
                {request.profileImage ? (
                    <Image
                        source={{ uri: request.profileImage }}
                        style={styles.avatar}
                    />
                ) : (
                    <Icon
                        name="user"
                        size={24}
                        color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                    />
                )}
            </View>
            <View style={styles.userDetails}>
                <Text style={[styles.userName, !isOnline && styles.textDisabled]}>
                    {request.name}
                </Text>
                <Text style={[styles.userEmail, !isOnline && styles.textDisabled]}>
                    {request.email}
                </Text>
            </View>
        </View>
        <View style={styles.actionButtons}>
            <Pressable
                style={[
                    styles.actionButton,
                    styles.acceptButton,
                    !isOnline && styles.buttonDisabled
                ]}
                onPress={onAccept}
                disabled={loading || !isOnline}
            >
                <Icon
                    name="check"
                    size={20}
                    color={isOnline ? theme.colors.white : theme.colors.textDisabled}
                />
            </Pressable>
            <Pressable
                style={[
                    styles.actionButton,
                    styles.rejectButton,
                    !isOnline && styles.buttonDisabled
                ]}
                onPress={onReject}
                disabled={loading || !isOnline}
            >
                <Icon
                    name="x"
                    size={20}
                    color={isOnline ? theme.colors.error : theme.colors.textDisabled}
                />
            </Pressable>
        </View>
    </View>
));

const AddFriendScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requestedUsers, setRequestedUsers] = useState(new Set());
    const [processingRequest, setProcessingRequest] = useState(null);
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

    const searchUsers = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            if (!(await checkNetwork())) return;

            try {
                setLoading(true);
                const response = await api.get(`/api/friends/search?query=${query}`);
                if (response.data.success) {
                    setSearchResults(response.data.friends || []);
                    await AsyncStorage.setItem('lastSearchResults',
                        JSON.stringify(response.data.friends));
                }
            } catch (error) {
                const cachedResults = await AsyncStorage.getItem('lastSearchResults');
                if (cachedResults) {
                    setSearchResults(JSON.parse(cachedResults));
                }
                Alert.alert(
                    '오류',
                    error.response?.data?.message || '사용자 검색에 실패했습니다'
                );
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        searchUsers(text);
    }, [searchUsers]);

    const handleAddFriend = useCallback(async (userId) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.post('/api/friends/requests', { userId });
            if (response.data.success) {
                setRequestedUsers(prev => new Set([...prev, userId]));
                await AsyncStorage.setItem('requestedUsers',
                    JSON.stringify([...requestedUsers, userId]));
                Alert.alert('성공', '친구 요청을 보냈습니다');
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '친구 요청을 보내는데 실패했습니다'
            );
        }
    }, [requestedUsers]);

    const handleAcceptRequest = useCallback(async (requestId) => {
        if (!(await checkNetwork())) return;

        try {
            setProcessingRequest(requestId);
            const response = await api.put(`/api/friends/requests/${requestId}/accept`);
            if (response.data.success) {
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                await AsyncStorage.setItem('friendRequests',
                    JSON.stringify(friendRequests.filter(req => req.id !== requestId)));
                Alert.alert('성공', '친구 요청을 수락했습니다');
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '친구 요청 수락에 실패했습니다'
            );
        } finally {
            setProcessingRequest(null);
        }
    }, [friendRequests]);

    const handleRejectRequest = useCallback(async (requestId) => {
        if (!(await checkNetwork())) return;

        try {
            setProcessingRequest(requestId);
            const response = await api.put(`/api/friends/requests/${requestId}/reject`);
            if (response.data.success) {
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                await AsyncStorage.setItem('friendRequests',
                    JSON.stringify(friendRequests.filter(req => req.id !== requestId)));
                Alert.alert('성공', '친구 요청을 거절했습니다');
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '친구 요청 거절에 실패했습니다'
            );
        } finally {
            setProcessingRequest(null);
        }
    }, [friendRequests]);

    const fetchFriendRequests = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedRequests = await AsyncStorage.getItem('friendRequests');
            if (cachedRequests) {
                setFriendRequests(JSON.parse(cachedRequests));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/api/friends/requests');
            if (response.data.success) {
                setFriendRequests(response.data.requests || []);
                await AsyncStorage.setItem('friendRequests',
                    JSON.stringify(response.data.requests));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '친구 요청을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'requests') {
                fetchFriendRequests();
            }
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setSearchResults([]);
                setSearchQuery('');
            };
        }, [activeTab, fetchFriendRequests])
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
                <Text style={styles.headerTitle}>친구 추가</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                    onPress={() => setActiveTab('search')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'search' && styles.activeTabText
                    ]}>
                        친구 찾기
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'requests' && styles.activeTabText
                    ]}>
                        받은 요청 {friendRequests.length > 0 && `(${friendRequests.length})`}
                    </Text>
                </Pressable>
            </View>

            {activeTab === 'search' ? (
                <>
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
                                placeholder="아이디로 검색..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                placeholderTextColor={theme.colors.textTertiary}
                                autoCapitalize="none"
                                returnKeyType="search"
                                editable={isOnline}
                            />
                        </View>
                    </View>
                    {loading ? (
                        <ActivityIndicator
                            style={styles.loader}
                            color={theme.colors.primary}
                        />
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <UserItem
                                    user={item}
                                    onPress={() => handleAddFriend(item.id)}
                                    isRequested={requestedUsers.has(item.id)}
                                    isOnline={isOnline}
                                />
                            )}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                searchQuery ? (
                                    <Text style={styles.emptyText}>
                                        검색 결과가 없습니다
                                    </Text>
                                ) : null
                            }
                        />
                    )}
                </>
            ) : (
                <FlatList
                    data={friendRequests}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <RequestItem
                            request={item}
                            onAccept={() => handleAcceptRequest(item.id)}
                            onReject={() => handleRejectRequest(item.id)}
                            loading={processingRequest === item.id}
                            isOnline={isOnline}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            받은 친구 요청이 없습니다
                        </Text>
                    }
                />
            )}
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
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
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
        paddingHorizontal: theme.spacing.md,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    userDetails: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    userName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    userEmail: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
    },
    requestedButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    addButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
    },
    requestedButtonText: {
        color: theme.colors.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
    },
    rejectButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    listContent: {
        flexGrow: 1,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    }
});

export default AddFriendScreen;