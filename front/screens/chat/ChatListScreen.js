// screens/chat/ChatListScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    Alert,
    VirtualizedList,
    Keyboard,
    AppState,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Voice from 'react-native-voice';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useSelector, useDispatch } from 'react-redux';
import { debounce } from 'lodash';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 60;

const ChatListScreen = () => {
    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Navigation
    const navigation = useNavigation();

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [filteredChatRooms, setFilteredChatRooms] = useState([]);
    const [selectedChats, setSelectedChats] = useState([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [networkStatus, setNetworkStatus] = useState(true);
    const [lastSync, setLastSync] = useState(null);

    // Animated Values
    const scrollY = useRef(new Animated.Value(0)).current;
    const searchBarWidth = useRef(new Animated.Value(width * 0.7)).current;
    const shadowOpacity = useRef(new Animated.Value(0)).current;
    const fabScale = useRef(new Animated.Value(1)).current;
    const notificationBadgeScale = useRef(new Animated.Value(1)).current;

    // Refs
    const swipeableRefs = useRef({});
    const searchInputRef = useRef(null);
    const listRef = useRef(null);
    const syncTimeoutRef = useRef(null);

    // Header Animation
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [HEADER_HEIGHT, 60],
        extrapolate: 'clamp',
    });

    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.25],
        extrapolate: 'clamp',
    });

    // Effects
    useEffect(() => {
        initializeScreen();
        setupVoiceRecognition();
        setupNetworkListener();
        setupAppStateListener();

        return () => {
            cleanup();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshChatList();
            return () => {
                // Cleanup on screen unfocus
                closeAllSwipeables();
            };
        }, [])
    );

    useEffect(() => {
        filterChatRooms();
    }, [searchQuery, chatRooms]);

    // Initialize
    const initializeScreen = async () => {
        try {
            setIsLoading(true);
            await Promise.all([
                loadCachedData(),
                fetchChatRooms(),
                checkPermissions(),
            ]);
        } catch (error) {
            console.error('Initialization error:', error);
            Alert.alert('초기화 오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // API Calls
    const fetchChatRooms = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch chat rooms');

            const data = await response.json();
            const processedData = processChatRoomsData(data);
            setChatRooms(processedData);
            await cacheChatRoomsData(processedData);
            setLastSync(new Date().toISOString());
        } catch (error) {
            console.error('Fetch chat rooms error:', error);
            const cachedData = await loadCachedData();
            if (cachedData) {
                setChatRooms(cachedData);
            }
        }
    };

    // Data Processing
    const processChatRoomsData = (data) => {
        return data.map(room => ({
            ...room,
            lastMessageTime: formatMessageTime(room.lastMessageTime),
            unreadCount: parseInt(room.unreadCount),
        })).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    };

    // Cache Management
    const cacheChatRoomsData = async (data) => {
        try {
            await AsyncStorage.setItem('cachedChatRooms', JSON.stringify({
                data,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Cache error:', error);
        }
    };

    const loadCachedData = async () => {
        try {
            const cached = await AsyncStorage.getItem('cachedChatRooms');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = new Date();
                const cacheTime = new Date(timestamp);
                // Cache is valid for 5 minutes
                if (now - cacheTime < 5 * 60 * 1000) {
                    return data;
                }
            }
            return null;
        } catch (error) {
            console.error('Load cache error:', error);
            return null;
        }
    };

    // Voice Recognition
    const setupVoiceRecognition = () => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    };

    const startVoiceRecognition = async () => {
        try {
            await Voice.start('ko-KR');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsVoiceListening(true);
        } catch (error) {
            console.error('Voice recognition error:', error);
            Alert.alert('음성 인식 오류', '음성 인식을 시작할 수 없습니다.');
        }
    };

    // Network Management
    const setupNetworkListener = () => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkStatus(state.isConnected);
            if (state.isConnected) {
                syncData();
            }
        });

        return () => unsubscribe();
    };

    // App State Management
    const setupAppStateListener = () => {
        AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                syncData();
            }
        });
    };

    // Search and Filter
    const filterChatRooms = debounce(() => {
        if (!searchQuery.trim()) {
            setFilteredChatRooms(chatRooms);
            return;
        }

        const filtered = chatRooms.filter(room => {
            const searchLower = searchQuery.toLowerCase();
            return (
                room.name.toLowerCase().includes(searchLower) ||
                room.lastMessage?.toLowerCase().includes(searchLower)
            );
        });

        setFilteredChatRooms(filtered);
    }, 300);

    // Gesture Handlers
    const handleLongPress = useCallback((chatId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsMultiSelectMode(true);
        setSelectedChats([chatId]);
    }, []);

    const handleChatSelect = useCallback((chatId) => {
        if (isMultiSelectMode) {
            setSelectedChats(prev =>
                prev.includes(chatId)
                    ? prev.filter(id => id !== chatId)
                    : [...prev, chatId]
            );
        } else {
            navigation.navigate('ChatRoom', { chatId });
        }
    }, [isMultiSelectMode, navigation]);

    // Render Functions
    const renderChatRoom = useCallback(({ item }) => {
        const isSelected = selectedChats.includes(item.id);

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[item.id] = ref}
                renderRightActions={() => renderRightActions(item.id)}
                renderLeftActions={() => renderLeftActions(item.id)}
                onSwipeableOpen={(direction) => {
                    Object.values(swipeableRefs.current).forEach(ref => {
                        if (ref && ref !== swipeableRefs.current[item.id]) {
                            ref.close();
                        }
                    });
                    if (direction === 'right') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.chatItem,
                        isSelected && styles.selectedChatItem
                    ]}
                    onPress={() => handleChatSelect(item.id)}
                    onLongPress={() => handleLongPress(item.id)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                >
                    <FastImage
                        source={{
                            uri: item.profileImage,
                            priority: FastImage.priority.high,
                        }}
                        style={styles.profileImage}
                        defaultSource={require('../../assets/default-profile.png')}
                    />
                    <View style={styles.chatInfo}>
                        <Text style={styles.chatName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    </View>
                    <View style={styles.chatMeta}>
                        <Text style={styles.timeText}>{item.lastMessageTime}</Text>
                        {item.unreadCount > 0 && (
                            <Animated.View
                                style={[
                                    styles.unreadBadge,
                                    { transform: [{ scale: notificationBadgeScale }] }
                                ]}
                            >
                                <Text style={styles.unreadText}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedChats, isMultiSelectMode]);

    const renderRightActions = (chatId) => (
        <View style={styles.swipeActions}>
            <TouchableOpacity
                style={[styles.swipeButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleBlockChat(chatId)}
            >
                <MaterialIcons name="block" size={24} color="white" />
                <Text style={styles.swipeButtonText}>차단</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLeftActions = (chatId) => (
        <View style={styles.swipeActions}>
            <TouchableOpacity
                style={[styles.swipeButton, { backgroundColor: '#4A90E2' }]}
                onPress={() => handleNotificationSettings(chatId)}
            >
                <MaterialIcons name="notifications" size={24} color="white" />
                <Text style={styles.swipeButtonText}>알림 설정</Text>
            </TouchableOpacity>
        </View>
    );

    // Main Render
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Animated.View style={[
                styles.header,
                {
                    height: headerHeight,
                    shadowOpacity: headerShadowOpacity
                }
            ]}>
                <View style={styles.searchContainer}>
                    <Animated.View style={[
                        styles.searchBar,
                        { width: searchBarWidth }
                    ]}>
                        <MaterialIcons name="search" size={24} color="#757575" />
                        <TextInput
                            ref={searchInputRef}
                            style={styles.searchInput}
                            placeholder="채팅 검색"
                            placeholderTextColor="#757575"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                        <TouchableOpacity
                            onPress={startVoiceRecognition}
                            style={styles.voiceButton}
                            disabled={isVoiceListening}
                        >
                            <MaterialIcons
                                name="mic"
                                size={24}
                                color={isVoiceListening ? "#4A90E2" : "#757575"}
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                        onPress={handleAIAssistant}
                        style={styles.aiButton}
                    >
                        <MaterialIcons name="mic" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MyPage')}
                        style={styles.profileButton}
                    >
                        <FastImage
                            source={{
                                uri: user?.profileImage,
                                priority: FastImage.priority.high,
                            }}
                            style={styles.profileImage}
                            defaultSource={require('../../assets/default-profile.png')}
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* 메인 콘텐츠 */}
            <Animated.ScrollView
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* 오늘의 학습 요약 카드 */}
                <View style={styles.summaryCard}>
                    <CircularProgress
                        value={studyData.achievementRate}
                        radius={40}
                        duration={2000}
                        progressValueColor={'#4A90E2'}
                        maxValue={100}
                        title={'달성률'}
                        titleColor={'#4A90E2'}
                        titleStyle={{ fontWeight: 'bold' }}
                    />
                    <View style={styles.studyInfo}>
                        <Text style={styles.studyTimeText}>
                            오늘 학습시간: {Math.floor(studyData.todayStudyTime / 60)}시간 {studyData.todayStudyTime % 60}분
                        </Text>
                        <Text style={styles.streakText}>
                            🔥 {studyData.studyStreak}일 연속 학습 중
                        </Text>
                    </View>
                </View>

                {/* 빠른 액세스 버튼 */}
                <ScrollView
                    horizontal
                    style={styles.quickAccessContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {[
                        { title: '개인학습', icon: 'book', screen: 'PersonalStudy' },
                        { title: '그룹학습', icon: 'people', screen: 'GroupStudy' },
                        { title: '채팅', icon: 'chatbubbles', screen: 'Chat' },
                        { title: '통계', icon: 'stats-chart', screen: 'Statistics' }
                    ].map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickAccessButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.navigate(item.screen);
                            }}
                        >
                            <Ionicons name={item.icon} size={24} color="white" />
                            <Text style={styles.quickAccessText}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* 최근 활동 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>최근 활동</Text>
                    {recentActivities.map((activity, index) => (
                        <View key={index} style={styles.activityItem}>
                            <Text style={styles.activityContent}>{activity.content}</Text>
                            <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                    ))}
                </View>

                {/* 추천 학습 콘텐츠 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>추천 학습</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        {recommendedContents.map((content, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.contentCard}
                                onPress={() => navigation.navigate('ContentDetail', { contentId: content.id })}
                            >
                                <FastImage
                                    source={{ uri: content.thumbnail }}
                                    style={styles.contentThumbnail}
                                    defaultSource={require('../../assets/default-content-thumbnail.png')}
                                />
                                <View style={styles.contentInfo}>
                                    <Text style={styles.contentTitle}>{content.title}</Text>
                                    <Text style={styles.contentDescription}>{content.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 동기부여 문구 */}
                <Animated.View
                    style={[
                        styles.motivationalContainer,
                        { opacity: motivationalFade }
                    ]}
                >
                    <Text style={styles.motivationalText}>{motivationalQuote}</Text>
                    <TouchableOpacity
                        onPress={refreshMotivationalQuote}
                        style={styles.refreshQuoteButton}
                    >
                        <Ionicons name="refresh" size={20} color="#4A90E2" />
                    </TouchableOpacity>
                </Animated.View>

                {/* 학습 통계 요약 */}
                <View style={styles.statisticsContainer}>
                    <Text style={styles.sectionTitle}>주간 학습 통계</Text>
                    <VictoryChart
                        theme={VictoryTheme.material}
                        domainPadding={20}
                        height={200}
                    >
                        <VictoryAxis
                            tickFormat={studyData.weeklyStudyData.map(item => item.day)}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickFormat={(x) => `${x}h`}
                        />
                        <VictoryBar
                            data={studyData.weeklyStudyData}
                            x="day"
                            y="hours"
                            style={{
                                data: {
                                    fill: "#4A90E2",
                                    width: 20
                                }
                            }}
                        />
                    </VictoryChart>
                </View>
            </Animated.ScrollView>

            {/* 플로팅 액션 버튼 */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NewChat')}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowRecentContacts(true);
                }}
            >
                <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                    <MaterialIcons name="add" size={24} color="white" />
                </Animated.View>
            </TouchableOpacity>

            {/* 알림 패널 */}
            <Animated.View
                style={[
                    styles.notificationPanel,
                    {
                        transform: [{ translateX: notificationPanelSlide }]
                    }
                ]}
            >
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>알림</Text>
                    <TouchableOpacity onPress={() => setShowNotificationPanel(false)}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {notifications.map((notification, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.notificationItem}
                            onPress={() => {
                                navigation.navigate(notification.screen, notification.params);
                                setShowNotificationPanel(false);
                            }}
                        >
                            <Text style={styles.notificationContent}>{notification.content}</Text>
                            <Text style={styles.notificationTime}>{notification.time}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* AI 어시스턴트 모달 */}
            <Modal
                isVisible={showAIAssistant}
                onBackdropPress={() => setShowAIAssistant(false)}
                style={styles.modal}
                animationIn="slideInUp"
                animationOut="slideOutDown"
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>AI 어시스턴트</Text>
                    <View style={styles.modalBody}>
                        {/* AI 어시스턴트 내용 */}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // 컨테이너 스타일
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    background: {
        flex: 1,
    },

    // 헤더 스타일
    header: {
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },

    // 검색 관련 스타일
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 50,
        flex: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },

    // 버튼 스타일
    voiceButton: {
        padding: 8,
        marginLeft: 8,
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 8,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },

    // 이미지 스타일
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    contentThumbnail: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },

    // 채팅 목록 스타일
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        height: 80,
    },
    selectedChatItem: {
        backgroundColor: '#E3F2FD',
    },
    chatInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    chatName: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'Roboto-Light',
        color: '#757575',
    },

    // 알림 배지 스타일
    unreadBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Roboto-Bold',
    },
    notificationBadge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // 알림 패널 스타일
    notificationPanel: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: width * 0.8,
        height: '100%',
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
    },
    notificationItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    notificationContent: {
        fontSize: 14,
        color: '#2C3E50',
        marginBottom: 4,
    },

    // 스와이프 액션 스타일
    swipeActions: {
        width: width * 0.3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    swipeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },

    // 모달 스타일
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 22,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: height * 0.3,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 16,
    },
    modalBody: {
        flex: 1,
    },

    // 섹션 스타일
    sectionContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
    },

    // 컨텐츠 카드 스타일
    contentCard: {
        width: width * 0.7,
        backgroundColor: 'white',
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    contentInfo: {
        padding: 12,
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    contentDescription: {
        fontSize: 14,
        color: '#7F8C8D',
    },

    // 스켈레톤 로딩 스타일
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    skeletonHeader: {
        height: 60,
        marginBottom: 16,
    },
    skeletonCard: {
        height: 100,
        margin: 16,
        borderRadius: 12,
    },
    skeletonList: {
        height: 200,
        margin: 16,
    },

    // 에러 상태 스타일
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },

    // 멀티 선택 모드 스타일
    multiSelectHeader: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#4A90E2',
    },
    multiSelectText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    multiSelectActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginLeft: 16,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default HomeScreen;