// FriendListScreen.js
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useWindowDimensions, Platform, Animated, PanResponder } from 'react-native';
import { useAccessibilityInfo } from '@react-native-community/hooks';
import FastImage from 'react-native-fast-image';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import * as Contacts from 'expo-contacts';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Speech from 'expo-speech';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = 'YOUR_API_URL';
const SOCKET_URL = 'YOUR_SOCKET_URL';
const CONTACT_SYNC_TASK = 'CONTACT_SYNC_TASK';
const SYNC_INTERVAL = 60 * 60 * 1000; // 1시간

export const FriendListScreen = () => {
    // State Management
    const [searchText, setSearchText] = useState('');
    const [selectedFriends, setSelectedFriends] = useState(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [blockedIds, setBlockedIds] = useState(new Set());
    const [hiddenIds, setHiddenIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
    const [groups, setGroups] = useState(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [friendSuggestions, setFriendSuggestions] = useState([]);
    const [onlineFriends, setOnlineFriends] = useState(new Set());

    // Refs & Animations
    const { width } = useWindowDimensions();
    const scrollY = useRef(new Animated.Value(0)).current;
    const searchBarWidth = useRef(new Animated.Value(width * 0.9)).current;
    const listGridTransition = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const listRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const socket = useRef(null);

    // Navigation
    const navigation = useNavigation();

    // Query Client
    const queryClient = useQueryClient();

    // Accessibility
    const { isScreenReaderEnabled, reduceMotionEnabled } = useAccessibilityInfo();

    // Friends Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['friends', searchText],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await axios.get(`${API_URL}/friends`, {
                params: {
                    search: searchText,
                    page: pageParam,
                    limit: 20,
                    include_status: true
                }
            });
            return response.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 1000 * 60 * 5
    });

    // Friend Mutations
    const addFriendMutation = useMutation({
        mutationFn: async (friendId) => {
            const response = await axios.post(`${API_URL}/friends/add`, { friendId });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['friends']);
            animateNewFriend(data.id);
        }
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (friendId) => {
            const response = await axios.post(`${API_URL}/friends/favorite`, {
                friendId,
                isFavorite: !favoriteIds.has(friendId)
            });
            return response.data;
        },
        onSuccess: (_, friendId) => {
            setFavoriteIds(prev => {
                const newSet = new Set(prev);
                newSet.has(friendId) ? newSet.delete(friendId) : newSet.add(friendId);
                return newSet;
            });
        }
    });

    const blockFriendMutation = useMutation({
        mutationFn: async (friendId) => {
            const response = await axios.post(`${API_URL}/friends/block`, { friendId });
            return response.data;
        },
        onSuccess: (_, friendId) => {
            setBlockedIds(prev => new Set(prev).add(friendId));
            queryClient.invalidateQueries(['friends']);
        }
    });

    const updateGroupMutation = useMutation({
        mutationFn: async ({ friendId, groupId }) => {
            const response = await axios.post(`${API_URL}/friends/group`, {
                friendId,
                groupId
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['friends']);
        }
    });

    // WebSocket Connection
    useEffect(() => {
        socket.current = io(SOCKET_URL);

        socket.current.on('friend_status_update', handleFriendStatusUpdate);
        socket.current.on('friend_profile_update', handleFriendProfileUpdate);
        socket.current.on('friend_request_received', handleFriendRequest);
        socket.current.on('friend_online', handleFriendOnline);
        socket.current.on('friend_offline', handleFriendOffline);

        return () => {
            socket.current?.disconnect();
        };
    }, []);

    // Contact Sync Background Task
    useEffect(() => {
        registerContactSyncTask();
        return () => {
            TaskManager.unregisterTaskAsync(CONTACT_SYNC_TASK);
        };
    }, []);

    const registerContactSyncTask = async () => {
        try {
            await BackgroundFetch.registerTaskAsync(CONTACT_SYNC_TASK, {
                minimumInterval: SYNC_INTERVAL,
                stopOnTerminate: false,
                startOnBoot: true,
            });
        } catch (error) {
            console.error('Background task registration failed:', error);
        }
    };

    // Friend Recommendations
    const getFriendRecommendations = async () => {
        try {
            const response = await axios.get(`${API_URL}/friends/recommendations`);
            setFriendSuggestions(response.data);
        } catch (error) {
            console.error('Friend recommendations error:', error);
        }
    };

    // Contact Sync
    const syncContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [
                        Contacts.Fields.PhoneNumbers,
                        Contacts.Fields.Emails,
                        Contacts.Fields.Name
                    ]
                });

                const response = await axios.post(`${API_URL}/friends/sync-contacts`, {
                    contacts: data.map(contact => ({
                        name: contact.name,
                        phoneNumbers: contact.phoneNumbers?.map(p => p.number),
                        emails: contact.emails?.map(e => e.email)
                    }))
                });

                return response.data;
            }
        } catch (error) {
            console.error('Contact sync error:', error);
        }
    };

    // Friend Status Handlers
    const handleFriendStatusUpdate = useCallback((update) => {
        queryClient.setQueryData(['friends'], (old) => {
            if (!old?.pages) return old;

            return {
                ...old,
                pages: old.pages.map(page => ({
                    ...page,
                    friends: page.friends.map(friend =>
                        friend.id === update.userId
                            ? { ...friend, status: update.status }
                            : friend
                    )
                }))
            };
        });
    }, []);

    const handleFriendOnline = useCallback((userId) => {
        setOnlineFriends(prev => new Set(prev).add(userId));
    }, []);

    const handleFriendOffline = useCallback((userId) => {
        setOnlineFriends(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    }, []);

    // Voice Search
    const startVoiceSearch = async () => {
        try {
            const { status } = await Speech.requestPermissionsAsync();
            if (status !== 'granted') return;

            setIsVoiceSearchActive(true);
            await Speech.startAsync({
                onSpeechResults: (event) => {
                    setSearchText(event.value[0]);
                },
                onSpeechEnd: () => {
                    setIsVoiceSearchActive(false);
                }
            });
        } catch (error) {
            console.error('Voice search error:', error);
            setIsVoiceSearchActive(false);
        }
    };

    // Drag and Drop
    const onDragEnd = useCallback((result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        updateGroupMutation.mutate({
            friendId: draggableId,
            groupId: destination.droppableId
        });
    }, []);

    // Friend Sorting & Filtering
    const sortedFriends = useMemo(() => {
        if (!data?.pages) return [];

        const allFriends = data.pages.flatMap(page => page.friends)
            .filter(friend => !hiddenIds.has(friend.id));

        return allFriends.sort((a, b) => {
            if (favoriteIds.has(a.id) && !favoriteIds.has(b.id)) return -1;
            if (!favoriteIds.has(a.id) && favoriteIds.has(b.id)) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [data, favoriteIds, hiddenIds]);

    // Gesture Handler
    const panResponder = useMemo(() =>
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx }) => {
                return Math.abs(dx) > 20;
            },
            onPanResponderMove: (_, { dx }) => {
                if (dx > width * 0.7) {
                    handleFavoriteToggle();
                } else if (dx < -width * 0.7) {
                    handleBlock();
                }
            }
        }), [width]);

    // View Mode Toggle
    const handleViewModeToggle = useCallback(() => {
        const newMode = viewMode === 'list' ? 'grid' : 'list';
        setViewMode(newMode);

        if (!reduceMotionEnabled) {
            Animated.spring(listGridTransition, {
                toValue: newMode === 'grid' ? 1 : 0,
                useNativeDriver: true
            }).start();
        }
    }, [viewMode, reduceMotionEnabled]);

    // Performance Optimization
    const renderItem = useCallback(({ item: friend }) => (
        <FriendListItem
            friend={friend}
            isFavorite={favoriteIds.has(friend.id)}
            isBlocked={blockedIds.has(friend.id)}
            isOnline={onlineFriends.has(friend.id)}
            isSelected={selectedFriends.has(friend.id)}
            onPress={() => handleFriendSelect(friend.id)}
            onLongPress={() => handleLongPress(friend.id)}
            onFavoritePress={() => handleFavoriteToggle(friend.id)}
            onBlockPress={() => handleBlock(friend.id)}
            viewMode={viewMode}
            panHandlers={panResponder.panHandlers}
        />
    ), [
        favoriteIds,
        blockedIds,
        onlineFriends,
        selectedFriends,
        viewMode
    ]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* 상단 헤더 */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            shadowOpacity: scrollY.interpolate({
                                inputRange: [0, 50],
                                outputRange: [0, 0.3],
                                extrapolate: 'clamp'
                            })
                        }
                    ]}
                    accessible={true}
                    accessibilityLabel="친구 목록 헤더"
                >
                    <View style={styles.searchContainer}>
                        <Animated.View style={[
                            styles.searchBar,
                            { width: searchBarWidth }
                        ]}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="친구 검색"
                                onChangeText={handleSearch}
                                returnKeyType="search"
                                accessibilityLabel="친구 검색"
                            />
                            <TouchableOpacity
                                style={styles.voiceSearchButton}
                                onPress={startVoiceSearch}
                                accessibilityLabel="음성 검색"
                            >
                                <Icon
                                    name={isVoiceSearchActive ? "stop" : "microphone"}
                                    size={24}
                                    color="#4CAF50"
                                />
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity
                            style={styles.addFriendButton}
                            onPress={() => navigation.navigate('AddFriend')}
                            accessibilityLabel="친구 추가"
                        >
                            <Icon name="person-add" size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* 내 프로필 섹션 */}
                <View style={styles.myProfileSection}>
                    <Image
                        source={{ uri: userProfile.imageUrl }}
                        style={styles.myProfileImage}
                    />
                    <View style={styles.myProfileInfo}>
                        <Text style={styles.myProfileName}>{userProfile.name}</Text>
                        <Text style={styles.myProfileStatus}>{userProfile.statusMessage}</Text>
                    </View>
                </View>

                {/* 즐겨찾기 친구 섹션 */}
                {favoriteIds.size > 0 && (
                    <View style={styles.favoritesSection}>
                        <Text style={styles.sectionTitle}>즐겨찾기</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.favoritesList}
                        >
                            {sortedFriends
                                .filter(friend => favoriteIds.has(friend.id))
                                .map(friend => (
                                    <TouchableOpacity
                                        key={friend.id}
                                        style={styles.favoriteItem}
                                        onPress={() => handleFriendSelect(friend.id)}
                                    >
                                        <Image
                                            source={{ uri: friend.imageUrl }}
                                            style={styles.favoriteImage}
                                        />
                                        <Text style={styles.favoriteName}>{friend.name}</Text>
                                    </TouchableOpacity>
                                ))
                            }
                        </ScrollView>
                    </View>
                )}

                {/* 친구 목록 */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <View style={styles.friendListContainer}>
                        <View style={styles.viewModeToggle}>
                            <TouchableOpacity
                                style={[
                                    styles.viewModeButton,
                                    viewMode === 'list' && styles.viewModeButtonActive
                                ]}
                                onPress={() => handleViewModeToggle('list')}
                            >
                                <Icon name="view-list" size={24} color={viewMode === 'list' ? "#4CAF50" : "#757575"} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.viewModeButton,
                                    viewMode === 'grid' && styles.viewModeButtonActive
                                ]}
                                onPress={() => handleViewModeToggle('grid')}
                            >
                                <Icon name="grid-view" size={24} color={viewMode === 'grid' ? "#4CAF50" : "#757575"} />
                            </TouchableOpacity>
                        </View>

                        <Animated.View
                            style={[
                                viewMode === 'grid' ? styles.gridList : styles.listView,
                                {
                                    transform: [{
                                        scale: listGridTransition.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 0.98]
                                        })
                                    }]
                                }
                            ]}
                        >
                            <FlashList
                                ref={listRef}
                                data={sortedFriends}
                                renderItem={renderItem}
                                estimatedItemSize={viewMode === 'grid' ? 120 : 70}
                                numColumns={viewMode === 'grid' ? 3 : 1}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                    { useNativeDriver: true }
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Icon name="people" size={48} color="#999" />
                                        <Text style={styles.emptyText}>친구가 없습니다</Text>
                                    </View>
                                }
                                stickyHeaderIndices={[0]}
                                contentContainerStyle={styles.listContent}
                            />
                        </Animated.View>
                    </View>
                </DragDropContext>

                {/* 알파벳 인덱스 바 */}
                <View style={styles.alphabetIndex}>
                    {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
                        <TouchableOpacity
                            key={letter}
                            style={styles.indexItem}
                            onPress={() => scrollToLetter(letter)}
                        >
                            <Text style={styles.indexText}>{letter}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 멀티 선택 모드 하단 액션 바 */}
                {isMultiSelectMode && (
                    <Animated.View
                        style={[
                            styles.multiSelectBar,
                            {
                                transform: [{
                                    translateY: multiSelectAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [60, 0]
                                    })
                                }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.multiSelectButton}
                            onPress={() => handleGroupAssign(Array.from(selectedFriends))}
                        >
                            <Icon name="folder" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>그룹 지정</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.multiSelectButton}
                            onPress={() => handleFavoriteToggle(Array.from(selectedFriends))}
                        >
                            <Icon name="star" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>즐겨찾기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.multiSelectButton}
                            onPress={() => handleBlock(Array.from(selectedFriends))}
                        >
                            <Icon name="block" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>차단</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* 친구 추천 모달 */}
                <Modal
                    visible={!!friendSuggestions.length}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setFriendSuggestions([])}
                >
                    <View style={styles.recommendationModal}>
                        <Text style={styles.modalTitle}>추천 친구</Text>
                        <FlatList
                            data={friendSuggestions}
                            renderItem={({ item }) => (
                                <FriendSuggestionItem
                                    friend={item}
                                    onAdd={() => addFriendMutation.mutate(item.id)}
                                />
                            )}
                            keyExtractor={item => item.id}
                        />
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setFriendSuggestions([])}
                        >
                            <Text style={styles.closeModalText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8'
    },
    // 헤더 스타일
    header: {
        height: 100,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50
    },
    searchBar: {
        height: 50,
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: '70%'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333'
    },
    searchClearButton: {
        padding: 8,
        marginLeft: 4
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileButton: {
        width: 40,
        height: 40,
        marginLeft: 12
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20
    },
    notificationDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F5A623',
        borderWidth: 2,
        borderColor: '#FFF'
    },

    // 채팅 목록 스타일
    listContent: {
        paddingBottom: 80
    },
    chatItem: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    chatItemImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12
    },
    chatItemContent: {
        flex: 1,
        justifyContent: 'center'
    },
    chatItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    chatItemName: {
        fontSize: 18,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333'
    },
    chatItemTime: {
        fontSize: 12,
        fontFamily: 'SFProText-Light',
        color: '#757575'
    },
    chatItemPreview: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginRight: 8
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },
    unreadCount: {
        fontSize: 12,
        fontFamily: 'SFProText-Medium',
        color: '#FFFFFF'
    },

    // 빈 상태 스타일
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        fontFamily: 'SFProText-Regular'
    },

    // 고정된 채팅방 섹션
    pinnedSection: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F8F8F8'
    },
    sectionTitle: {
        fontSize: 14,
        color: '#757575',
        fontFamily: 'SFProText-Medium'
    },

    // 멀티 선택 모드
    multiSelectBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#4A90E2',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    multiSelectButton: {
        alignItems: 'center',
        padding: 8
    },
    buttonText: {
        color: '#FFFFFF',
        marginTop: 4,
        fontSize: 12,
        fontFamily: 'SFProText-Medium'
    },
    selectedItem: {
        backgroundColor: '#E3F2FD'
    },

    // FAB 스타일
    fabContainer: {
        position: 'absolute',
        right: 16,
        bottom: Platform.OS === 'ios' ? 32 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // 분할 보기 버튼
    splitViewButton: {
        position: 'absolute',
        right: 16,
        top: Platform.OS === 'ios' ? 100 : 56,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },

    // 스와이프 액션
    swipeableContainer: {
        backgroundColor: '#FFFFFF'
    },
    swipeLeftAction: {
        flex: 1,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20
    },
    swipeRightAction: {
        flex: 1,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20
    },
    swipeActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'SFProText-Medium'
    },

    // 애니메이션 관련
    messageAnimation: {
        transform: [{ scale: 1 }]
    },
    slideInAnimation: {
        transform: [{ translateX: 0 }]
    },
    fadeAnimation: {
        opacity: 1
    },

    // 그림자 효과
    shadowEffect: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5
    },

    // AI 어시스턴트 모달
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingHorizontal: 16
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333'
    },
    modalCloseButton: {
        padding: 8
    },

    // 접근성
    accessibilityHighContrast: {
        borderWidth: 1,
        borderColor: '#000000'
    },
    accessibilityLargeText: {
        fontSize: 20,
        lineHeight: 28
    },

    // 새 메시지 알림
    newMessageNotification: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 88 : 64,
        left: 16,
        right: 16,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    newMessageText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'SFProText-Medium',
        marginLeft: 8
    }
});