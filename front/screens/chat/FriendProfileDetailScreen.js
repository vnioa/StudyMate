// FriendProfileDetailScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Alert,
    Image, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '../../config/api';
import { extractDominantColors } from '../utils/imageUtils';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROFILE_IMAGE_SIZE = SCREEN_WIDTH * 0.4;
const TAB_HEIGHT = 48;

const FriendProfileDetailScreen = () => {
    // 상태 관리
    const [activeTab, setActiveTab] = useState('info');
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [gradientColors, setGradientColors] = useState(['#4A90E2', '#000000']);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [sharedMedia, setSharedMedia] = useState([]);
    const [mutualFriends, setMutualFriends] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    // Redux
    const dispatch = useDispatch();
    const friend = useSelector(state => state.friends.currentFriend);
    const user = useSelector(state => state.auth.user);

    // Refs
    const scrollViewRef = useRef(null);
    const profileImageScale = useRef(new Animated.Value(1)).current;
    const likeScale = useRef(new Animated.Value(0)).current;
    const tabTranslateX = useRef(new Animated.Value(0)).current;
    const lastTapRef = useRef(0);

    // Navigation
    const navigation = useNavigation();
    const route = useRoute();
    const { friendId } = route.params;

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await Promise.all([
                fetchFriendProfile(),
                fetchSharedMedia(),
                fetchMutualFriends(),
                fetchRecentActivities(),
                generateBackgroundGradient()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '프로필을 불러오는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        // 정리 작업
    };

    // 데이터 페칭
    const fetchFriendProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}`);
            const data = await response.json();
            dispatch({ type: 'SET_CURRENT_FRIEND', payload: data });
            setStatusMessage(data.statusMessage);
        } catch (error) {
            console.error('Failed to fetch friend profile:', error);
            Alert.alert('오류', '친구 프로필을 불러오는데 실패했습니다.');
        }
    };

    const fetchSharedMedia = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}/media`);
            const data = await response.json();
            setSharedMedia(data);
        } catch (error) {
            console.error('Failed to fetch shared media:', error);
        }
    };

    const fetchMutualFriends = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}/mutual`);
            const data = await response.json();
            setMutualFriends(data);
        } catch (error) {
            console.error('Failed to fetch mutual friends:', error);
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const response = await fetch(`${API_URL}/api/friends/${friendId}/activities`);
            const data = await response.json();
            setRecentActivities(data);
        } catch (error) {
            console.error('Failed to fetch recent activities:', error);
        }
    };

    // 배경 그라데이션 생성
    const generateBackgroundGradient = async () => {
        try {
            if (friend?.profileImage) {
                const colors = await extractDominantColors(friend.profileImage);
                setGradientColors(colors);
            }
        } catch (error) {
            console.error('Failed to generate background gradient:', error);
        }
    };
    // 프로필 사진 관련 이벤트 핸들러
    const handleProfileImagePress = () => {
        setIsImageViewerVisible(true);
    };

    const handleProfileImageLongPress = () => {
        setShowSaveOptions(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
            showLikeAnimation();
            setIsLiked(prev => !prev);
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    };

    // 좋아요 애니메이션
    const showLikeAnimation = () => {
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

    // 상태 메시지 관련 함수
    const handleStatusMessageUpdate = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(
                `${API_URL}/api/friends/${friendId}/status`,
                { statusMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsEditingStatus(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to update status message:', error);
            Alert.alert('오류', '상태 메시지 업데이트에 실패했습니다.');
        }
    };

    // 탭 전환 관련 함수
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

    // 액션 버튼 핸들러
    const handleStartChat = () => {
        navigation.navigate('ChatRoom', { userId: friendId });
    };

    const handleVoiceCall = async () => {
        try {
            const callSession = await initializeJitsiCall('audio');
            navigation.navigate('Call', {
                session: callSession,
                type: 'audio',
                userId: friendId
            });
        } catch (error) {
            console.error('Failed to start voice call:', error);
            Alert.alert('오류', '음성 통화를 시작할 수 없습니다.');
        }
    };

    const handleVideoCall = async () => {
        try {
            const callSession = await initializeJitsiCall('video');
            navigation.navigate('Call', {
                session: callSession,
                type: 'video',
                userId: friendId
            });
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
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.post(
                                `${API_URL}/api/friends/${friendId}/block`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            navigation.goBack();
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error('Failed to block user:', error);
                            Alert.alert('오류', '차단에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // Jitsi 통화 초기화
    const initializeJitsiCall = async (type) => {
        const callId = `${user.id}-${friendId}-${Date.now()}`;
        const callOptions = {
            room: `studymate-${callId}`,
            userInfo: {
                displayName: user.name,
                email: user.email,
                avatar: user.profileImage
            },
            audioOnly: type === 'audio',
            videoMuted: type === 'audio'
        };

        return callOptions;
    };

    // 렌더링 메서드들
    const renderProfileImage = () => (
        <TouchableOpacity
            onPress={handleProfileImagePress}
            onLongPress={handleProfileImageLongPress}
            onPress={handleDoubleTap}
            delayLongPress={500}
        >
            <Animated.View
                style={[
                    styles.profileImageContainer,
                    {
                        transform: [{ scale: profileImageScale }]
                    }
                ]}
            >
                <FastImage
                    style={styles.profileImage}
                    source={{
                        uri: friend?.profileImage,
                        priority: FastImage.priority.high
                    }}
                    defaultSource={require('../../assets/images/icons/user.png')}
                />
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
        </TouchableOpacity>
    );
    // 탭 콘텐츠 렌더링
    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <View style={styles.tabContent}>
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

            case 'media':
                return (
                    <View style={styles.mediaGrid}>
                        {sharedMedia.map((media, index) => (
                            <TouchableOpacity
                                key={media.id}
                                style={styles.mediaItem}
                                onPress={() => handleMediaPress(media)}
                            >
                                <FastImage
                                    style={styles.mediaThumbnail}
                                    source={{ uri: media.thumbnail }}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                {media.type === 'video' && (
                                    <View style={styles.playButton}>
                                        <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                );

            case 'groups':
                return (
                    <ScrollView
                        horizontal
                        style={styles.groupsContainer}
                        showsHorizontalScrollIndicator={false}
                    >
                        {mutualFriends.map(group => (
                            <TouchableOpacity
                                key={group.id}
                                style={styles.groupCard}
                                onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                            >
                                <FastImage
                                    style={styles.groupImage}
                                    source={{ uri: group.image }}
                                    defaultSource={require('../../assets/images/icons/user.png')}
                                />
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={styles.groupMemberCount}>
                                    {group.memberCount}명
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );

            default:
                return null;
        }
    };

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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={gradientColors}
                style={styles.gradientBackground}
            />

            {renderProfileImage()}

            <Text style={styles.name}>{friend?.name}</Text>

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
                    <Text style={styles.statusMessage}>{friend?.statusMessage}</Text>
                )}
            </TouchableOpacity>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'info' && styles.activeTab]}
                    onPress={() => handleTabPress('info')}
                >
                    <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                        기본 정보
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'media' && styles.activeTab]}
                    onPress={() => handleTabPress('media')}
                >
                    <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
                        공유 미디어
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
                    onPress={() => handleTabPress('groups')}
                >
                    <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
                        공통 그룹
                    </Text>
                </TouchableOpacity>
            </View>

            {renderTabContent()}
            {renderActionButtons()}

            <Modal
                visible={isImageViewerVisible}
                transparent={true}
                onRequestClose={() => setIsImageViewerVisible(false)}
            >
                <ImageViewer
                    imageUrls={[{ url: friend?.profileImage }]}
                    enableSwipeDown
                    onSwipeDown={() => setIsImageViewerVisible(false)}
                    renderIndicator={() => null}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    profileImage: {
        width: SCREEN_WIDTH * 0.4,
        height: SCREEN_WIDTH * 0.4,
        borderRadius: (SCREEN_WIDTH * 0.4) / 2,
    },
    name: {
        fontSize: 24,
        fontFamily: 'SFProDisplay-Bold',
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        textAlign: 'center',
    },
    statusMessage: {
        fontSize: 16,
        fontFamily: 'SFProText-Italic',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
        color: 'rgba(255, 255, 255, 0.7)',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#FFFFFF',
        marginLeft: 12,
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
    },
    mediaItem: {
        width: (SCREEN_WIDTH - 48) / 3,
        height: (SCREEN_WIDTH - 48) / 3,
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -12 }, { translateY: -12 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 4,
    },
    groupsContainer: {
        padding: 16,
    },
    groupCard: {
        width: 160,
        marginRight: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    groupImage: {
        width: '100%',
        height: 100,
    },
    groupName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#FFFFFF',
        margin: 8,
    },
    groupMemberCount: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: 'rgba(255, 255, 255, 0.7)',
        marginHorizontal: 8,
        marginBottom: 8,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
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
    likeIcon: {
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
        transform: [{ translateY: -40 }],
    },
});

export default FriendProfileDetailScreen;