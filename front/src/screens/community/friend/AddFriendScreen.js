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
import { friendsAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';
import debounce from 'lodash/debounce';

const UserItem = memo(({ user, onPress, isRequested }) => (
    <View style={styles.userItem}>
        <View style={styles.userInfo}>
            <View style={styles.profileImage}>
                {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                ) : (
                    <Icon name="user" size={24} color={theme.colors.textSecondary} />
                )}
            </View>
            <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>
        </View>
        <Pressable
            style={[styles.addButton, isRequested && styles.requestedButton]}
            onPress={onPress}
            disabled={isRequested}
        >
            <Text style={[styles.addButtonText, isRequested && styles.requestedButtonText]}>
                {isRequested ? '요청됨' : '친구 추가'}
            </Text>
        </Pressable>
    </View>
));

const RequestItem = memo(({ request, onAccept, onReject, loading }) => (
    <View style={styles.userItem}>
        <View style={styles.userInfo}>
            <View style={styles.profileImage}>
                {request.profileImage ? (
                    <Image source={{ uri: request.profileImage }} style={styles.avatar} />
                ) : (
                    <Icon name="user" size={24} color={theme.colors.textSecondary} />
                )}
            </View>
            <View style={styles.userDetails}>
                <Text style={styles.userName}>{request.name}</Text>
                <Text style={styles.userEmail}>{request.email}</Text>
            </View>
        </View>
        <View style={styles.actionButtons}>
            <Pressable
                style={[styles.actionButton, styles.acceptButton]}
                onPress={onAccept}
                disabled={loading}
            >
                <Icon name="check" size={20} color={theme.colors.white} />
            </Pressable>
            <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={onReject}
                disabled={loading}
            >
                <Icon name="x" size={20} color={theme.colors.error} />
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

    const searchUsers = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                setLoading(true);
                const response = await friendsAPI.searchFriends(query);
                setSearchResults(response.friends || []);
            } catch (error) {
                Alert.alert('오류', error.message || '사용자 검색에 실패했습니다');
                setSearchResults([]);
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
        try {
            const response = await friendsAPI.sendFriendRequest(userId);
            if (response.success) {
                setRequestedUsers(prev => new Set([...prev, userId]));
                Alert.alert('성공', '친구 요청을 보냈습니다');
            }
        } catch (error) {
            Alert.alert('오류', error.message || '친구 요청을 보내는데 실패했습니다');
        }
    }, []);

    const handleAcceptRequest = useCallback(async (requestId) => {
        try {
            setProcessingRequest(requestId);
            const acceptResponse = await friendsAPI.acceptFriendRequest(requestId);
            
            if (acceptResponse.success) {
                const request = friendRequests.find(req => req.id === requestId);
                if (request) {
                    await friendsAPI.addFriend(request.userId);
                }
                
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                Alert.alert('성공', '친구 요청을 수락하고 친구로 추가했습니다');
            }
        } catch (error) {
            Alert.alert('오류', error.message || '친구 요청 수락에 실패했습니다');
        } finally {
            setProcessingRequest(null);
        }
    }, [friendRequests]);

    const handleRejectRequest = useCallback(async (requestId) => {
        try {
            setProcessingRequest(requestId);
            const response = await friendsAPI.rejectFriendRequest(requestId);
            if (response.success) {
                setFriendRequests(prev => prev.filter(req => req.id !== requestId));
                Alert.alert('성공', '친구 요청을 거절했습니다');
            }
        } catch (error) {
            Alert.alert('오류', error.message || '친구 요청 거절에 실패했습니다');
        } finally {
            setProcessingRequest(null);
        }
    }, []);

    const fetchFriendRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await friendsAPI.getFriendRequests();
            setFriendRequests(response.requests || []);
        } catch (error) {
            Alert.alert('오류', error.message || '친구 요청을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'requests') {
                fetchFriendRequests();
            }
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
                    <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                        친구 찾기
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        받은 요청 {friendRequests.length > 0 && `(${friendRequests.length})`}
                    </Text>
                </Pressable>
            </View>

            {activeTab === 'search' ? (
                <>
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Icon name="search" size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="아이디로 검색..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                placeholderTextColor={theme.colors.textTertiary}
                                autoCapitalize="none"
                                returnKeyType="search"
                            />
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <UserItem
                                    user={item}
                                    onPress={() => handleAddFriend(item.id)}
                                    isRequested={requestedUsers.has(item.id)}
                                />
                            )}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                searchQuery ? (
                                    <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
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
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>받은 친구 요청이 없습니다</Text>
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
});

export default memo(AddFriendScreen); 