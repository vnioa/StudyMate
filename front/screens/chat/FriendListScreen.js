// FriendListScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Animated,
    Platform,
    Dimensions,
    StatusBar,
    LayoutAnimation,
    UIManager,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Voice from '@react-native-voice/voice';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { AlphabetList } from 'react-native-section-list-get-item-layout';
import { BlurView } from '@react-native-community/blur';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');
const GRID_COLUMN = 3;
const ITEM_HEIGHT = 70;
const SECTION_HEADER_HEIGHT = 40;

const FriendListScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [favoriteList, setFavoriteList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [myProfile, setMyProfile] = useState({
        id: '1',
        name: '내 이름',
        statusMessage: '상태 메시지를 입력하세요',
        profileImage: 'https://example.com/default-profile.png'
    });
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [newStatusMessage, setNewStatusMessage] = useState('');
    const [friendsList, setFriendsList] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [sectionedFriends, setSectionedFriends] = useState([]);

    const scrollY = useRef(new Animated.Value(0)).current;
    const swipeableRefs = useRef({});
    const searchInputRef = useRef(null);
    const statusInputRef = useRef(null);
    const listRef = useRef(null);
    const navigation = useNavigation();

    const headerShadowOpacity = scrollY.interpolate({
        inputRange: [0, 20],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        initializeVoiceRecognition();
        loadFriendsList();
        return () => {
            cleanupVoiceRecognition();
        };
    }, []);

    useEffect(() => {
        filterAndSectionFriends();
    }, [searchText, friendsList]);

    const initializeVoiceRecognition = async () => {
        try {
            await Voice.destroy();
            Voice.onSpeechStart = onSpeechStart;
            Voice.onSpeechEnd = onSpeechEnd;
            Voice.onSpeechResults = onSpeechResults;
            Voice.onSpeechError = onSpeechError;
        } catch (error) {
            setError('음성 인식 초기화 실패');
        }
    };

    const cleanupVoiceRecognition = () => {
        Voice.destroy().then(Voice.removeAllListeners);
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
        setIsVoiceListening(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('음성 인식 오류');
    };

    const loadFriendsList = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // API 호출 구현
            const response = await fetch('YOUR_API_ENDPOINT/friends');
            const data = await response.json();

            if (!response.ok) {
                throw new Error('친구 목록을 불러오는데 실패했습니다.');
            }

            setFriendsList(data);
            const favorites = data.filter(friend => friend.isFavorite);
            setFavoriteList(favorites);
            filterAndSectionFriends(data);
        } catch (error) {
            setError(error.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndSectionFriends = (friends = friendsList) => {
        const filtered = searchText.trim()
            ? friends.filter(friend =>
                friend.name.toLowerCase().includes(searchText.toLowerCase()) ||
                friend.statusMessage.toLowerCase().includes(searchText.toLowerCase())
            )
            : friends;

        setFilteredFriends(filtered);

        const sections = {};
        filtered.forEach(friend => {
            const firstLetter = friend.name.charAt(0).toUpperCase();
            if (!sections[firstLetter]) {
                sections[firstLetter] = [];
            }
            sections[firstLetter].push(friend);
        });

        const sortedSections = Object.keys(sections)
            .sort()
            .map(letter => ({
                title: letter,
                data: sections[letter].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            }));

        setSectionedFriends(sortedSections);
    };

    const handleVoiceSearch = async () => {
        try {
            if (isVoiceListening) {
                await Voice.stop();
            } else {
                await Voice.start('ko-KR');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            setError('음성 검색 오류');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleFriendSelect = useCallback((friendId) => {
        if (isSelectionMode) {
            setSelectedFriends(prev => {
                const newSelection = prev.includes(friendId)
                    ? prev.filter(id => id !== friendId)
                    : [...prev, friendId];

                Haptics.selectionAsync();
                return newSelection;
            });
        } else {
            handleFriendPress(friendId);
        }
    }, [isSelectionMode]);

    const handleFriendPress = useCallback((friendId) => {
        const friend = friendsList.find(f => f.id === friendId);
        setSelectedProfile(friend);
        setIsProfileModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [friendsList]);

    const handleFavoriteDragEnd = useCallback(({ data }) => {
        setFavoriteList(data);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleToggleFavorite = useCallback(async (friendId) => {
        try {
            // API 호출 구현
            await fetch(`YOUR_API_ENDPOINT/friends/${friendId}/favorite`, {
                method: 'POST',
            });

            setFavoriteList(prev => {
                const isFavorite = prev.some(f => f.id === friendId);
                if (isFavorite) {
                    return prev.filter(f => f.id !== friendId);
                }
                const friend = friendsList.find(f => f.id === friendId);
                return [...prev, friend];
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            setError('즐겨찾기 설정 실패');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [friendsList]);

    const handleStatusMessageEdit = useCallback(() => {
        setIsEditingStatus(true);
        setNewStatusMessage(myProfile.statusMessage);
        setTimeout(() => {
            statusInputRef.current?.focus();
        }, 100);
    }, [myProfile.statusMessage]);

    const handleStatusMessageSave = async () => {
        try {
            // API 호출 구현
            await fetch('YOUR_API_ENDPOINT/profile/status', {
                method: 'PUT',
                body: JSON.stringify({ statusMessage: newStatusMessage }),
            });

            setMyProfile(prev => ({
                ...prev,
                statusMessage: newStatusMessage
            }));
            setIsEditingStatus(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            setError('상태 메시지 업데이트 실패');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const renderRightActions = useCallback((progress, dragX, friendId) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
        });

        return (
            <View style={styles.rightActions}>
                <Animated.View style={[
                    styles.rightAction,
                    { transform: [{ translateX: trans }] }
                ]}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.favoriteButton]}
                        onPress={() => handleToggleFavorite(friendId)}
                    >
                        <MaterialIcons name="star" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.blockButton]}
                        onPress={() => handleBlockFriend(friendId)}
                    >
                        <MaterialIcons name="block" size={24} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }, []);

    const renderFriendItem = useCallback(({ item }) => {
        const isSelected = selectedFriends.includes(item.id);

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[item.id] = ref}
                renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, item.id)
                }
                rightThreshold={40}
            >
                <TouchableOpacity
                    style={[
                        styles.friendItem,
                        isSelected && styles.selectedFriend
                    ]}
                    onPress={() => handleFriendSelect(item.id)}
                    onLongPress={() => {
                        setIsSelectionMode(true);
                        setSelectedFriends([item.id]);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    delayLongPress={500}
                >
                    <FastImage
                        source={{ uri: item.profileImage }}
                        style={styles.profileImage}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                    <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{item.name}</Text>
                        <Text style={styles.statusMessage}>{item.statusMessage}</Text>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedFriends, isSelectionMode]);

    const renderFriendGrid = useCallback(({ item }) => {
        const isSelected = selectedFriends.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.friendGrid,
                    isSelected && styles.selectedFriend
                ]}
                onPress={() => handleFriendSelect(item.id)}
                onLongPress={() => {
                    setIsSelectionMode(true);
                    setSelectedFriends([item.id]);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                delayLongPress={500}
            >
                <FastImage
                    source={{ uri: item.profileImage }}
                    style={styles.gridProfileImage}
                    defaultSource={require('../assets/default-profile.png')}
                />
                <Text style={styles.gridFriendName}>{item.name}</Text>
                <Text style={styles.gridStatusMessage} numberOfLines={1}>
                    {item.statusMessage}
                </Text>
            </TouchableOpacity>
        );
    }, [selectedFriends, isSelectionMode]);

    const renderFavoriteItem = useCallback(({ item, drag }) => (
        <TouchableOpacity
            style={styles.favoriteItem}
            onLongPress={drag}
            onPress={() => handleFriendPress(item.id)}
        >
            <FastImage
                source={{ uri: item.profileImage }}
                style={styles.favoriteImage}
                defaultSource={require('../assets/default-profile.png')}
            />
            <Text style={styles.favoriteName}>{item.name}</Text>
        </TouchableOpacity>
    ), []);

    const renderSectionHeader = useCallback(({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
    ), []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadFriendsList}
                >
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <GestureHandlerRootView style={styles.container}>
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
                            placeholder="친구 검색"
                            placeholderTextColor="#757575"
                            value={searchText}
                            onChangeText={setSearchText}
                            returnKeyType="search"
                            autoCorrect={false}
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
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddFriend')}
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            // 최근 연락한 친구 추천 리스트 표시
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>

                {/* 내 프로필 섹션 */}
                <View style={styles.myProfile}>
                    <FastImage
                        source={{ uri: myProfile.profileImage }}
                        style={styles.myProfileImage}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                    <View style={styles.myInfo}>
                        <Text style={styles.myName}>{myProfile.name}</Text>
                        {isEditingStatus ? (
                            <TextInput
                                ref={statusInputRef}
                                style={styles.statusInput}
                                value={newStatusMessage}
                                onChangeText={setNewStatusMessage}
                                onBlur={handleStatusMessageSave}
                                onSubmitEditing={handleStatusMessageSave}
                                autoFocus
                                maxLength={50}
                            />
                        ) : (
                            <TouchableOpacity onPress={handleStatusMessageEdit}>
                                <Text style={styles.myStatus}>{myProfile.statusMessage}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <MaterialIcons name="settings" size={24} color="#757575" />
                    </TouchableOpacity>
                </View>

                {/* 즐겨찾기 친구 섹션 */}
                {favoriteList.length > 0 && (
                    <View style={styles.favoritesSection}>
                        <Text style={styles.sectionTitle}>즐겨찾기</Text>
                        <DraggableFlatList
                            horizontal
                            data={favoriteList}
                            renderItem={renderFavoriteItem}
                            keyExtractor={item => item.id}
                            onDragEnd={handleFavoriteDragEnd}
                            contentContainerStyle={styles.favoritesList}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* 뷰 모드 전환 버튼 */}
                <TouchableOpacity
                    style={styles.viewModeButton}
                    onPress={() => {
                        setViewMode(prev => prev === 'list' ? 'grid' : 'list');
                        Haptics.selectionAsync();
                    }}
                >
                    <MaterialIcons
                        name={viewMode === 'list' ? "grid-view" : "view-list"}
                        size={24}
                        color="#757575"
                    />
                </TouchableOpacity>

                {/* 전체 친구 목록 */}
                {viewMode === 'list' ? (
                    <AlphabetList
                        data={sectionedFriends}
                        renderItem={renderFriendItem}
                        renderSectionHeader={renderSectionHeader}
                        getItemHeight={() => ITEM_HEIGHT}
                        sectionHeaderHeight={SECTION_HEADER_HEIGHT}
                        indexLetterColor="#4CAF50"
                        indexLetterStyle={styles.indexLetter}
                    />
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.gridContainer}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: true }
                        )}
                        scrollEventThrottle={16}
                    >
                        <View style={styles.gridContent}>
                            {filteredFriends.map(friend => renderFriendGrid({ item: friend }))}
                        </View>
                    </ScrollView>
                )}

                {/* 하단 탭 네비게이션 */}
                <View style={styles.tabBar}>
                    {['home', 'chat', 'person', 'group', 'settings'].map((icon, index) => (
                        <TouchableOpacity
                            key={icon}
                            style={styles.tabItem}
                            onPress={() => {
                                Haptics.selectionAsync();
                                // 탭 전환 처리
                            }}
                        >
                            <MaterialIcons
                                name={icon}
                                size={28}
                                color={index === 2 ? '#4CAF50' : '#757575'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 프로필 상세 모달 */}
                <Modal
                    isVisible={isProfileModalVisible}
                    onBackdropPress={() => setIsProfileModalVisible(false)}
                    onSwipeComplete={() => setIsProfileModalVisible(false)}
                    swipeDirection={['down']}
                    style={styles.modal}
                    animationIn="zoomIn"
                    animationOut="zoomOut"
                    animationInTiming={300}
                    animationOutTiming={300}
                    backdropTransitionInTiming={300}
                    backdropTransitionOutTiming={300}
                >
                    {selectedProfile && (
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <FastImage
                                    source={{ uri: selectedProfile.profileImage }}
                                    style={styles.modalProfileImage}
                                    defaultSource={require('../assets/default-profile.png')}
                                />
                                <Text style={styles.modalName}>{selectedProfile.name}</Text>
                                <Text style={styles.modalStatus}>{selectedProfile.statusMessage}</Text>
                            </View>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.messageButton]}
                                    onPress={() => {
                                        navigation.navigate('ChatRoom', { friendId: selectedProfile.id });
                                        setIsProfileModalVisible(false);
                                    }}
                                >
                                    <MaterialIcons name="message" size={24} color="#FFFFFF" />
                                    <Text style={styles.buttonText}>메시지</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.favoriteButton]}
                                    onPress={() => {
                                        handleToggleFavorite(selectedProfile.id);
                                        setIsProfileModalVisible(false);
                                    }}
                                >
                                    <MaterialIcons
                                        name={favoriteList.some(f => f.id === selectedProfile.id) ? "star" : "star-border"}
                                        size={24}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.buttonText}>
                                        {favoriteList.some(f => f.id === selectedProfile.id) ? '즐겨찾기 해제' : '즐겨찾기'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Modal>
            </GestureHandlerRootView>
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    myProfile: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    myProfileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
    },
    myInfo: {
        flex: 1,
        marginLeft: 12,
    },
    myName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    myStatus: {
        fontSize: 14,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    statusInput: {
        fontSize: 14,
        color: '#333333',
        padding: 0,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoritesSection: {
        height: 100,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginLeft: 16,
        marginTop: 8,
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
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
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 4,
        backgroundColor: '#E0E0E0',
    },
    favoriteName: {
        fontSize: 12,
        color: '#333333',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    viewModeButton: {
        position: 'absolute',
        right: 16,
        top: 170,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1,
    },
    gridContainer: {
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    gridContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    friendGrid: {
        width: (width - 32) / 3,
        height: 120,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
    },
    gridProfileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
        backgroundColor: '#E0E0E0',
    },
    gridFriendName: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    gridStatusMessage: {
        fontSize: 12,
        color: '#757575',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    sectionHeader: {
        height: SECTION_HEADER_HEIGHT,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    indexLetter: {
        fontSize: 12,
        color: '#4CAF50',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
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
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: height * 0.7,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalProfileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    modalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
    },
    modalStatus: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
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
    favoriteButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    rightActions: {
        width: 160,
        flexDirection: 'row',
    },
    actionButton: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockButton: {
        backgroundColor: '#FF3B30',
    },
    notificationButton: {
        backgroundColor: '#4A90E2',
    },
    noResults: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    selectionModeBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 2,
    },
    selectionModeText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    cancelButton: {
        padding: 8,
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    }
});

export default FriendListScreen;