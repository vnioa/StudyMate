// MainChatListScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Platform,
    Dimensions,
    StatusBar,
    Animated,
    Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Voice from '@react-native-voice/voice';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const CHAT_ITEM_HEIGHT = 80;

const MainChatListScreen = () => {
    // States
    const [searchText, setSearchText] = useState('');
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedChats, setSelectedChats] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showRecommendModal, setShowRecommendModal] = useState(false);

    // Refs
    const searchInputRef = useRef(null);
    const flatListRef = useRef(null);
    const swipeableRefs = useRef({});
    const scrollY = useRef(new Animated.Value(0)).current;
    const fabAnim = useRef(new Animated.Value(1)).current;

    // Navigation
    const navigation = useNavigation();

    // Animations
    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 20],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        initializeVoiceRecognition();
        loadChatList();
        setupKeyboardListeners();

        return () => {
            cleanupVoiceRecognition();
            cleanupKeyboardListeners();
        };
    }, []);

    useEffect(() => {
        filterChats();
    }, [searchText, chatList]);

    const initializeVoiceRecognition = async () => {
        try {
            await Voice.destroy();
            Voice.onSpeechStart = onSpeechStart;
            Voice.onSpeechEnd = onSpeechEnd;
            Voice.onSpeechResults = onSpeechResults;
            Voice.onSpeechError = onSpeechError;
        } catch (error) {
            console.error('Voice recognition initialization error:', error);
        }
    };

    const cleanupVoiceRecognition = () => {
        Voice.destroy().then(Voice.removeAllListeners);
    };

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

    const handleKeyboardShow = () => {
        Animated.timing(fabAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handleKeyboardHide = () => {
        Animated.timing(fabAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const loadChatList = async () => {
        setIsLoading(true);
        try {
            // API call implementation
            const response = await fetch('YOUR_API_ENDPOINT/chats');
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to load chat list');
            }

            setChatList(data);
            setFilteredChats(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filterChats = () => {
        if (!searchText.trim()) {
            setFilteredChats(chatList);
            return;
        }

        const filtered = chatList.filter(chat =>
            chat.name.toLowerCase().includes(searchText.toLowerCase()) ||
            chat.lastMessage?.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredChats(filtered);
    };

    const onSpeechStart = () => {
        setIsVoiceListening(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onSpeechEnd = () => {
        setIsVoiceListening(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const onSpeechResults = (e) => {
        if (e.value && e.value[0]) {
            setSearchText(e.value[0]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const onSpeechError = (e) => {
        console.error('Speech recognition error:', e);
        setIsVoiceListening(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const handleVoiceSearch = async () => {
        try {
            if (isVoiceListening) {
                await Voice.stop();
            } else {
                await Voice.start('ko-KR');
            }
        } catch (error) {
            console.error('Voice search error:', error);
        }
    };

    const handleChatSelect = useCallback((chatId) => {
        if (isSelectionMode) {
            setSelectedChats(prev => {
                if (prev.includes(chatId)) {
                    return prev.filter(id => id !== chatId);
                }
                return [...prev, chatId];
            });
            Haptics.selectionAsync();
        } else {
            navigation.navigate('ChatRoom', { chatId });
        }
    }, [isSelectionMode, navigation]);

    const handleLongPress = useCallback((chatId) => {
        setIsSelectionMode(true);
        setSelectedChats([chatId]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleSwipeLeft = useCallback((chatId) => {
        // Block chat implementation
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleSwipeRight = useCallback((chatId) => {
        // Toggle notification implementation
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const renderChatItem = useCallback(({ item }) => {
        const isSelected = selectedChats.includes(item.id);

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[item.id] = ref}
                renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, item.id)
                }
                renderLeftActions={(progress, dragX) =>
                    renderLeftActions(progress, dragX, item.id)
                }
                onSwipeableOpen={(direction) => {
                    if (direction === 'left') {
                        handleSwipeLeft(item.id);
                    } else {
                        handleSwipeRight(item.id);
                    }
                }}
                rightThreshold={70}
                leftThreshold={70}
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
                        source={{ uri: item.profileImage }}
                        style={styles.profileImage}
                        defaultSource={require('../assets/default-profile.png')}
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
                        <Text style={styles.timeText}>
                            {formatTimestamp(item.lastMessageTime)}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedChats, isSelectionMode]);

    const renderRightActions = (progress, dragX, chatId) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.rightActions}>
                <Animated.View style={[
                    styles.actionButton,
                    { transform: [{ scale }] }
                ]}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.notificationButton]}
                        onPress={() => handleSwipeRight(chatId)}
                    >
                        <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    };

    const renderLeftActions = (progress, dragX, chatId) => {
        const scale = dragX.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.leftActions}>
                <Animated.View style={[
                    styles.actionButton,
                    { transform: [{ scale }] }
                ]}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.blockButton]}
                        onPress={() => handleSwipeLeft(chatId)}
                    >
                        <MaterialIcons name="block" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 상단 바 */}
            <Animated.View style={[
                styles.header,
                { shadowOpacity: headerShadowOpacity }
            ]}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={24} color="#757575" />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="채팅 검색"
                        placeholderTextColor="#757575"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity
                        onPress={handleVoiceSearch}
                        style={styles.voiceButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons
                            name={isVoiceListening ? "mic" : "mic-none"}
                            size={24}
                            color="#757575"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.aiButton}
                    onPress={() => {
                        // AI assistant implementation
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="mic" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => navigation.navigate('Profile')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <FastImage
                        source={{ uri: 'YOUR_PROFILE_IMAGE_URL' }}
                        style={styles.profileButtonImage}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                </TouchableOpacity>
            </Animated.View>

            {/* 채팅 목록 */}
            <FlatList
                ref={flatListRef}
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatList}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                getItemLayout={(data, index) => ({
                    length: CHAT_ITEM_HEIGHT,
                    offset: CHAT_ITEM_HEIGHT * index,
                    index,
                })}
            />

            {/* 플로팅 액션 버튼 */}
            <Animated.View style={[
                styles.fabContainer,
                {
                    transform: [
                        { scale: fabAnim },
                        {
                            translateY: fabAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0],
                            }),
                        },
                    ],
                },
            ]}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('NewChat')}
                    onLongPress={() => {
                        setShowRecommendModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                >
                    <MaterialIcons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* 하단 탭 네비게이션 */}
            <View style={styles.tabBar}>
                {['home', 'chat', 'person', 'group', 'settings'].map((icon, index) => (
                    <TouchableOpacity
                        key={icon}
                        style={styles.tabItem}
                        onPress={() => {
                            Haptics.selectionAsync();
                            // Tab navigation implementation
                        }}
                    >
                        <MaterialIcons
                            name={icon}
                            size={28}
                            color={index === 1 ? '#4A90E2' : '#757575'}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* 추천 채팅 모달 */}
            <Modal
                isVisible={showRecommendModal}
                onBackdropPress={() => setShowRecommendModal(false)}
                style={styles.recommendModal}
                animationIn="slideInUp"
                animationOut="slideOutDown"
            >
                <View style={styles.recommendContainer}>
                    <Text style={styles.recommendTitle}>추천 채팅</Text>
                    <FlatList
                        data={recentChats}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.recommendItem}
                                onPress={() => {
                                    navigation.navigate('ChatRoom', { chatId: item.id });
                                    setShowRecommendModal(false);
                                }}
                            >
                                <FastImage
                                    source={{ uri: item.profileImage }}
                                    style={styles.recommendProfile}
                                    defaultSource={require('../assets/default-profile.png')}
                                />
                                <View style={styles.recommendInfo}>
                                    <Text style={styles.recommendName}>{item.name}</Text>
                                    <Text style={styles.recommendLastMessage} numberOfLines={1}>
                                        {item.lastMessage}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                    />
                </View>
            </Modal>

            {/* 프로필 상세 모달 */}
            <Modal
                isVisible={showProfileModal}
                onBackdropPress={() => setShowProfileModal(false)}
                style={styles.profileModal}
                animationIn="zoomIn"
                animationOut="zoomOut"
            >
                {selectedProfile && (
                    <View style={styles.profileContainer}>
                        <FastImage
                            source={{ uri: selectedProfile.profileImage }}
                            style={styles.modalProfileImage}
                            defaultSource={require('../assets/default-profile.png')}
                        />
                        <Text style={styles.modalName}>{selectedProfile.name}</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.messageButton]}
                                onPress={() => {
                                    navigation.navigate('ChatRoom', { chatId: selectedProfile.id });
                                    setShowProfileModal(false);
                                }}
                            >
                                <MaterialIcons name="message" size={24} color="#FFFFFF" />
                                <Text style={styles.buttonText}>메시지</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.blockButton]}
                                onPress={() => {
                                    handleBlockChat(selectedProfile.id);
                                    setShowProfileModal(false);
                                }}
                            >
                                <MaterialIcons name="block" size={24} color="#FFFFFF" />
                                <Text style={styles.buttonText}>차단</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>

            {/* 다중 선택 모드 헤더 */}
            {isSelectionMode && (
                <View style={styles.selectionHeader}>
                    <Text style={styles.selectionCount}>
                        {selectedChats.length}개 선택됨
                    </Text>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                            setIsSelectionMode(false);
                            setSelectedChats([]);
                        }}
                    >
                        <Text style={styles.cancelText}>취소</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: Platform.OS === 'android' ? 5 : 0,
    },
    searchContainer: {
        flex: 1,
        height: 50,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
        color: '#333333',
    },
    voiceButton: {
        padding: 8,
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#E0E0E0',
    },
    profileButtonImage: {
        width: '100%',
        height: '100%',
    },
    chatList: {
        paddingVertical: 8,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        height: CHAT_ITEM_HEIGHT,
    },
    selectedChatItem: {
        backgroundColor: '#E3F2FD',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
    },
    chatInfo: {
        flex: 1,
        marginLeft: 12,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    lastMessage: {
        fontSize: 14,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 40,
    },
    timeText: {
        fontSize: 12,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Light',
    },
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
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
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
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    tabBar: {
        flexDirection: 'row',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recommendModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    recommendContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: height * 0.7,
    },
    recommendTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    recommendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    recommendProfile: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
    },
    recommendInfo: {
        flex: 1,
        marginLeft: 12,
    },
    recommendName: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    recommendLastMessage: {
        fontSize: 14,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    profileModal: {
        margin: 20,
    },
    profileContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    modalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        minWidth: 120,
    },
    messageButton: {
        backgroundColor: '#4A90E2',
    },
    blockButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    selectionHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#4A90E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 2,
    },
    selectionCount: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    }
});

export default MainChatListScreen;