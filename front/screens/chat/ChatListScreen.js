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
    ActivityIndicator,
    BackHandler,
    LayoutAnimation,
    UIManager,
    RefreshControl, ScrollView
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
import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Permissions from 'expo-permissions';
import { VictoryChart, VictoryBar, VictoryTheme, VictoryAxis } from 'victory-native';
import searchBar from "react-native-screens/src/components/SearchBar";

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 60;
const SOCKET_URL = 'YOUR_SOCKET_SERVER_URL';
const API_URL = 'YOUR_API_SERVER_URL';

// Socket 인스턴스 생성
let socket;

const ChatListScreen = () => {
    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const theme = useSelector(state => state.theme.current);

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
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [microphonePermission, setMicrophonePermission] = useState(null);
    const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showRecentContacts, setShowRecentContacts] = useState(false);
    const [recentContacts, setRecentContacts] = useState([]);
    const [aiAssistantMessage, setAiAssistantMessage] = useState('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [lastActiveTime, setLastActiveTime] = useState({});
    const [typingStatus, setTypingStatus] = useState({});
    const [imageUploadProgress, setImageUploadProgress] = useState({});
    const [pendingMessages, setPendingMessages] = useState([]);
    const [cachedImages, setCachedImages] = useState({});
    const [networkType, setNetworkType] = useState(null);
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [isLowPowerMode, setIsLowPowerMode] = useState(false);
    const [deviceOrientation, setDeviceOrientation] = useState('portrait');
    const [availableStorage, setAvailableStorage] = useState(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [activeFilters, setActiveFilters] = useState([]);
    const [sortOrder, setSortOrder] = useState('latest');
    const [groupedChats, setGroupedChats] = useState({});
    const [pinnedChats, setPinnedChats] = useState([]);
    const [mutedChats, setMutedChats] = useState([]);
    const [archivedChats, setArchivedChats] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [suggestedContacts, setSuggestedContacts] = useState([]);
    const [contactSync, setContactSync] = useState({
        lastSync: null,
        status: 'idle',
        progress: 0
    });

    // Animated Values
    const scrollY = useRef(new Animated.Value(0)).current;
    const searchBarWidth = useRef(new Animated.Value(width * 0.7)).current;
    const shadowOpacity = useRef(new Animated.Value(0)).current;
    const fabScale = useRef(new Animated.Value(1)).current;
    const notificationBadgeScale = useRef(new Animated.Value(1)).current;
    const notificationPanelSlide = useRef(new Animated.Value(width)).current;

    // Refs
    const swipeableRefs = useRef({});
    const searchInputRef = useRef(null);
    const listRef = useRef(null);
    const syncTimeoutRef = useRef(null);
    const socketRef = useRef(null);
    const notificationListener = useRef();
    const responseListener = useRef();
    const recordingTimeoutRef = useRef(null);
    const keyboardDidShowListener = useRef(null);
    const keyboardDidHideListener = useRef(null);
    const networkListener = useRef(null);
    const orientationListener = useRef(null);
    const batteryListener = useRef(null);
    const storageListener = useRef(null);

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
        setupKeyboardListeners();
        setupOrientationListener();
        setupBatteryListener();
        setupStorageListener();
        setupBackHandler();
        setupNotifications();

        return () => {
            cleanup();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshChatList();
            return () => {
                closeAllSwipeables();
            };
        }, [])
    );

    useEffect(() => {
        filterChatRooms();
    }, [searchQuery, chatRooms]);

    // Socket Setup
    useEffect(() => {
        setupSocket();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user]);

    const setupSocket = () => {
        socket = io(SOCKET_URL, {
            auth: {
                token: user?.token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            setIsSocketConnected(true);
            console.log('Socket connected');
            syncOfflineMessages();
        });

        socket.on('disconnect', () => {
            setIsSocketConnected(false);
            console.log('Socket disconnected');
        });

        socket.on('newMessage', handleNewMessage);
        socket.on('messageRead', handleMessageRead);
        socket.on('userTyping', handleUserTyping);
        socket.on('userOnline', handleUserOnline);
        socket.on('userOffline', handleUserOffline);
        socket.on('messageDeleted', handleMessageDeleted);
        socket.on('chatCleared', handleChatCleared);
        socket.on('userBlocked', handleUserBlocked);
        socket.on('userUnblocked', handleUserUnblocked);
        socket.on('groupCreated', handleGroupCreated);
        socket.on('groupUpdated', handleGroupUpdated);
        socket.on('groupDeleted', handleGroupDeleted);
        socket.on('memberAdded', handleMemberAdded);
        socket.on('memberRemoved', handleMemberRemoved);
        socket.on('adminChanged', handleAdminChanged);

        socketRef.current = socket;
    };

    // Initialize
    const initializeScreen = async () => {
        try {
            setIsLoading(true);
            await Promise.all([
                checkPermissions(),
                loadCachedData(),
                fetchChatRooms(),
                fetchNotifications(),
                setupPushNotifications(),
                initializeVoiceRecognition(),
                checkStorageSpace(),
                syncContactList(),
                loadUserPreferences()
            ]);
        } catch (error) {
            console.error('Initialization error:', error);
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Permission Checks
    const checkPermissions = async () => {
        try {
            const [cameraStatus, microphoneStatus, mediaLibraryStatus] = await Promise.all([
                Camera.requestPermissionsAsync(),
                Audio.requestPermissionsAsync(),
                MediaLibrary.requestPermissionsAsync()
            ]);

            setCameraPermission(cameraStatus.status === 'granted');
            setMicrophonePermission(microphoneStatus.status === 'granted');
            setMediaLibraryPermission(mediaLibraryStatus.status === 'granted');

            if (!cameraStatus.granted || !microphoneStatus.granted || !mediaLibraryStatus.granted) {
                Alert.alert(
                    '권한 필요',
                    '앱의 원활한 사용을 위해 카메라, 마이크, 미디어 라이브러리 접근 권한이 필요합니다.',
                    [
                        {
                            text: '설정으로 이동',
                            onPress: () => Linking.openSettings()
                        },
                        {
                            text: '취소',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Permission check error:', error);
            handleError(error);
        }
    };

    // Notifications Setup
    const setupPushNotifications = async () => {
        try {
            const {status: existingStatus} = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const {status} = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                throw new Error('알림 권한이 거부되었습니다.');
            }

            const token = await Notifications.getExpoPushTokenAsync();
            await updatePushToken(token.data);

            notificationListener.current = Notifications.addNotificationReceivedListener(
                handleNotification
            );

            responseListener.current = Notifications.addNotificationResponseReceivedListener(
                handleNotificationResponse
            );
        } catch (error) {
            console.error('Push notification setup error:', error);
            handleError(error);
        }
    };

    // Data Fetching
    const fetchChatRooms = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/chat/rooms`, {
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
            handleError(error);
        }
    };

    // Data Processing
    const processChatRoomsData = (data) => {
        return data.map(room => ({
            ...room,
            lastMessageTime: formatMessageTime(room.lastMessageTime),
            unreadCount: parseInt(room.unreadCount),
            isPinned: pinnedChats.includes(room.id),
            isMuted: mutedChats.includes(room.id),
            isArchived: archivedChats.includes(room.id)
        })).sort((a, b) => {
            // 고정된 채팅방 우선
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // 정렬 옵션에 따라
            switch (sortOrder) {
                case 'latest':
                    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
                case 'unread':
                    return b.unreadCount - a.unreadCount;
                case 'alphabetical':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    };

    // 채팅방 그룹화
    const groupChatRooms = (rooms) => {
        return rooms.reduce((groups, room) => {
            if (room.isPinned) {
                groups.pinned = [...(groups.pinned || []), room];
            } else if (room.isArchived) {
                groups.archived = [...(groups.archived || []), room];
            } else {
                groups.normal = [...(groups.normal || []), room];
            }
            return groups;
        }, {});
    };

    // 새 메시지 처리
    const handleNewMessage = useCallback(async (message) => {
        try {
            // 현재 채팅방에 새 메시지 추가
            const updatedChatRooms = chatRooms.map(room => {
                if (room.id === message.chatRoomId) {
                    return {
                        ...room,
                        lastMessage: message.content,
                        lastMessageTime: formatMessageTime(message.createdAt),
                        unreadCount: room.unreadCount + 1
                    };
                }
                return room;
            });

            // 알림 뱃지 애니메이션
            Animated.sequence([
                Animated.spring(notificationBadgeScale, {
                    toValue: 1.2,
                    useNativeDriver: true
                }),
                Animated.spring(notificationBadgeScale, {
                    toValue: 1,
                    useNativeDriver: true
                })
            ]).start();

            // 채팅방 목록 업데이트
            setChatRooms(updatedChatRooms);
            await cacheChatRoomsData(updatedChatRooms);

            // 푸시 알림 설정 확인 및 발송
            if (shouldShowNotification(message)) {
                await sendPushNotification(message);
            }

            // 오프라인 메시지 저장
            if (!isSocketConnected) {
                await storeOfflineMessage(message);
            }

            // 읽지 않은 메시지 수 업데이트
            updateUnreadMessageCount(message.chatRoomId);

        } catch (error) {
            console.error('New message handling error:', error);
            handleError(error);
        }
    }, [chatRooms, isSocketConnected]);

    // 메시지 읽음 처리
    const handleMessageRead = useCallback(async (data) => {
        try {
            const {chatRoomId, userId} = data;
            const updatedChatRooms = chatRooms.map(room => {
                if (room.id === chatRoomId) {
                    return {
                        ...room,
                        unreadCount: 0
                    };
                }
                return room;
            });

            setChatRooms(updatedChatRooms);
            await cacheChatRoomsData(updatedChatRooms);

            // 읽음 상태 서버 동기화
            await syncMessageReadStatus(chatRoomId, userId);

        } catch (error) {
            console.error('Message read handling error:', error);
            handleError(error);
        }
    }, [chatRooms]);

    // 오프라인 메시지 저장
    const storeOfflineMessage = async (message) => {
        try {
            const offlineMessages = await AsyncStorage.getItem('offlineMessages');
            const messages = offlineMessages ? JSON.parse(offlineMessages) : [];
            messages.push(message);
            await AsyncStorage.setItem('offlineMessages', JSON.stringify(messages));
        } catch (error) {
            console.error('Store offline message error:', error);
        }
    };

    // 오프라인 메시지 동기화
    const syncOfflineMessages = async () => {
        try {
            const offlineMessages = await AsyncStorage.getItem('offlineMessages');
            if (offlineMessages) {
                const messages = JSON.parse(offlineMessages);
                for (const message of messages) {
                    await socket.emit('sendMessage', message);
                }
                await AsyncStorage.removeItem('offlineMessages');
            }
        } catch (error) {
            console.error('Sync offline messages error:', error);
        }
    };

    // 채팅방 차단
    const handleBlockChat = async (chatId) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const response = await fetch(`${API_URL}/chat/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({chatRoomId: chatId})
            });

            if (!response.ok) throw new Error('Failed to block chat');

            const updatedChatRooms = chatRooms.filter(room => room.id !== chatId);
            setChatRooms(updatedChatRooms);
            await cacheChatRoomsData(updatedChatRooms);

            // 차단된 채팅방 정보 저장
            await AsyncStorage.setItem('blockedChats', JSON.stringify([
                ...blockedChats,
                chatId
            ]));

            Alert.alert('알림', '채팅방이 차단되었습니다.');

        } catch (error) {
            console.error('Block chat error:', error);
            Alert.alert('오류', '채팅방 차단에 실패했습니다.');
        }
    };

    // 알림 설정
    const handleNotificationSettings = async (chatId) => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const currentSettings = await AsyncStorage.getItem('notificationSettings');
            const settings = currentSettings ? JSON.parse(currentSettings) : {};

            const isMuted = settings[chatId];

            const updatedSettings = {
                ...settings,
                [chatId]: !isMuted
            };

            await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));

            // 서버에 알림 설정 동기화
            await syncNotificationSettings(chatId, !isMuted);

            Alert.alert('알림', `알림이 ${!isMuted ? '해제' : '설정'}되었습니다.`);

        } catch (error) {
            console.error('Notification settings error:', error);
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    };

    // AI 어시스턴트 처리
    const handleAIAssistant = async () => {
        try {
            setShowAIAssistant(true);
            setIsProcessingVoice(true);

            const voiceResult = await startVoiceRecognition();
            if (voiceResult) {
                const response = await processAICommand(voiceResult);
                setAiAssistantMessage(response);

                if (response.action) {
                    executeAIAction(response.action);
                }
            }
        } catch (error) {
            console.error('AI Assistant error:', error);
            setAiAssistantMessage('죄송합니다. 요청을 처리하는 중에 오류가 발생했습니다.');
        } finally {
            setIsProcessingVoice(false);
        }
    };

    // AI 명령 실행
    const executeAIAction = async (action) => {
        try {
            switch (action.type) {
                case 'SEARCH_CHAT':
                    setSearchQuery(action.query);
                    break;
                case 'CREATE_CHAT':
                    navigation.navigate('NewChat', {initialData: action.data});
                    break;
                case 'JOIN_GROUP':
                    navigation.navigate('GroupChat', {groupId: action.groupId});
                    break;
                default:
                    console.warn('Unknown AI action type:', action.type);
            }
        } catch (error) {
            console.error('Execute AI action error:', error);
            Alert.alert('오류', 'AI 명령을 실행하는 중에 오류가 발생했습니다.');
        }
    };

    // 음성 인식 시작
    const startVoiceRecognition = async () => {
        try {
            await Voice.start('ko-KR');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsVoiceListening(true);

            return new Promise((resolve, reject) => {
                Voice.onSpeechResults = (e) => {
                    const text = e.value[0];
                    setIsVoiceListening(false);
                    Voice.stop();
                    resolve(text);
                };

                Voice.onSpeechError = (e) => {
                    setIsVoiceListening(false);
                    reject(e);
                };
            });
        } catch (error) {
            console.error('Voice recognition error:', error);
            setIsVoiceListening(false);
            Alert.alert('음성 인식 오류', '음성 인식을 시작할 수 없습니다.');
            return null;
        }
    };

    // 에러 처리
    const handleError = (error) => {
        console.error('Error:', error);

        // 네트워크 에러 처리
        if (!networkStatus) {
            Alert.alert(
                '네트워크 오류',
                '인터넷 연결을 확인해주세요.',
                [
                    {
                        text: '재시도',
                        onPress: () => syncData()
                    }
                ]
            );
            return;
        }

        // 인증 에러 처리
        if (error.message.includes('authentication')) {
            dispatch(logout());
            navigation.reset({
                index: 0,
                routes: [{name: 'Login'}]
            });
            return;
        }

        // 기타 에러 처리
        Alert.alert(
            '오류',
            '알 수 없는 오류가 발생했습니다.',
            [
                {
                    text: '재시도',
                    onPress: () => syncData()
                }
            ]
        );
    };

    // 정리 함수
    const cleanup = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        Voice.destroy().then(Voice.removeAllListeners);
        closeAllSwipeables();
    };

    if(isLoading){
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size='large'
                    color='#4A90E2'
                />
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <StatusBar barStyle='dark-content'/>

            {/* 헤더 */}
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
                        {width: searchBarWidth}
                    ]}>
                        <MaterialIcons name='search' size={24} color='#757575'/>
                        <TextInput
                            ref={searchInputRef}
                            style={styles.searchInput}
                            placeholder='채팅 검색'
                            placeholderTextColor='#757575'
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType='search'
                            onSubmitEditing={() => Keyboard.dismiss()}
                            accessibilityLabel='채팅방 검색'
                        />
                        <TouchableOpacity
                            onPress={startVoiceRecognition}
                            style={styles.voiceButton}
                            disabled={isVoiceListening}
                            accessibilityLabel='음성 검색'
                        >
                            <MaterialIcons
                                name='mic'
                                size={24}
                                color={isVoiceListening ? '#4A90E2' : '#757575'}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity
                        onPress={handleAIAssistant}
                        style={styles.aiButton}
                        accessibilityLabel='AI 어시스턴트'
                    >
                        <MaterialIcons name='mic' size={24} color='white'/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MyPage')}
                        style={styles.profileButton}
                        accessibilityLabel='프로필로 이동'
                    >
                        <FastImage
                            source={{
                                uri: user?.profileImage,
                                priority: FastImage.priority.high,
                            }}
                            style={styles.profileImage}
                            defaultSource={require('../../assets/images/icons/user.png')}
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>
            {/* 채팅방 목록 */}
            <VirtualizedList
                data={filteredChatRooms}
                renderItem={renderChatRoom}
                keyExtractor={item => item.id}
                getItemCount={data => data.length}
                getItem={(data, index) => data[index]}
                onScroll={Animated.event(
                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                    {useNativeDriver: false}
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor='#4A09E2'
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>채팅방이 없습니다.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NewChat')}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowRecentContacts(true);
                }}
                accessibilityLabel="새 채팅방 만들기"
            />
            {/* AI 어시스턴트 모달 */}
            <Modal
                isVisible={showAIAssistant}
                onBackdropPress={() => setShowAIAssistant(false)}
                style={styles.modal}
                animationIn='slideInUp'
                animationOut='slideOutDown'
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>AI 어시스턴트</Text>
                    <View style={styles.modalBody}>
                        {isProcessingVoice ? (
                            <ActivityIndicator
                                size='large'
                                color='#4A90E2'
                            />
                        ) : (
                            <Text style={styles.modalText}>
                                {aiAssistantMessage || '무엇을 도와드릴까요?'}
                            </Text>
                        )}
                    </View>
                </View>
            </Modal>
            {/* 최근 연락처 모달 */}
            <Modal
                isVisible={showRecentContacts}
                onBackdropPress={() => setShowRecentContacts((false))}
                style={styles.modal}
                animationIn='slideInUp'
                animationOut='slideOutDown'
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>최근 연락처</Text>
                    <ScrollView>
                        {recentContacts.map((contact, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.contactItem}
                                onPress={() => {
                                    navigation.navigate('ChatRoom', {contactId: contact.id});
                                    setShowRecentContacts(false);
                                }}
                            >
                                <FastImage
                                    source={{uri: contact.profileImage}}
                                    style={styles.contactImage}
                                    defaultSource={require('../../assets/images/icons/user.png')}
                                />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactTime}>{contact.lastContactTime}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    )
}