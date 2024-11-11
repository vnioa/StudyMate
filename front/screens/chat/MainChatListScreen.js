// MainChatListScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Keyboard,
    Alert,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import FastImage from 'react-native-fast-image';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import { BlurView } from '@react-native-community/blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '../../config/api';

// 상수 정의
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 60 + StatusBar.currentHeight;
const SEARCH_BAR_HEIGHT = 50;
const MINIMUM_TOUCH_SIZE = 44;
const SWIPE_THRESHOLD = 0.7;
const CHAT_ITEM_HEIGHT = 80;


const MainChatListScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [aiAssistantActive, setAiAssistantActive] = useState(false);
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showFABMenu, setShowFABMenu] = useState(false);
    const [newMessageNotification, setNewMessageNotification] = useState(null);

    // Redux
    const dispatch = useDispatch();
    const chatRooms = useSelector(state => state.chat.chatRooms);
    const user = useSelector(state => state.auth.user);

    // Refs
    const searchInputRef = useRef(null);
    const flatListRef = useRef(null);
    const swipeableRefs = useRef({});
    const scrollY = useRef(new Animated.Value(0)).current;
    const fabAnim = useRef(new Animated.Value(1)).current;
    const notificationAnim = useRef(new Animated.Value(0)).current;
    const searchBarWidth = useRef(new Animated.Value(SCREEN_WIDTH * 0.7)).current;
    const headerOpacity = useRef(new Animated.Value(1)).current;

    // Navigation
    const navigation = useNavigation();

    // 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [HEADER_HEIGHT, HEADER_HEIGHT - 30],
        extrapolate: 'clamp'
    });

    const shadowOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 0.2],
        extrapolate: 'clamp'
    });

    // 초기화 및 정리
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchChatRooms();
            initializeSocketListeners();
            return () => cleanupSocketListeners();
        }, [])
    );

    const initializeScreen = async () => {
        try {
            await Promise.all([
                initializeVoiceRecognition(),
                prefetchImages(),
                setupKeyboardListeners(),
                setupAppStateListener(),
                initializeSocketConnection()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupVoiceRecognition();
        cleanupSocketListeners();
        cleanupKeyboardListeners();
        cleanupAppStateListener();
    };

    // 소켓 연결 관리
    const initializeSocketConnection = () => {
        socket.connect();
        socket.emit('userOnline', user.id);
    };

    const initializeSocketListeners = () => {
        socket.on('newMessage', handleNewMessage);
        socket.on('chatStatusUpdate', handleChatStatusUpdate);
        socket.on('userOnlineStatus', handleUserOnlineStatus);
        socket.on('typingStatus', handleTypingStatus);
    };

    const cleanupSocketListeners = () => {
        socket.off('newMessage');
        socket.off('chatStatusUpdate');
        socket.off('userOnlineStatus');
        socket.off('typingStatus');
    };

    // 음성 인식 초기화
    const initializeVoiceRecognition = async () => {
        try {
            await Voice.initialize();
            Voice.onSpeechStart = onSpeechStart;
            Voice.onSpeechEnd = onSpeechEnd;
            Voice.onSpeechResults = onSpeechResults;
            Voice.onSpeechError = onSpeechError;
        } catch (error) {
            console.error('Voice recognition initialization failed:', error);
            Alert.alert('음성 인식 오류', '음성 인식 기능을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupVoiceRecognition = async () => {
        try {
            await Voice.destroy();
            Voice.removeAllListeners();
        } catch (error) {
            console.error('Voice recognition cleanup failed:', error);
        }
    };

    // 키보드 이벤트 리스너
    const setupKeyboardListeners = () => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    };

    const handleKeyboardShow = (event) => {
        Animated.parallel([
            Animated.timing(searchBarWidth, {
                toValue: SCREEN_WIDTH * 0.6,
                duration: 250,
                useNativeDriver: false
            }),
            Animated.timing(headerOpacity, {
                toValue: 0.95,
                duration: 250,
                useNativeDriver: false
            })
        ]).start();
    };

    const handleKeyboardHide = () => {
        Animated.parallel([
            Animated.timing(searchBarWidth, {
                toValue: SCREEN_WIDTH * 0.7,
                duration: 200,
                useNativeDriver: false
            }),
            Animated.timing(headerOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false
            })
        ]).start();
    };

    // 앱 상태 리스너
    const setupAppStateListener = () => {
        AppState.addEventListener('change', handleAppStateChange);
    };

    const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            fetchChatRooms();
            socket.connect();
        } else if (nextAppState === 'background') {
            socket.disconnect();
        }
    };

    // 이미지 프리페칭
    const prefetchImages = async (rooms = chatRooms) => {
        try {
            const imagesToPrefetch = rooms
                .slice(0, 20)
                .map(chat => ({
                    uri: chat.profileImage,
                    priority: FastImage.priority.high
                }));

            await FastImage.preload(imagesToPrefetch);
        } catch (error) {
            console.error('Image prefetch failed:', error);
        }
    };

    // 채팅방 데이터 가져오기
    const fetchChatRooms = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch(updateChatList(response.data));
            await prefetchImages(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
            setIsLoading(false);
            Alert.alert('오류', '채팅방 목록을 불러오는데 실패했습니다.');
        }
    };

    // 이벤트 핸들러
    const handleNewMessage = useCallback((message) => {
        dispatch(updateChatList(message));

        if (AppState.currentState !== 'active') {
            showMessageNotification(message);
        }

        if (!showScrollToTop) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }

        // 새 메시지 알림 애니메이션
        showNewMessageAnimation(message);
    }, [showScrollToTop]);

    const showNewMessageAnimation = (message) => {
        setNewMessageNotification(message);
        Animated.sequence([
            Animated.timing(notificationAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.delay(3000),
            Animated.timing(notificationAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => setNewMessageNotification(null));
    };

    // 음성 인식 핸들러
    const onSpeechStart = () => {
        setIsVoiceListening(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const onSpeechEnd = () => {
        setIsVoiceListening(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onSpeechResults = (e) => {
        if (e.value && e.value[0]) {
            setSearchQuery(e.value[0]);
            processVoiceCommand(e.value[0]);
        }
        setIsVoiceListening(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const onSpeechError = (error) => {
        console.error('Speech recognition error:', error);
        setIsVoiceListening(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('오류', '음성 인식에 실패했습니다.');
    };

    // AI 어시스턴트
    const processVoiceCommand = async (command) => {
        try {
            const response = await axios.post(`${API_URL}/api/ai/process-command`, {
                command,
                context: 'chat'
            });

            const { action, params } = response.data;
            executeAiCommand(action, params);
        } catch (error) {
            console.error('AI command processing failed:', error);
            Alert.alert('오류', 'AI 명령 처리에 실패했습니다.');
        }
    };

    const executeAiCommand = (action, params) => {
        switch (action) {
            case 'search':
                setSearchQuery(params.query);
                break;
            case 'openChat':
                navigation.navigate('ChatRoom', { chatId: params.chatId });
                break;
            case 'createChat':
                navigation.navigate('NewChat', { initialUsers: params.users });
                break;
            default:
                Alert.alert('알림', '인식할 수 없는 명령입니다.');
        }
    };

    // 렌더링 메서드
    const renderHeader = () => (
        <Animated.View
            style={[
                styles.header,
                {
                    height: headerHeight,
                    opacity: headerOpacity,
                    shadowOpacity,
                    transform: [{
                        translateY: scrollY.interpolate({
                            inputRange: [0, 100],
                            outputRange: [0, -30],
                            extrapolate: 'clamp',
                        }),
                    }],
                },
            ]}
        >
            <View style={styles.searchContainer}>
                <MaterialIcons
                    name="search"
                    size={24}
                    color="#757575"
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={searchInputRef}
                    style={[
                        styles.searchBar,
                        { width: searchBarWidth }
                    ]}
                    placeholder="채팅 검색"
                    placeholderTextColor="#757575"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    accessible={true}
                    accessibilityLabel="채팅방 검색"
                    accessibilityHint="채팅방을 검색할 수 있습니다"
                />
                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={startVoiceRecognition}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessible={true}
                    accessibilityLabel="음성 검색"
                    accessibilityHint="음성으로 채팅방을 검색합니다"
                >
                    <MaterialIcons
                        name={isVoiceListening ? "mic" : "mic-none"}
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.aiAssistantButton}
                    onPress={() => setAiAssistantActive(prev => !prev)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessible={true}
                    accessibilityLabel="AI 어시스턴트"
                    accessibilityHint="AI 어시스턴트를 통해 채팅방을 검색하고 대화를 시작할 수 있습니다"
                >
                    <MaterialIcons
                        name={aiAssistantActive ? "assistant" : "assistant-outline"}
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessible={true}
                    accessibilityLabel="프로필"
                    accessibilityHint="프로필 페이지로 이동합니다"
                >
                    <FastImage
                        style={styles.profileImage}
                        source={{
                            uri: user?.profileImage,
                            priority: FastImage.priority.high
                        }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderChatItem = useCallback(({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[item.id] = ref}
                renderRightActions={() => renderRightActions(item.id)}
                enabled={!isMultiSelectMode}
                onSwipeableWillOpen={() => {
                    Object.keys(swipeableRefs.current).forEach(key => {
                        if (key !== item.id && swipeableRefs.current[key]?.close) {
                            swipeableRefs.current[key].close();
                        }
                    });
                }}
                rightThreshold={SWIPE_THRESHOLD}
            >
                <TouchableOpacity
                    style={[
                        styles.chatItem,
                        isSelected && styles.selectedChatItem
                    ]}
                    onPress={() => handleChatPress(item)}
                    onLongPress={() => handleLongPress(item.id)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityLabel={`${item.name}과의 채팅방`}
                    accessibilityHint="채팅방으로 이동하거나 길게 눌러 선택할 수 있습니다"
                >
                    <FastImage
                        style={styles.chatProfileImage}
                        source={{
                            uri: item.profileImage,
                            priority: FastImage.priority.normal,
                            cache: FastImage.cacheControl.immutable
                        }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                    <View style={styles.chatInfo}>
                        <Text
                            style={styles.chatName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.name}
                        </Text>
                        <Text
                            style={styles.lastMessage}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.lastMessage}
                        </Text>
                    </View>
                    <View style={styles.chatMeta}>
                        <Text style={styles.timeStamp}>
                            {formatRelativeTime(item.lastMessageTime)}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedItems, isMultiSelectMode]);

    const renderRightActions = useCallback((chatId) => (
        <View style={styles.swipeActions}>
            <TouchableOpacity
                style={[styles.swipeButton, styles.notificationButton]}
                onPress={() => handleNotificationToggle(chatId)}
                accessible={true}
                accessibilityLabel="알림 설정"
                accessibilityHint="채팅방 알림을 켜거나 끌 수 있습니다"
            >
                <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.swipeButton, styles.blockButton]}
                onPress={() => handleBlockChat(chatId)}
                accessible={true}
                accessibilityLabel="차단"
                accessibilityHint="채팅방을 차단합니다"
            >
                <MaterialIcons name="block" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    ), []);

    const renderFAB = () => (
        <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NewChat')}
            onLongPress={handleFABLongPress}
            delayLongPress={500}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="새 채팅"
            accessibilityHint="새로운 채팅방을 생성합니다"
        >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    );

    const renderTabBar = () => (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('Home');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessible={true}
                accessibilityLabel="홈"
                accessibilityHint="홈 화면으로 이동합니다"
            >
                <MaterialIcons name="home" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabItem, styles.activeTab]}
                onPress={() => {
                    navigation.navigate('Chat');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessible={true}
                accessibilityLabel="채팅"
                accessibilityHint="채팅 목록으로 이동합니다"
            >
                <MaterialIcons name="chat" size={28} color="#4A90E2" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('PersonalStudy');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessible={true}
                accessibilityLabel="개인 학습"
                accessibilityHint="개인 학습 페이지로 이동합니다"
            >
                <MaterialIcons name="person" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('GroupStudy');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessible={true}
                accessibilityLabel="그룹 학습"
                accessibilityHint="그룹 학습 페이지로 이동합니다"
            >
                <MaterialIcons name="group" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('MyPage');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessible={true}
                accessibilityLabel="마이페이지"
                accessibilityHint="마이페이지로 이동합니다"
            >
                <MaterialIcons name="person" size={28} color="#757575" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
                translucent={false}
            />

            {renderHeader()}

            <FlatList
                ref={flatListRef}
                data={chatRooms}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatList}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator
                            size="large"
                            color="#4A90E2"
                            style={styles.loader}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons
                                name="chat-bubble-outline"
                                size={48}
                                color="#CCCCCC"
                            />
                            <Text style={styles.emptyText}>
                                채팅이 없습니다
                            </Text>
                        </View>
                    )
                }
                windowSize={5}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
                initialNumToRender={10}
            />

            {renderFAB()}
            {renderTabBar()}

            {showNewMessageNotification && (
                <Animated.View
                    style={[
                        styles.notification,
                        {
                            transform: [{
                                translateY: notificationAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-100, 0]
                                })
                            }]
                        }
                    ]}
                >
                    <FastImage
                        style={styles.notificationImage}
                        source={{
                            uri: newMessageNotification?.sender.profileImage,
                            priority: FastImage.priority.high
                        }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                    <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>
                            {newMessageNotification?.sender.name}
                        </Text>
                        <Text style={styles.notificationMessage}>
                            {newMessageNotification?.message}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

// styles 객체 정의
const styles = StyleSheet.create({
    // 컨테이너 스타일
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // 상단 바 스타일
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        backgroundColor: '#FFFFFF',
        zIndex: 1000,
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: 16,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4,
    },

    // 검색 컨테이너
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        height: SEARCH_BAR_HEIGHT,
    },

    // 검색바
    searchBar: {
        flex: 1,
        height: SEARCH_BAR_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingLeft: 44,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    // 검색 아이콘
    searchIcon: {
        position: 'absolute',
        left: 28,
        top: 13,
        zIndex: 1,
    },

    // 음성 검색 버튼
    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    // AI 어시스턴트 버튼
    aiAssistantButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    // 프로필 버튼
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 8,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
    },

    // 채팅 목록 컨테이너
    chatListContainer: {
        flex: 1,
        paddingTop: HEADER_HEIGHT + 8,
    },

    // 채팅 아이템
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        height: CHAT_ITEM_HEIGHT,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },

    // 선택된 채팅 아이템
    selectedChatItem: {
        backgroundColor: '#E3F2FD',
    },

    // 채팅방 프로필 이미지
    chatProfileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
    },

    // 채팅 정보 컨테이너
    chatInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },

    // 채팅방 이름
    chatName: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },

    // 마지막 메시지
    lastMessage: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    // 채팅 메타 정보
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },

    // 시간 표시
    timeStamp: {
        fontSize: 12,
        fontFamily: 'Roboto-Light',
        color: '#757575',
    },

    // 읽지 않은 메시지 배지
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },

    // 읽지 않은 메시지 카운트
    unreadCount: {
        fontSize: 12,
        fontFamily: 'Roboto-Bold',
        color: '#FFFFFF',
    },

    // 스와이프 액션
    swipeActions: {
        flexDirection: 'row',
        width: 160,
    },

    // 스와이프 버튼 기본
    swipeButton: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 알림 설정 버튼
    notificationButton: {
        backgroundColor: '#4A90E2',
    },

    // 차단 버튼
    blockButton: {
        backgroundColor: '#FF6B6B',
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 80,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    // 탭 바
    tabBar: {
        flexDirection: 'row',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    // 탭 아이템
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 활성화된 탭
    activeTab: {
        borderTopWidth: 2,
        borderTopColor: '#4A90E2',
    },

    // 새 메시지 알림
    notification: {
        position: 'absolute',
        top: HEADER_HEIGHT,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    // 알림 이미지
    notificationImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    // 알림 내용
    notificationContent: {
        flex: 1,
    },

    // 알림 제목
    notificationTitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },

    // 알림 메시지
    notificationMessage: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    // 로딩 인디케이터
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 빈 상태 컨테이너
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },

    // 빈 상태 텍스트
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },
});