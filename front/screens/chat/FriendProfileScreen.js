// FriendProfileScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Animated,
    Platform,
    StatusBar,
    Dimensions,
    Image,
    TextInput,
    PanResponder,
    Modal,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { useDispatch, useSelector } from 'react-redux';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '../../config/api';
import socket from '../utils/socket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROFILE_IMAGE_SIZE = SCREEN_WIDTH * 0.4;
const TAB_HEIGHT = 50;
const BUTTON_HEIGHT = 50;

const FriendProfileScreen = () => {
    // State management
    const [activeTab, setActiveTab] = useState('info');
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [mediaItems, setMediaItems] = useState([]);
    const [commonGroups, setCommonGroups] = useState([]);
    const [isOnline, setIsOnline] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const friend = useSelector(state => state.friends.currentFriend);
    const user = useSelector(state => state.auth.user);

    // Refs
    const scrollViewRef = useRef(null);
    const statusInputRef = useRef(null);
    const profileImageScale = useRef(new Animated.Value(1)).current;
    const headerOpacity = useRef(new Animated.Value(1)).current;
    const tabTranslateX = useRef(new Animated.Value(0)).current;
    const lastTapRef = useRef(0);

    // Navigation
    const navigation = useNavigation();
    const route = useRoute();
    const { friendId } = route.params;

    // Animation values
    const likeScale = useRef(new Animated.Value(0)).current;
    const backgroundGradient = useRef(new Animated.Value(0)).current;

    useEffect( () => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await Promise.all([
                fetchFriendProfile(),
                fetchMediaItems(),
                fetchCommonGroups(),
                setupSocketListeners(),
                generateBackgroundGradient()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('오류', '프로필을 불러오는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupSocketListeners();
        saveUserPreferences();
    };

    // Data fetching
    const fetchFriendProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}`);
            const data = await response.json();
            dispatch({ type: 'SET_CURRENT_FRIEND', payload: data });
            setStatusMessage(data.statusMessage);
            setIsOnline(data.isOnline);
        } catch (error) {
            console.error('Failed to fetch friend profile:', error);
            Alert.alert('오류', '친구 프로필을 불러오는데 실패했습니다.');
        }
    };

    const fetchMediaItems = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}/media`);
            const data = await response.json();
            setMediaItems(data);
        } catch (error) {
            console.error('Failed to fetch media items:', error);
        }
    };

    const fetchCommonGroups = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}/groups`);
            const data = await response.json();
            setCommonGroups(data);
        } catch (error) {
            console.error('Failed to fetch common groups:', error);
        }
    };

    // Socket listeners
    const setupSocketListeners = () => {
        socket.on('friendStatusUpdate', handleFriendStatusUpdate);
        socket.on('friendProfileUpdate', handleFriendProfileUpdate);
    };

    const cleanupSocketListeners = () => {
        socket.off('friendStatusUpdate');
        socket.off('friendProfileUpdate');
    };

    // Event handlers
    const handleFriendStatusUpdate = useCallback((status) => {
        setIsOnline(status.isOnline);
    }, []);

    const handleFriendProfileUpdate = useCallback((profile) => {
        dispatch({ type: 'UPDATE_FRIEND_PROFILE', payload: profile });
    }, []);

    // Profile image interactions
    const handleImagePress = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
            handleDoubleTap();
        } else {
            setIsImageViewerVisible(true);
        }
        lastTapRef.current = now;
    };

    const handleDoubleTap = () => {
        setIsLiked(true);
        Animated.sequence([
            Animated.spring(likeScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true
            }),
            Animated.timing(likeScale, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true
            })
        ]).start();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleLongPress = () => {
        setShowSaveOptions(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // 배경 그라데이션 생성 및 관리
    const generateBackgroundGradient = async () => {
        try {
            if (friend?.profileImage) {
                const colors = await extractDominantColors(friend.profileImage);
                setGradientColors(colors);
            }
        } catch (error) {
            console.error('Failed to generate background gradient:', error);
            setGradientColors(['#4A90E2', '#000000']); // 기본 그라데이션
        }
    };

    // 이미지에서 주요 색상 추출
    const extractDominantColors = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            ctx.drawImage(bitmap, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = getPaletteFromPixels(imageData.data);

            return colors;
        } catch (error) {
            console.error('Color extraction failed:', error);
            return ['#4A90E2', '#000000'];
        }
    };

    // 탭 관련 함수들
    const handleTabPress = (tabName) => {
        Animated.spring(tabTranslateX, {
            toValue: tabPositions[tabName],
            tension: 50,
            friction: 7,
            useNativeDriver: true
        }).start();
        setActiveTab(tabName);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return renderBasicInfo();
            case 'media':
                return renderSharedMedia();
            case 'groups':
                return renderCommonGroups();
            default:
                return null;
        }
    };

    // 기본 정보 탭 렌더링
    const renderBasicInfo = () => (
        <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <MaterialIcons name="cake" size={24} color="#757575" />
                    <Text style={styles.infoText}>{friend.birthday}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="phone" size={24} color="#757575" />
                    <Text style={styles.infoText}>{friend.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="email" size={24} color="#757575" />
                    <Text style={styles.infoText}>{friend.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={24} color="#757575" />
                    <Text style={styles.infoText}>{friend.location}</Text>
                </View>
            </View>
        </View>
    );

    // 공유 미디어 탭 렌더링
    const renderSharedMedia = () => (
        <View style={styles.mediaContainer}>
            <FlatList
                data={mediaItems}
                renderItem={renderMediaItem}
                numColumns={3}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.mediaGrid}
            />
        </View>
    );

    // 공통 그룹 탭 렌더링
    const renderCommonGroups = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupsContainer}
        >
            {commonGroups.map(group => (
                <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                >
                    <FastImage
                        source={{ uri: group.image }}
                        style={styles.groupImage}
                        defaultSource={require('../assets/default-group.png')}
                    />
                    <Text style={styles.groupName} numberOfLines={2}>
                        {group.name}
                    </Text>
                    <Text style={styles.groupMemberCount}>
                        {group.memberCount}명
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    // 하단 액션 버튼 렌더링
    const renderActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={[styles.actionButton, styles.chatButton]}
                onPress={handleStartChat}
            >
                <MaterialIcons name="chat" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>채팅 시작</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.voiceCallButton]}
                onPress={handleVoiceCall}
            >
                <MaterialIcons name="call" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>음성 통화</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.videoCallButton]}
                onPress={handleVideoCall}
            >
                <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>화상 통화</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.blockButton]}
                onPress={handleBlockUser}
            >
                <MaterialIcons name="block" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>차단</Text>
            </TouchableOpacity>
        </View>
    );

    // 이벤트 핸들러
    const handleStartChat = () => {
        navigation.navigate('ChatRoom', { userId: friend.id });
    };

    const handleVoiceCall = async () => {
        try {
            const callSession = await initializeJitsiCall('audio');
            navigation.navigate('Call', { session: callSession, type: 'audio' });
        } catch (error) {
            console.error('Failed to start voice call:', error);
            Alert.alert('오류', '음성 통화를 시작할 수 없습니다.');
        }
    };

    const handleVideoCall = async () => {
        try {
            const callSession = await initializeJitsiCall('video');
            navigation.navigate('Call', { session: callSession, type: 'video' });
        } catch (error) {
            console.error('Failed to start video call:', error);
            Alert.alert('오류', '화상 통화를 시작할 수 없습니다.');
        }
    };

    const handleBlockUser = () => {
        Alert.alert(
            '친구 차단',
            '정말로 이 친구를 차단하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await blockUser(friend.id);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Failed to block user:', error);
                            Alert.alert('오류', '차단에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Animated.View
                style={[
                    styles.header,
                    {
                        backgroundColor: interpolateGradient(gradientColors, headerScrollProgress)
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View
                style={[
                    styles.profileImageContainer,
                    {
                        transform: [
                            { scale: profileImageScale },
                            { translateY: headerTranslateY }
                        ]
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={handleImagePress}
                    onLongPress={handleImageLongPress}
                    delayLongPress={500}
                >
                    <FastImage
                        style={styles.profileImage}
                        source={{
                            uri: friend.profileImage,
                            priority: FastImage.priority.high
                        }}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                </TouchableOpacity>

                {isLiked && (
                    <Animated.View
                        style={[
                            styles.likeIcon,
                            {
                                transform: [{ scale: likeScale }]
                            }
                        ]}
                    >
                        <MaterialIcons name="favorite" size={80} color="#FF4081" />
                    </Animated.View>
                )}
            </Animated.View>

            <Text style={styles.name}>{friend.name}</Text>

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
                        placeholder="상태 메시지를 입력하세요"
                    />
                ) : (
                    <Text style={styles.statusMessage}>{friend.statusMessage}</Text>
                )}
            </TouchableOpacity>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'info' && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('info')}
                >
                    <Text style={styles.tabText}>기본 정보</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'media' && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('media')}
                >
                    <Text style={styles.tabText}>공유 미디어</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'groups' && styles.activeTab
                    ]}
                    onPress={() => handleTabPress('groups')}
                >
                    <Text style={styles.tabText}>공통 그룹</Text>
                </TouchableOpacity>
            </View>

            {renderTabContent()}
            {renderActionButtons()}

            <Modal
                visible={showImageViewer}
                transparent={true}
                onRequestClose={() => setShowImageViewer(false)}
            >
                <ImageViewer
                    imageUrls={[{ url: friend.profileImage }]}
                    enableSwipeDown
                    onSwipeDown={() => setShowImageViewer(false)}
                    renderIndicator={() => null}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    profileImage: {
        width: SCREEN_WIDTH * 0.4,
        height: SCREEN_WIDTH * 0.4,
        borderRadius: (SCREEN_WIDTH * 0.4) / 2,
    },
    likeIcon: {
        position: 'absolute',
        alignSelf: 'center',
    },
    name: {
        fontSize: 24,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        textAlign: 'center',
        marginTop: 16,
    },
    statusContainer: {
        marginTop: 8,
        paddingHorizontal: 16,
    },
    statusInput: {
        fontSize: 16,
        fontFamily: 'SFProText-Italic',
        color: '#757575',
        textAlign: 'center',
    },
    statusMessage: {
        fontSize: 16,
        fontFamily: 'SFProText-Italic',
        color: '#757575',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4A90E2',
    },
    tabText: {
        fontSize: 16,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
    },
    infoContainer: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 12,
    },
    mediaContainer: {
        flex: 1,
        padding: 8,
    },
    mediaGrid: {
        paddingBottom: 16,
    },
    groupsContainer: {
        flex: 1,
        padding: 16,
    },
    groupCard: {
        width: 160,
        marginRight: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    groupImage: {
        width: '100%',
        height: 100,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    groupName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginTop: 8,
        marginHorizontal: 8,
        textAlign: 'center',
    },
    groupMemberCount: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        marginTop: 4,
        marginBottom: 8,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 25,
        paddingHorizontal: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    chatButton: {
        backgroundColor: '#4A90E2',
    },
    voiceCallButton: {
        backgroundColor: '#4CAF50',
    },
    videoCallButton: {
        backgroundColor: '#FF9800',
    },
    blockButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#FFFFFF',
        marginLeft: 8,
    },
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
        backgroundColor: '#4A90E2',
    },
    favoriteButton: {
        backgroundColor: '#FFD700',
    },
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
    notificationImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        textAlign: 'center',
        marginTop: 8,
    },
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    likeAnimation: {
        position: 'absolute',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeActions: {
        flexDirection: 'row',
        width: 160,
    },
    swipeAction: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteAction: {
        backgroundColor: '#FFD700',
    },
    blockAction: {
        backgroundColor: '#FF3B30',
    },
    tabBar: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    activeTabText: {
        color: '#4A90E2',
    },
    mediaItem: {
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaThumbnail: {
        width: (SCREEN_WIDTH - 32) / 3,
        height: (SCREEN_WIDTH - 32) / 3,
    },
    playIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -12 }, { translateY: -12 }],
    },
    duration: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#FFFFFF',
    },
    saveOptionsModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    saveOptionsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    saveOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    saveOptionText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 16,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#FF3B30',
    }
});

export default FriendProfileScreen;