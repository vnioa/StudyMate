import React, { useState, useEffect, useRef } from 'react';
import {
    Alert,
    StyleSheet,
    Animated,
    FlatList,
    ScrollView,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    Text,
    ActivityIndicator
} from 'react-native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';
import {API_URL} from '../../config/api';
import {Feather, MaterialIcons} from '@expo/vector-icons';

const MainChatListScreen = (navigation) => {
    const [chats, setChats] = useState([]);                 // 채팅 목록 상태
    const [searchText, setSearchText] = useState('');       // 검색어 상태
    const [darkMode, setDarkMode] = useState(false);        // 다크 모드 상태
    const [filteredChats, setFilteredChats] = useState([]); // 고급 검색 필터링된 결과 상태
    const [selectedDate, setSelectedDate] = useState(null); // 날짜별 검색 상태
    const [favorites, setFavorites] = useState([]);         // 즐겨찾기된 채팅방 상태
    const [unreadCounts, setUnreadCounts] = useState({});   // 읽지 않은 메시지 수 상태
    const [mutedChats, setMutedChats] = useState([]);       // 알림 설정 토글 상태
    const [pinnedMessages, setPinnedMessages] = useState([]); // 고정된 메시지
    const colorScheme = useColorScheme();                   // 현재 색상 모드 확인
    const scrollY = useRef(new Animated.Value(0)).current;  // 스크롤 위치 감지
    const listRef = useRef(null);                           // 자동 스크롤을 위한 리스트 참조
    const fadeAnim = useRef(new Animated.Value(1)).current; // 채팅방 추가/삭제 애니메이션
    const [loading, setLoading] = useState(true);       // 로딩 상태

    useEffect(() => {
        setDarkMode(colorScheme === 'dark');
        fetchChats();
    }, [colorScheme]);

    // 채팅방 목록 불러오기
    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/chatrooms`); // 서버에서 채팅방 목록 가져오기
                setChatRooms(response.data);
                setFilteredChats(response.data); // 필터링된 목록 초기화
            } catch (error) {
                console.error('Failed to fetch chat rooms:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChatRooms();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    // 채팅 목록 정렬 (즐겨찾기, 고정 메시지, 읽지 않은 메시지 등 우선)
    const sortChats = (chatsData) => {
        const favoriteChats = chatsData.filter(chat => favorites.includes(chat.id));
        const unreadChats = chatsData.filter(chat => unreadCounts[chat.id] > 0);
        const pinnedChats = chatsData.filter(chat => pinnedMessages.includes(chat.id));
        const regularChats = chatsData.filter(chat => !favorites.includes(chat.id) && !pinnedMessages.includes(chat.id));
        return [...favoriteChats, ...pinnedChats, ...unreadChats, ...regularChats];
    };

    // 고급 검색 기능 (검색어, 날짜, 특정 사용자 기반)
    const handleSearch = (text, date = null, user = null) => {
        setSearchText(text);
        setSelectedDate(date);
        const filtered = chats.filter(chat => {
            const matchesText = chat.name.toLowerCase().includes(text.toLowerCase());
            const matchesDate = date ? new Date(chat.lastMessageTime).toDateString() === date.toDateString() : true;
            const matchesUser = user ? chat.userId === user.id : true;
            return matchesText && matchesDate && matchesUser;
        });
        setFilteredChats(filtered);
    };

    // 채팅방 차단 처리
    const handleBlock = (chatId) => {
        Alert.alert("차단", `Chat ID: ${chatId}가 차단되었습니다.`);
        const updatedChats = chats.filter(chat => chat.id !== chatId);
        setChats(updatedChats);
        setFilteredChats(updatedChats);
    };

    // 채팅방 알림 설정 토글
    const handleToggleNotifications = (chatId) => {
        const isMuted = mutedChats.includes(chatId);
        const updatedMutedChats = isMuted ? mutedChats.filter(id => id !== chatId) : [...mutedChats, chatId];
        setMutedChats(updatedMutedChats);
        Alert.alert("알림 설정", `Chat ID: ${chatId} 알림이 ${isMuted ? '켜짐' : '꺼짐'}`);
    };

    // 시간대 기반 알림 설정
    const handleNotificationSchedule = (chatId, startTime, endTime) => {
        const currentTime = new Date().getHours();
        if (currentTime >= startTime && currentTime <= endTime) {
            Alert.alert("알림", `${startTime}:00 ~ ${endTime}:00 동안 알림이 활성화됩니다.`);
        } else {
            Alert.alert("알림 비활성화", `${startTime}:00 ~ ${endTime}:00 이외 시간입니다.`);
        }
    };

    // 다중 선택 모드 활성화 (길게 누르기)
    const handleLongPress = (chatId) => {
        Alert.alert("다중 선택 모드 활성화", `Chat ID: ${chatId}`);
    };

    // 채팅방 클릭 시 상세 페이지로 이동
    const handleChatPress = (chatId, chatName) => {
        Alert.alert("채팅방 진입", `${chatName}와의 채팅방입니다.`);
    };

    // 하단 플로팅 액션 버튼 클릭 시 새 채팅방 생성
    const handleNewChat = () => {
        Alert.alert("새 채팅 시작", "새로운 채팅방 생성");
    };

    // 스와이프 제스처 감지 시 햅틱 피드백 제공
    const handleSwipeGesture = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 메시지 핀 고정 기능
    const handlePinMessage = (chatId) => {
        const updatedPinnedMessages = pinnedMessages.includes(chatId)
            ? pinnedMessages.filter(id => id !== chatId)
            : [...pinnedMessages, chatId];
        setPinnedMessages(updatedPinnedMessages);
        setChats(sortChats(chats));
    };

    // 즐겨찾기 및 고정 채팅방 관리
    const handleFavoriteChat = (chatId) => {
        const isFavorite = favorites.includes(chatId);
        const updatedFavorites = isFavorite ? favorites.filter(id => id !== chatId) : [...favorites, chatId];
        setFavorites(updatedFavorites);
        setChats(sortChats(chats));
    };

    // 읽지 않은 메시지 관리
    const handleUnreadCountUpdate = (chatId, count) => {
        setUnreadCounts({ ...unreadCounts, [chatId]: count });
    };

    // 스크롤 애니메이션을 사용한 상단 바 그림자 효과
    const headerShadow = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 5],
        extrapolate: 'clamp'
    });

    // 애니메이션 효과: 채팅방 추가 시 페이드 인, 삭제 시 페이드 아웃
    const handleAddChat = (newChat) => {
        setChats([newChat, ...chats]);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleDeleteChat = (chatId) => {
        const updatedChats = chats.filter(chat => chat.id !== chatId);
        setChats(updatedChats);
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // 미디어 파일 관리
    const handleMediaView = (chatId) => {
        const chat = chats.find(chat => chat.id === chatId);
        if (chat && chat.media && chat.media.length > 0) {
            Alert.alert("미디어 파일", `${chat.media.length}개의 파일이 있습니다.`);
        } else {
            Alert.alert("미디어 파일 없음", "이 채팅방에는 미디어 파일이 없습니다.");
        }
    };

    // 새 메시지 도착 시 자동 스크롤
    const handleNewMessage = () => {
        if (listRef.current) {
            listRef.current.scrollToEnd({ animated: true });
        }
    };

    return (
        <View style={styles.container}>
            {/* 상단 검색 및 채팅방 생성 버튼 */}
            <View style={styles.headerContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="🔍 채팅 검색"
                    placeholderTextColor="#B0B0B5"
                    value={searchText}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity
                    style={styles.createChatButton}
                    onPress={handleNewChat}
                >
                    <Feather name="plus-circle" size={24} color="#4A90E2" />
                </TouchableOpacity>
            </View>

            {/* 채팅방 리스트 */}
            <FlatList
                data={filteredChats}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleChatPress(item.id, item.name)}
                        onLongPress={() => handleLongPress(item.id)}
                        activeOpacity={0.85}
                        style={styles.chatItem}
                    >
                        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
                        <View style={styles.infoContainer}>
                            <Text style={styles.chatName}>{item.name}</Text>
                            <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                        </View>
                        <View style={styles.chatMeta}>
                            <Text style={styles.messageTime}>{item.time}</Text>
                            {unreadCounts[item.id] > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadCount}>{unreadCounts[item.id]}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.chatListContainer}
            />

            {/* 플로팅 액션 버튼 */}
            <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
                <MaterialIcons name="chat" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F3F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    searchBar: {
        flex: 1,
        height: 44,
        fontSize: 16,
        paddingLeft: 10,
        borderRadius: 8,
        color: '#333',
    },
    createChatButton: {
        paddingLeft: 12,
        justifyContent: 'center',
    },
    chatListContainer: {
        paddingBottom: 80, // 플로팅 버튼을 고려한 여백
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    lastMessage: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    messageTime: {
        fontSize: 12,
        color: '#A1A1A1',
    },
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
    },
    unreadCount: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default MainChatListScreen;
