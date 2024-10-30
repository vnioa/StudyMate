// ChatListScreen.js
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import {
    useWindowDimensions,
    Platform,
    Animated,
    PanResponder,
    AccessibilityInfo,
    Modal,
    TouchableOpacity, View, RefreshControl, TextInput, KeyboardAvoidingView, SafeAreaView
} from 'react-native';
import { useAccessibilityInfo } from '@react-native-community/hooks';
import io from 'socket.io-client';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as FCM from 'expo-firebase-messaging';
import { Client } from '@elastic/elasticsearch';
import * as PropTypes from "prop-types";
import {Icon} from "react-native-paper";
import {FlashList} from "@shopify/flash-list";

const API_URL = 'YOUR_API_URL';
const SOCKET_URL = 'YOUR_SOCKET_URL';
const ELASTICSEARCH_URL = 'YOUR_ELASTICSEARCH_URL';
const SEARCH_DEBOUNCE_TIME = 500;

function AIAssistantModal(props) {
    return null;
}

AIAssistantModal.propTypes = {
    onClose: PropTypes.func,
    onCommand: PropTypes.func
};

function ChatListItem(props) {
    return null;
}

ChatListItem.propTypes = {
    isPinned: PropTypes.bool,
    isSelected: PropTypes.bool,
    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    panHandlers: PropTypes.any,
    highContrast: PropTypes.bool,
    fontScale: PropTypes.number
};
export const ChatListScreen = () => {
    // State Management
    const [searchText, setSearchText] = useState('');
    const [selectedChats, setSelectedChats] = useState(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [pinnedChats, setPinnedChats] = useState(new Set());
    const [notificationSettings, setNotificationSettings] = useState(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAIAssistantVisible, setAIAssistantVisible] = useState(false);
    const [highContrastMode, setHighContrastMode] = useState(false);
    const [fontScale, setFontScale] = useState(1);
    const [splitViewEnabled, setSplitViewEnabled] = useState(Platform.isPad);

    // Navigation
    const navigation = useNavigation();

    // Refs & Animations
    const { width } = useWindowDimensions();
    const scrollY = useRef(new Animated.Value(0)).current;
    const fabScale = useRef(new Animated.Value(1)).current;
    const searchBarWidth = useRef(new Animated.Value(width * 0.7)).current;
    const multiSelectAnim = useRef(new Animated.Value(0)).current;
    const messageAnim = useRef(new Animated.Value(0)).current;
    const refreshRotation = useRef(new Animated.Value(0)).current;
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const selectionScale = useRef(new Animated.Value(1)).current;
    const listRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const socket = useRef(null);
    const elasticClient = useRef(new Client({ node: ELASTICSEARCH_URL }));

    // Query Client
    const queryClient = useQueryClient();

    // Accessibility
    const { isScreenReaderEnabled, reduceMotionEnabled } = useAccessibilityInfo();

    // Socket Connection
    useEffect(() => {
        socket.current = io(SOCKET_URL);

        socket.current.on('connect', () => {
            console.log('Socket connected');
        });

        socket.current.on('new_message', handleNewMessage);
        socket.current.on('chat_updated', handleChatUpdate);
        socket.current.on('chat_deleted', handleChatDelete);
        socket.current.on('notification_settings_changed', handleNotificationSettingsChange);

        return () => {
            socket.current?.disconnect();
        };
    }, []);

    // Firebase Cloud Messaging Setup
    useEffect(() => {
        setupFCM();
    }, []);

    const setupFCM = async () => {
        try {
            const token = await FCM.getToken();
            await axios.post(`${API_URL}/users/fcm-token`, { token });

            FCM.onMessage((message) => {
                if (message.data.type === 'new_message') {
                    handleNewMessage(JSON.parse(message.data.message));
                }
            });

            // Background message handling
            FCM.setBackgroundMessageHandler(async (message) => {
                if (message.data.type === 'new_message') {
                    await handleBackgroundMessage(message);
                }
            });
        } catch (error) {
            console.error('FCM setup error:', error);
        }
    };

    // Chat List Query with Search
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['chats', searchText],
        queryFn: async ({ pageParam = 1 }) => {
            if (searchText) {
                const { body } = await elasticClient.current.search({
                    index: 'chats',
                    body: {
                        query: {
                            multi_match: {
                                query: searchText,
                                fields: ['name', 'lastMessage'],
                                fuzziness: 'AUTO'
                            }
                        },
                        from: (pageParam - 1) * 20,
                        size: 20
                    }
                });
                return {
                    chats: body.hits.hits.map(hit => hit._source),
                    nextPage: body.hits.total.value > pageParam * 20 ? pageParam + 1 : null
                };
            } else {
                const response = await axios.get(`${API_URL}/chats`, {
                    params: {
                        page: pageParam,
                        limit: 20
                    }
                });
                return response.data;
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 1000 * 60,
    });

    // Chat Mutations
    const pinChatMutation = useMutation({
        mutationFn: async (chatId) => {
            const response = await axios.post(`${API_URL}/chats/${chatId}/pin`);
            return response.data;
        },
        onSuccess: (_, chatId) => {
            setPinnedChats(prev => {
                const newPinnedChats = new Set(prev);
                newPinnedChats.has(chatId) ? newPinnedChats.delete(chatId) : newPinnedChats.add(chatId);
                return newPinnedChats;
            });
        }
    });

    const archiveChatMutation = useMutation({
        mutationFn: async (chatId) => {
            const response = await axios.post(`${API_URL}/chats/${chatId}/archive`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['chats']);
        }
    });

    const deleteChatMutation = useMutation({
        mutationFn: async (chatId) => {
            const response = await axios.delete(`${API_URL}/chats/${chatId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['chats']);
        }
    });

    // Chat Sorting Algorithm
    const sortedChats = useMemo(() => {
        if (!data?.pages) return [];

        const allChats = data.pages.flatMap(page => page.chats);
        return allChats.sort((a, b) => {
            if (pinnedChats.has(a.id) && !pinnedChats.has(b.id)) return -1;
            if (!pinnedChats.has(a.id) && pinnedChats.has(b.id)) return 1;

            const weightA = a.lastActivity + (a.unreadCount * 1.5);
            const weightB = b.lastActivity + (b.unreadCount * 1.5);

            return weightB - weightA;
        });
    }, [data, pinnedChats]);

    // Gesture Handler
    const panResponder = useMemo(() =>
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx }) => {
                return Math.abs(dx) > 20;
            },
            onPanResponderMove: (_, { dx }) => {
                if (dx > width * 0.7) {
                    handleNotificationToggle();
                } else if (dx < -width * 0.7) {
                    handleDeleteSelected();
                }
            },
            onPanResponderRelease: () => {
                Animated.spring(swipeAnim, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
            }
        }), [width]);

    // Event Handlers
    const handleNewMessage = useCallback((message) => {
        queryClient.setQueryData(['chats'], (old) => {
            if (!old?.pages) return old;

            const newPages = old.pages.map(page => ({
                ...page,
                chats: page.chats.map(chat => {
                    if (chat.id === message.chatId) {
                        return {
                            ...chat,
                            lastMessage: message,
                            lastActivity: Date.now(),
                            unreadCount: chat.unreadCount + 1
                        };
                    }
                    return chat;
                })
            }));

            return { ...old, pages: newPages };
        });

        if (!reduceMotionEnabled) {
            Animated.sequence([
                Animated.spring(messageAnim, {
                    toValue: 1,
                    useNativeDriver: true
                }),
                Animated.timing(messageAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [reduceMotionEnabled]);

    const handleSearch = useCallback((text) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchText(text);
        }, SEARCH_DEBOUNCE_TIME);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);

        if (!reduceMotionEnabled) {
            Animated.loop(
                Animated.timing(refreshRotation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true
                })
            ).start();
        }

        await refetch();
        setIsRefreshing(false);
        refreshRotation.setValue(0);
    }, [refetch, reduceMotionEnabled]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleChatSelect = useCallback((chatId) => {
        if (isMultiSelectMode) {
            setSelectedChats(prev => {
                const newSet = new Set(prev);
                newSet.has(chatId) ? newSet.delete(chatId) : newSet.add(chatId);
                return newSet;
            });
        } else {
            if (!reduceMotionEnabled) {
                Animated.parallel([
                    Animated.spring(selectionScale, {
                        toValue: 1.05,
                        useNativeDriver: true
                    }),
                    Animated.timing(selectionScale, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true
                    })
                ]).start();
            }

            navigation.navigate('ChatRoomScreen', {
                chatId,
                transition: 'slideFromRight'
            });
        }
    }, [isMultiSelectMode, reduceMotionEnabled, navigation]);

    const handleLongPress = useCallback((chatId) => {
        setIsMultiSelectMode(true);
        setSelectedChats(new Set([chatId]));

        Animated.spring(multiSelectAnim, {
            toValue: 1,
            useNativeDriver: true
        }).start();
    }, []);

    const handlePinSelected = useCallback(() => {
        selectedChats.forEach(chatId => {
            pinChatMutation.mutate(chatId);
        });
        setIsMultiSelectMode(false);
        setSelectedChats(new Set());
    }, [selectedChats]);

    const handleArchiveSelected = useCallback(() => {
        selectedChats.forEach(chatId => {
            archiveChatMutation.mutate(chatId);
        });
        setIsMultiSelectMode(false);
        setSelectedChats(new Set());
    }, [selectedChats]);

    const handleDeleteSelected = useCallback(() => {
        selectedChats.forEach(chatId => {
            deleteChatMutation.mutate(chatId);
        });
        setIsMultiSelectMode(false);
        setSelectedChats(new Set());
    }, [selectedChats]);

    const handleNotificationToggle = useCallback(async (chatId) => {
        try {
            const response = await axios.patch(`${API_URL}/chats/${chatId}/notifications`);
            setNotificationSettings(prev => {
                const newSettings = new Map(prev);
                newSettings.set(chatId, response.data.enabled);
                return newSettings;
            });
        } catch (error) {
            console.error('Notification toggle error:', error);
        }
    }, []);

    const handleAICommand = useCallback(async (command) => {
        try {
            const response = await axios.post(`${API_URL}/ai/command`, { command });
            return response.data;
        } catch (error) {
            console.error('AI command error:', error);
            return null;
        }
    }, []);

    const handleBackgroundMessage = async (message) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: message.data.title,
                body: message.data.body,
                data: message.data
            },
            trigger: null
        });
    };

    // Performance Optimization
    const renderItem = useCallback(({ item }) => (
        <ChatListItem
            chat={item}
            isPinned={pinnedChats.has(item.id)}
            isSelected={selectedChats.has(item.id)}
            onPress={() => handleChatSelect(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            panHandlers={panResponder.panHandlers}
            highContrast={highContrastMode}
            fontScale={fontScale}
        />
    ), [selectedChats, pinnedChats, highContrastMode, fontScale]);

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
                    accessibilityLabel="채팅 목록 헤더"
                >
                    <View style={styles.searchContainer}>
                        <Animated.View style={[
                            styles.searchBar,
                            { width: searchBarWidth }
                        ]}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="대화방 검색"
                                onChangeText={handleSearch}
                                returnKeyType="search"
                                accessibilityLabel="대화방 검색"
                                accessibilityHint="대화방을 검색할 수 있습니다"
                            />
                            <TouchableOpacity
                                style={styles.searchClearButton}
                                onPress={() => handleSearch('')}
                                accessibilityLabel="검색어 지우기"
                            >
                                <Icon name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity
                            style={styles.aiButton}
                            onPress={handleAICommand}
                            accessibilityLabel="AI 어시스턴트"
                        >
                            <Icon name="microphone" size={24} color="#4A90E2" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => navigation.navigate('Profile')}
                            accessibilityLabel="프로필 보기"
                        >
                            <Image
                                source={{ uri: userProfileImage }}
                                style={styles.profileImage}
                            />
                            {hasNotification && (
                                <View style={styles.notificationDot} />
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* 채팅 목록 */}
                <FlashList
                    ref={listRef}
                    data={sortedChats}
                    renderItem={renderItem}
                    estimatedItemSize={80}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    initialNumToRender={10}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#4A90E2"
                            colors={['#4A90E2']}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="chat-off" size={48} color="#999" />
                            <Text style={styles.emptyText}>대화방이 없습니다</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        pinnedChats.size > 0 && (
                            <View style={styles.pinnedSection}>
                                <Text style={styles.sectionTitle}>고정된 대화</Text>
                            </View>
                        )
                    }
                    stickyHeaderIndices={[0]}
                    contentContainerStyle={styles.listContent}
                    accessibilityLabel="채팅방 목록"
                />

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
                            onPress={handleArchiveSelected}
                            accessibilityLabel="선택한 채팅방 보관"
                        >
                            <Icon name="archive" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>보관</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.multiSelectButton}
                            onPress={handlePinSelected}
                            accessibilityLabel="선택한 채팅방 고정"
                        >
                            <Icon name="pin" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>고정</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.multiSelectButton}
                            onPress={handleDeleteSelected}
                            accessibilityLabel="선택한 채팅방 삭제"
                        >
                            <Icon name="delete" size={24} color="#FFF" />
                            <Text style={styles.buttonText}>삭제</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* 새 채팅 시작 FAB */}
                <Animated.View
                    style={[
                        styles.fabContainer,
                        {
                            transform: [
                                { scale: fabAnim },
                                {
                                    translateY: scrollY.interpolate({
                                        inputRange: [-50, 0, 100],
                                        outputRange: [-25, 0, 100],
                                        extrapolate: 'clamp'
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={handleNewChat}
                        activeOpacity={0.8}
                        accessibilityLabel="새 채팅 시작"
                    >
                        <Icon name="plus" size={28} color="#FFF" />
                    </TouchableOpacity>
                </Animated.View>

                {/* 분할 보기 토글 버튼 */}
                {Platform.isPad && (
                    <TouchableOpacity
                        style={styles.splitViewButton}
                        onPress={() => setSplitViewEnabled(!splitViewEnabled)}
                        accessibilityLabel="분할 보기 전환"
                    >
                        <Icon
                            name={splitViewEnabled ? "view-split" : "view-stack"}
                            size={24}
                            color="#4A90E2"
                        />
                    </TouchableOpacity>
                )}

                {/* AI 어시스턴트 모달 */}
                <Modal
                    visible={isAIAssistantVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setAIAssistantVisible(false)}
                >
                    <AIAssistantModal
                        onClose={() => setAIAssistantVisible(false)}
                        onCommand={handleAICommand}
                    />
                </Modal>

                {/* 접근성 알림 */}
                {isScreenReaderEnabled && (
                    <AccessibilityInfo
                        announceForAccessibility={
                            `채팅방 목록. ${sortedChats.length}개의 대화방이 있습니다.`
                        }
                    />
                )}
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
    chatItemName: {
        fontSize: 18,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        marginBottom: 4
    },
    chatItemPreview: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575'
    },
    chatItemRight: {
        alignItems: 'flex-end'
    },
    chatItemTime: {
        fontSize: 12,
        fontFamily: 'SFProText-Light',
        color: '#757575',
        marginBottom: 4
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
    pinnedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 16,
        height: 16
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#E3F2FD',
        opacity: 0.5
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

    // 멀티 선택 모드 바
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

    // 애니메이션 관련 스타일
    swipeableContainer: {
        backgroundColor: '#FFFFFF'
    },
    swipeLeftAction: {
        flex: 1,
        backgroundColor: '#F44336',
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

    // 접근성 관련 스타일
    highContrast: {
        borderWidth: 1,
        borderColor: '#000000'
    },
    largeText: {
        fontSize: 20,
        lineHeight: 28
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
    }
});