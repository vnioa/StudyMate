// FriendListScreen.js

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
    SectionList,
    LayoutAnimation, AppState
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
import DraggableFlatList from 'react-native-draggable-flatlist';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

// 상수 정의
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 60 + StatusBar.currentHeight;
const SECTION_HEADER_HEIGHT = 40;
const PROFILE_IMAGE_SIZE = 60;
const FAVORITE_PROFILE_IMAGE_SIZE = 40;
const MINIMUM_TOUCH_SIZE = 44;

const FriendListScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const friends = useSelector(state => state.friends.list);
    const favoriteFriends = useSelector(state => state.friends.favorites);

    // Refs
    const searchInputRef = useRef(null);
    const flatListRef = useRef(null);
    const swipeableRefs = useRef({});
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = useRef(new Animated.Value(1)).current;
    const favoriteScrollViewRef = useRef(null);

    // Navigation
    const navigation = useNavigation();

    // 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [HEADER_HEIGHT, HEADER_HEIGHT - 30],
        extrapolate: 'clamp'
    });

    const searchBarWidth = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [SCREEN_WIDTH * 0.9, SCREEN_WIDTH * 0.8],
        extrapolate: 'clamp'
    });

    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFriends();
            return () => {
                // Cleanup on screen unfocus
            };
        }, [])
    );
    // 초기화 및 데이터 페칭 함수들
    const initializeScreen = async () => {
        try {
            await Promise.all([
                initializeVoiceRecognition(),
                prefetchImages(),
                setupKeyboardListeners(),
                setupAppStateListener(),
                initializeDragAndDrop()
            ]);

            fetchFriends();
            fetchFavoriteFriends();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupVoiceRecognition();
        cleanupKeyboardListeners();
        cleanupAppStateListener();
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
            Alert.alert('오류', '음성 인식 초기화에 실패했습니다.');
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

    // 친구 목록 데이터 가져오기
    const fetchFriends = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 알파벳순으로 정렬하고 섹션 데이터 구조로 변환
            const sortedFriends = processFriendsData(response.data);
            dispatch({ type: 'SET_FRIENDS', payload: sortedFriends });

            await prefetchImages(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
            setIsLoading(false);
            Alert.alert('오류', '친구 목록을 불러오는데 실패했습니다.');
        }
    };

    // 즐겨찾기 친구 목록 가져오기
    const fetchFavoriteFriends = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/friends/favorites`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch({ type: 'SET_FAVORITE_FRIENDS', payload: response.data });
        } catch (error) {
            console.error('Failed to fetch favorite friends:', error);
            Alert.alert('오류', '즐겨찾기 친구 목록을 불러오는데 실패했습니다.');
        }
    };

    // 친구 데이터 처리 (알파벳순 정렬 및 섹션 데이터 구조화)
    const processFriendsData = (friends) => {
        const sections = {};
        const koreanConsonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        // 한글 초성 추출 함수
        const getInitialConsonant = (text) => {
            const code = text.charCodeAt(0) - 44032;
            if (code > -1 && code < 11172) {
                return koreanConsonants[Math.floor(code / 588)];
            }
            return text[0].toUpperCase();
        };

        // 친구들을 초성/알파벳별로 분류
        friends.forEach(friend => {
            const initial = getInitialConsonant(friend.name);
            if (!sections[initial]) {
                sections[initial] = [];
            }
            sections[initial].push(friend);
        });

        // 섹션 데이터 구조로 변환
        return Object.keys(sections)
            .sort()
            .map(title => ({
                title,
                data: sections[title].sort((a, b) => a.name.localeCompare(b.name))
            }));
    };

    // 이미지 프리페칭
    const prefetchImages = async (friends) => {
        try {
            const imagesToPrefetch = friends
                .slice(0, 20)
                .map(friend => ({
                    uri: friend.profileImage,
                    priority: FastImage.priority.high
                }));

            await FastImage.preload(imagesToPrefetch);
        } catch (error) {
            console.error('Image prefetch failed:', error);
        }
    };

    // 드래그 앤 드롭 초기화
    const initializeDragAndDrop = () => {
        if (Platform.OS === 'ios') {
            LayoutAnimation.spring();
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

    // 앱 상태 리스너
    const setupAppStateListener = () => {
        AppState.addEventListener('change', handleAppStateChange);
    };

    const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            fetchFriends();
        }
    };

    // 이벤트 핸들러
    const handleKeyboardShow = (event) => {
        Animated.parallel([
            Animated.timing(searchBarWidth, {
                toValue: SCREEN_WIDTH * 0.8,
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
                toValue: SCREEN_WIDTH * 0.9,
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
    // 상단 바 렌더링
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
                    placeholder="친구 검색"
                    placeholderTextColor="#757575"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    accessible={true}
                    accessibilityLabel="친구 검색"
                    accessibilityHint="친구를 검색할 수 있습니다"
                />
                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={startVoiceRecognition}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessible={true}
                    accessibilityLabel="음성 검색"
                    accessibilityHint="음성으로 친구를 검색합니다"
                >
                    <MaterialIcons
                        name={isVoiceListening ? "mic" : "mic-none"}
                        size={24}
                        color="#757575"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.addFriendButton}
                    onPress={() => navigation.navigate('AddFriend')}
                    onLongPress={showRecentFriendSuggestions}
                    delayLongPress={500}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessible={true}
                    accessibilityLabel="친구 추가"
                    accessibilityHint="새로운 친구를 추가합니다"
                >
                    <MaterialIcons
                        name="person-add"
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    // 내 프로필 섹션 렌더링
    const renderMyProfile = () => (
        <View style={styles.myProfileSection}>
            <TouchableOpacity
                style={styles.profileImageContainer}
                onPress={() => navigation.navigate('Profile')}
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
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() => setIsEditingStatus(true)}
                >
                    {isEditingStatus ? (
                        <TextInput
                            style={styles.statusInput}
                            value={statusMessage}
                            onChangeText={setStatusMessage}
                            onBlur={handleStatusUpdate}
                            autoFocus
                            maxLength={50}
                            placeholder="상태 메시지를 입력하세요"
                            placeholderTextColor="#757575"
                        />
                    ) : (
                        <Text style={styles.statusMessage}>{user?.statusMessage}</Text>
                    )}
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
            >
                <MaterialIcons name="settings" size={24} color="#757575" />
            </TouchableOpacity>
        </View>
    );

    // 즐겨찾기 친구 섹션 렌더링
    const renderFavoriteFriends = () => (
        <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>즐겨찾기</Text>
            <DraggableFlatList
                ref={favoriteScrollViewRef}
                data={favoriteFriends}
                renderItem={renderFavoriteFriendItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                onDragEnd={({ data }) => handleFavoriteReorder(data)}
                activationDistance={10}
                containerStyle={styles.favoritesList}
            />
        </View>
    );

    // 즐겨찾기 친구 항목 렌더링
    const renderFavoriteFriendItem = ({ item, drag, isActive }) => (
        <Animated.View
            style={[
                styles.favoriteItem,
                {
                    opacity: isActive ? 0.5 : 1,
                    transform: [{ scale: isActive ? 1.1 : 1 }]
                }
            ]}
        >
            <TouchableOpacity
                onPress={() => handleFriendPress(item)}
                onLongPress={drag}
                disabled={isActive}
            >
                <FastImage
                    style={styles.favoriteImage}
                    source={{
                        uri: item.profileImage,
                        priority: FastImage.priority.normal
                    }}
                    defaultSource={require('../../assets/images/icons/user.png')}
                />
                <Text style={styles.favoriteName} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    // 전체 친구 목록 렌더링
    const renderFriendsList = () => (
        <SectionList
            sections={friends}
            renderItem={renderFriendItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.friendsList}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
            )}
            stickySectionHeadersEnabled
            ListEmptyComponent={renderEmptyState}
            refreshing={isLoading}
            onRefresh={fetchFriends}
        />
    );

    // 친구 항목 렌더링
    const renderFriendItem = ({ item }) => {
        const isSelected = selectedItems.includes(item.id);

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[item.id] = ref}
                renderRightActions={() => renderRightActions(item.id)}
                renderLeftActions={() => renderLeftActions(item.id)}
                onSwipeableWillOpen={() => {
                    Object.keys(swipeableRefs.current).forEach(key => {
                        if (key !== item.id && swipeableRefs.current[key]?.close) {
                            swipeableRefs.current[key].close();
                        }
                    });
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.friendItem,
                        isSelected && styles.selectedFriendItem,
                        viewMode === 'grid' ? styles.gridItem : styles.listItem
                    ]}
                    onPress={() => handleFriendPress(item)}
                    onLongPress={() => handleFriendLongPress(item)}
                    delayLongPress={500}
                >
                    <FastImage
                        style={[
                            styles.friendImage,
                            viewMode === 'grid' ? styles.gridImage : styles.listImage
                        ]}
                        source={{
                            uri: item.profileImage,
                            priority: FastImage.priority.normal
                        }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                    <View style={styles.friendInfo}>
                        <Text
                            style={[
                                styles.friendName,
                                viewMode === 'grid' ? styles.gridName : styles.listName
                            ]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                        {viewMode === 'list' && (
                            <Text style={styles.statusMessage} numberOfLines={1}>
                                {item.statusMessage}
                            </Text>
                        )}
                    </View>
                    {item.isOnline && (
                        <View style={styles.onlineIndicator} />
                    )}
                </TouchableOpacity>
            </Swipeable>
        );
    };

    // 섹션 헤더 렌더링
    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    // 스와이프 액션 렌더링
    const renderRightActions = (friendId) => (
        <View style={styles.rightActions}>
            <TouchableOpacity
                style={[styles.swipeAction, styles.blockAction]}
                onPress={() => handleBlockFriend(friendId)}
            >
                <MaterialIcons name="block" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    const renderLeftActions = (friendId) => (
        <View style={styles.leftActions}>
            <TouchableOpacity
                style={[styles.swipeAction, styles.favoriteAction]}
                onPress={() => handleToggleFavorite(friendId)}
            >
                <MaterialIcons name="star" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
    // 빈 상태 렌더링
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons
                name="people-outline"
                size={48}
                color="#CCCCCC"
            />
            <Text style={styles.emptyText}>
                친구 목록이 비어있습니다
            </Text>
            <TouchableOpacity
                style={styles.addFriendButton}
                onPress={() => navigation.navigate('AddFriend')}
            >
                <Text style={styles.addFriendButtonText}>친구 추가하기</Text>
            </TouchableOpacity>
        </View>
    );

    // 프로필 카드 모달 렌더링
    const renderProfileCard = () => (
        <Modal
            isVisible={showProfileCard}
            onBackdropPress={() => setShowProfileCard(false)}
            onSwipeComplete={() => setShowProfileCard(false)}
            swipeDirection={['down']}
            style={styles.profileModal}
            animationIn="zoomIn"
            animationOut="zoomOut"
            animationInTiming={300}
            animationOutTiming={300}
            backdropTransitionInTiming={300}
            backdropTransitionOutTiming={300}
            useNativeDriver={true}
        >
            <View style={styles.profileCard}>
                <FastImage
                    style={styles.profileCardImage}
                    source={{
                        uri: selectedProfile?.profileImage,
                        priority: FastImage.priority.high
                    }}
                    defaultSource={require('../assets/default-profile.png')}
                />
                <Text style={styles.profileCardName}>{selectedProfile?.name}</Text>
                <Text style={styles.profileCardStatus}>{selectedProfile?.statusMessage}</Text>
                <View style={styles.profileCardButtons}>
                    <TouchableOpacity
                        style={[styles.profileCardButton, styles.messageButton]}
                        onPress={() => handleStartChat(selectedProfile?.id)}
                    >
                        <MaterialIcons name="message" size={24} color="#FFFFFF" />
                        <Text style={styles.buttonText}>메시지</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.profileCardButton, styles.favoriteButton]}
                        onPress={() => handleToggleFavorite(selectedProfile?.id)}
                    >
                        <MaterialIcons
                            name={selectedProfile?.isFavorite ? "star" : "star-border"}
                            size={24}
                            color="#FFFFFF"
                        />
                        <Text style={styles.buttonText}>즐겨찾기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // 친구 추천 팝업 렌더링
    const renderFriendSuggestions = () => (
        <Modal
            isVisible={showFriendSuggestions}
            onBackdropPress={() => setShowFriendSuggestions(false)}
            style={styles.suggestionsModal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            useNativeDriver={true}
        >
            <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>추천 친구</Text>
                <FlatList
                    data={recentContacts}
                    renderItem={renderSuggestionItem}
                    keyExtractor={item => item.id}
                    horizontal={false}
                    numColumns={3}
                    contentContainerStyle={styles.suggestionsList}
                />
            </View>
        </Modal>
    );

    // 친구 추천 항목 렌더링
    const renderSuggestionItem = ({ item }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleAddFriend(item.id)}
        >
            <FastImage
                style={styles.suggestionImage}
                source={{
                    uri: item.profileImage,
                    priority: FastImage.priority.normal
                }}
                defaultSource={require('../assets/default-profile.png')}
            />
            <Text style={styles.suggestionName} numberOfLines={1}>
                {item.name}
            </Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddFriend(item.id)}
            >
                <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // 알파벳 인덱스 바 렌더링
    const renderIndexBar = () => (
        <View style={styles.indexBar}>
            {ALPHABET_INDEX.map((letter) => (
                <TouchableOpacity
                    key={letter}
                    style={styles.indexItem}
                    onPress={() => scrollToIndex(letter)}
                >
                    <Text style={styles.indexText}>{letter}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // 탭 네비게이션 바 렌더링
    const renderTabBar = () => (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('Home');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <MaterialIcons name="home" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('Chat');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <MaterialIcons name="chat" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabItem, styles.activeTab]}
                onPress={() => {
                    navigation.navigate('Friends');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <MaterialIcons name="people" size={28} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('Group');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <MaterialIcons name="groups" size={28} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => {
                    navigation.navigate('MyPage');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <MaterialIcons name="person" size={28} color="#757575" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {renderHeader()}
            {renderMyProfile()}
            {renderFavoriteFriends()}

            <View style={styles.mainContent}>
                <View style={styles.viewModeContainer}>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'grid' && styles.activeViewMode
                        ]}
                        onPress={() => setViewMode('grid')}
                    >
                        <MaterialIcons name="grid-view" size={24} color={viewMode === 'grid' ? '#4CAF50' : '#757575'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'list' && styles.activeViewMode
                        ]}
                        onPress={() => setViewMode('list')}
                    >
                        <MaterialIcons name="view-list" size={24} color={viewMode === 'list' ? '#4CAF50' : '#757575'} />
                    </TouchableOpacity>
                </View>

                {renderFriendsList()}
                {renderIndexBar()}
            </View>

            {renderTabBar()}
            {renderProfileCard()}
            {renderFriendSuggestions()}
        </View>
    );
};

const styles = StyleSheet.create({
    // 메인 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // 상단 바 스타일
    header: {
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    searchBar: {
        flex: 1,
        height: 50,
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

    searchIcon: {
        position: 'absolute',
        left: 16,
        top: 13,
        zIndex: 1,
    },

    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    addFriendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    // 내 프로필 섹션
    myProfileSection: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },

    profileImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
    },

    profileImage: {
        width: '100%',
        height: '100%',
    },

    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },

    profileName: {
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginBottom: 4,
    },

    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    statusInput: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        padding: 0,
    },

    statusMessage: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 즐겨찾기 섹션
    favoritesSection: {
        height: 80,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },

    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginLeft: 16,
        marginTop: 8,
    },

    favoritesList: {
        paddingHorizontal: 8,
    },

    favoriteItem: {
        width: 60,
        alignItems: 'center',
        marginHorizontal: 8,
    },

    favoriteImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
    },

    favoriteName: {
        fontSize: 12,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginTop: 4,
        textAlign: 'center',
    },

    // 친구 목록
    friendsList: {
        flex: 1,
    },

    sectionHeader: {
        height: 40,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },

    sectionHeaderText: {
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
    },

    // 친구 항목 스타일
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },

    selectedFriendItem: {
        backgroundColor: '#E3F2FD',
    },

    // 그리드 뷰 스타일
    gridItem: {
        width: SCREEN_WIDTH / 3,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },

    gridImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },

    gridName: {
        fontSize: 14,
        textAlign: 'center',
    },

    // 리스트 뷰 스타일
    listItem: {
        height: 70,
        paddingHorizontal: 16,
    },

    listImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },

    listName: {
        fontSize: 16,
    },

    // 스와이프 액션 스타일
    swipeActions: {
        width: 160,
        flexDirection: 'row',
    },

    swipeAction: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },

    blockAction: {
        backgroundColor: '#FF3B30',
    },

    favoriteAction: {
        backgroundColor: '#FFD700',
    },

    // 알파벳 인덱스 바
    indexBar: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -200 }],
        width: 20,
        backgroundColor: 'transparent',
    },

    indexItem: {
        height: 16,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    indexText: {
        fontSize: 12,
        color: '#757575',
    },

    // 탭 네비게이션 바
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

    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    activeTab: {
        borderTopWidth: 2,
        borderTopColor: '#4CAF50',
    },

    // 빈 상태 스타일
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },

    emptyText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        marginTop: 8,
        textAlign: 'center',
    },

    // 프로필 카드 모달
    profileModal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileCard: {
        width: SCREEN_WIDTH * 0.8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },

    profileCardImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },

    profileCardName: {
        fontSize: 20,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginBottom: 8,
    },

    profileCardStatus: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        marginBottom: 16,
    },

    profileCardButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },

    profileCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        width: '45%',
    },

    messageButton: {
        backgroundColor: '#4CAF50',
    },

    favoriteButton: {
        backgroundColor: '#FFD700',
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        marginLeft: 8,
    },
});

export default FriendListScreen;