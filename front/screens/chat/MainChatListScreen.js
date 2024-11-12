import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, Animated, Alert, StyleSheet, useColorScheme } from 'react-native';
import axios from 'axios';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Voice from '@react-native-voice/voice';
import { useNavigation } from '@react-navigation/native';
import {API_URL} from '../../config/api';

const MainChatListScreen = () => {
    // 내비게이션 객체 생성
    const navigation = useNavigation();

    // 상태 변수들 초기화
    const [chatList, setChatList] = useState([]); // 채팅 목록 데이터
    const [searchQuery, setSearchQuery] = useState(''); // 검색 쿼리
    const [voiceInput, setVoiceInput] = useState(''); // 음성 입력
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const [selectedChats, setSelectedChats] = useState([]); // 선택된 채팅 목록
    const [isSelecting, setIsSelecting] = useState(false); // 다중 선택 모드 활성화 상태
    const scrollY = useRef(new Animated.Value(0)).current; // 스크롤 애니메이션 처리
    const colorScheme = useColorScheme(); // 시스템 다크 모드 여부 확인
    const isDarkMode = colorScheme === 'dark'; // 다크 모드 설정

    // 음성 검색 준비 및 채팅 목록을 가져오기 위한 useEffect
    useEffect(() => {
        fetchChatList(); // 채팅 목록 불러오기
        Voice.onSpeechResults = onSpeechResults; // 음성 인식 결과 콜백 설정
    }, []);

    // 채팅 목록을 서버에서 가져오는 비동기 함수
    const fetchChatList = async () => {
        setIsLoading(true); // 로딩 상태로 전환
        try {
            const response = await axios.get(`${API_URL}/api/chatRooms`); // 서버 API에서 채팅 목록 데이터 가져오기
            setChatList(response.data); // 가져온 데이터 설정
        } catch (error) {
            Alert.alert('Error', 'Failed to load chat list'); // 오류 발생 시 알림
        } finally {
            setIsLoading(false); // 로딩 상태 해제
        }
    };

    // 음성 인식 결과를 검색 쿼리에 반영하는 콜백 함수
    const onSpeechResults = (event) => setVoiceInput(event.value[0] || '');

    // 음성 검색 시작 함수
    const handleVoiceSearch = () => {
        try {
            Voice.start('en-US'); // 음성 인식 시작 (영어)
        } catch (e) {
            console.error(e);
        }
    };

    // 검색어 또는 음성 입력을 기준으로 채팅 목록 필터링
    const filteredChatList = chatList.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase() || voiceInput.toLowerCase())
    );

    // 채팅방 선택 또는 선택 해제
    const toggleSelection = (chatId) => {
        if (isSelecting) { // 다중 선택 모드 활성화된 경우
            const updatedSelection = selectedChats.includes(chatId)
                ? selectedChats.filter(id => id !== chatId) // 선택 해제
                : [...selectedChats, chatId]; // 선택 추가
            setSelectedChats(updatedSelection); // 선택된 채팅 목록 업데이트
        } else {
            navigation.navigate('ChatRoomScreen', { chatId }); // 채팅방으로 이동
        }
    };

    // 다중 선택 모드를 시작하고 첫 채팅방 선택
    const startSelecting = (chatId) => {
        setIsSelecting(true);
        toggleSelection(chatId);
    };

    // AI 어시스턴트 명령 실행 함수 (여기서 특정 명령 구현 가능)
    const AICommand = () => {
        // AI 어시스턴트를 통해 검색이나 특정 명령 수행
    };

    // 채팅방 차단 처리 함수
    const handleBlock = (chatId) => {
        Alert.alert('Block Chat', 'Are you sure you want to block this chat?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: () => {/* 블록 로직 추가 */} }
        ]);
    };

    // 채팅방 알림 설정 토글 함수
    const handleNotifications = (chatId) => {
        Alert.alert('Notifications', 'Toggle notifications for this chat?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: () => {/* 알림 토글 로직 추가 */} }
        ]);
    };

    // 스와이프 액션 컴포넌트 렌더링 함수
    const renderSwipeableActions = (progress, dragX, chatId) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp'
        });
        return (
            <Animated.View style={[styles.swipeActionContainer, { transform: [{ scale }] }]}>
                <TouchableOpacity onPress={() => handleBlock(chatId)} style={styles.blockAction}>
                    <MaterialIcons name="block" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNotifications(chatId)} style={styles.notificationAction}>
                    <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={styles.topBar}>
                {/* 검색바 */}
                <TextInput
                    style={styles.searchInput}
                    placeholder="채팅 검색"
                    placeholderTextColor={isDarkMode ? '#BBBBBB' : '#757575'}
                    value={searchQuery || voiceInput}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={handleVoiceSearch} style={styles.voiceSearchButton}>
                    <MaterialIcons name="mic" size={24} color={isDarkMode ? '#FFFFFF' : '#757575'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={AICommand} style={styles.aiAssistantButton}>
                    <MaterialIcons name="mic" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')} style={styles.profileIcon}>
                    <Image source={{ uri: '/path/to/profile/image' }} style={styles.profileImage} />
                </TouchableOpacity>
            </View>

            {/* 채팅 목록 표시 */}
            <Animated.FlatList
                data={filteredChatList}
                keyExtractor={(item) => item.id.toString()}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                renderItem={({ item }) => (
                    <Swipeable renderRightActions={(progress, dragX) => renderSwipeableActions(progress, dragX, item.id)}>
                        <TouchableOpacity
                            onLongPress={() => startSelecting(item.id)}
                            onPress={() => toggleSelection(item.id)}
                        >
                            <View style={[styles.chatItem, selectedChats.includes(item.id) && styles.selectedChatItem]}>
                                <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
                                <View style={styles.chatDetails}>
                                    <Text style={styles.chatName}>{item.name}</Text>
                                    <Text style={styles.lastMessage}>{item.lastMessage}</Text>
                                </View>
                                <View style={styles.chatMeta}>
                                    <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
                                    {item.unreadCount > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Swipeable>
                )}
            />

            {/* 플로팅 액션 버튼 */}
            <TouchableOpacity
                onPress={() => navigation.navigate('NewChatScreen')}
                onLongPress={() => {/* 최근 대화 상대 추천 팝업 */}}
                style={styles.fab}
            >
                <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

// 스타일 정의 및 추가 기능 구현
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9'
    },
    darkContainer: {
        backgroundColor: '#1E1E1E'
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F1F1F1',
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
    },
    voiceSearchButton: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: '#F1F1F1',
        borderRadius: 20,
    },
    aiAssistantButton: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 20,
    },
    profileIcon: {
        marginLeft: 8,
        padding: 8,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    selectedChatItem: {
        backgroundColor: '#E3F2FD',
    },
    chatAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
    },
    chatDetails: {
        flex: 1,
        marginLeft: 12,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
    },
    lastMessage: {
        fontSize: 14,
        color: '#757575',
    },
    chatMeta: {
        alignItems: 'flex-end',
    },
    messageTimestamp: {
        fontSize: 12,
        color: '#757575',
    },
    unreadBadge: {
        marginTop: 4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    swipeActionContainer: {
        flexDirection: 'row',
        width: 100,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    blockAction: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
    },
    notificationAction: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4A90E2',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default MainChatListScreen;

