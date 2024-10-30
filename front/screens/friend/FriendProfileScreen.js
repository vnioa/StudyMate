import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    AppState,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    View,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { WebSocket } from 'react-native-websocket';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { manipulateAsync } from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import {Icon, Portal} from "react-native-paper";
import {BlurView} from "expo-blur";
import {TabBar} from "react-native-tab-view";
import * as PropTypes from "prop-types";
import {TabView} from "react-native-elements";
import FastImage from "react-native-fast-image";
import {LinearGradient} from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROFILE_SIZE = SCREEN_WIDTH * 0.4;
const ANIMATION_DURATION = 500;
const CACHE_EXPIRY = 1000 * 60 * 60; // 1시간
const WEBSOCKET_RETRY_INTERVAL = 3000;
const MAX_RETRY_ATTEMPTS = 3;

function SharedGroups(props) {
    return null;
}

SharedGroups.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.any),
    onGroupPress: PropTypes.any
};

function MediaGrid(props) {
    return null;
}

MediaGrid.propTypes = {
    ref: PropTypes.any,
    items: PropTypes.arrayOf(PropTypes.any),
    onItemPress: PropTypes.any
};

function InfoTab(props) {
    return null;
}

InfoTab.propTypes = {data: PropTypes.any};
const FriendProfile = ({ route, navigation }) => {
    // Redux
    const dispatch = useDispatch();
    const { friendId } = route.params;
    const currentUser = useSelector(state => state.auth.user);
    const themeMode = useSelector(state => state.settings.theme);

    // State
    const [profileData, setProfileData] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [sharedGroups, setSharedGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [dominantColor, setDominantColor] = useState('#4A90E2');
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [mediaPermission, setMediaPermission] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Refs
    const scrollViewRef = useRef(null);
    const websocketRef = useRef(null);
    const profileImageRef = useRef(null);
    const mediaGridRef = useRef(null);
    const mountedRef = useRef(true);
    const retryTimeoutRef = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    // Animated Values
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const headerHeight = useRef(new Animated.Value(PROFILE_SIZE + 120)).current;

    // Memoized Values
    const animatedHeaderStyle = useMemo(() => ({
        transform: [{
            translateY: scrollY.interpolate({
                inputRange: [0, PROFILE_SIZE],
                outputRange: [0, -PROFILE_SIZE],
                extrapolate: 'clamp'
            })
        }]
    }), [scrollY]);

    const profileImageStyle = useMemo(() => ({
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
    }), [fadeAnim, scaleAnim]);

    // WebSocket Connection
    const initializeWebSocket = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
        }

        websocketRef.current = new WebSocket(`ws://api.example.com/friends/${friendId}/status`);

        websocketRef.current.onopen = () => {
            setConnectionStatus('connected');
            setRetryCount(0);
        };

        websocketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleStatusUpdate(data);
        };

        websocketRef.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
            handleConnectionError();
        };

        websocketRef.current.onclose = () => {
            setConnectionStatus('disconnected');
            handleConnectionError();
        };
    }, [friendId]);

    // Error Handling
    const handleConnectionError = useCallback(() => {
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            retryTimeoutRef.current = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                initializeWebSocket();
            }, WEBSOCKET_RETRY_INTERVAL);
        }
    }, [retryCount, initializeWebSocket]);

    // Data Loading
    const loadProfileData = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem(`friend_profile_${friendId}`);
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    setProfileData(data);
                    setIsLoading(false);
                }
            }

            const response = await fetch(`/api/friends/${friendId}/profile`);
            const newData = await response.json();

            if (!mountedRef.current) return;

            setProfileData(newData);
            setIsLoading(false);

            await AsyncStorage.setItem(`friend_profile_${friendId}`, JSON.stringify({
                data: newData,
                timestamp: Date.now()
            }));

            const color = await extractDominantColor(newData.profileImage);
            setDominantColor(color);

        } catch (error) {
            console.error('Profile loading error:', error);
            // Implement error handling UI
        }
    }, [friendId]);

    // Media Loading
    const loadMediaItems = useCallback(async () => {
        try {
            const response = await fetch(`/api/friends/${friendId}/media`);
            const data = await response.json();
            setMediaItems(data);
        } catch (error) {
            console.error('Media loading error:', error);
        }
    }, [friendId]);

    // Groups Loading
    const loadSharedGroups = useCallback(async () => {
        try {
            const response = await fetch(`/api/friends/${friendId}/shared-groups`);
            const data = await response.json();
            setSharedGroups(data);
        } catch (error) {
            console.error('Groups loading error:', error);
        }
    }, [friendId]);

    // Image Processing
    const extractDominantColor = async (imageUri) => {
        try {
            const processedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 50 } }],
                { format: 'png' }
            );

            // Implement color extraction logic
            return '#4A90E2'; // Default fallback
        } catch (error) {
            console.error('Color extraction error:', error);
            return '#4A90E2';
        }
    };

    // Action Handlers
    const handleAction = useCallback(async (action) => {
        try {
            switch (action) {
                case 'chat':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('Chat', {
                        friendId,
                        name: profileData.name,
                        image: profileData.profileImage
                    });
                    break;

                case 'voice':
                    await checkAndRequestPermissions(['audio']);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('VoiceCall', { friendId });
                    break;

                case 'video':
                    await checkAndRequestPermissions(['audio', 'video']);
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('VideoCall', { friendId });
                    break;

                case 'block':
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    await handleBlockUser();
                    break;

                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error('Action handling error:', error);
            // Implement error handling UI
        }
    }, [friendId, profileData, navigation]);

    // Permission Handling
    const checkAndRequestPermissions = async (types) => {
        for (const type of types) {
            if (type === 'audio') {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error('Audio permission not granted');
                }
            } else if (type === 'video') {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error('Camera permission not granted');
                }
            }
        }
    };

    // Block User Handler
    const handleBlockUser = async () => {
        try {
            await fetch(`/api/friends/${friendId}/block`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setIsBlocked(true);
            dispatch({ type: 'BLOCK_USER', payload: friendId });

            // Clean up after blocking
            if (websocketRef.current) {
                websocketRef.current.close();
            }
            await AsyncStorage.removeItem(`friend_profile_${friendId}`);

            navigation.goBack();
        } catch (error) {
            console.error('Block user error:', error);
        }
    };

    // Profile Image Handlers
    const handleProfileImageLongPress = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const uri = await captureRef(profileImageRef, {
                format: 'png',
                quality: 1
            });

            if (Platform.OS === 'ios') {
                await Sharing.shareAsync(uri);
            } else {
                await MediaLibrary.saveToLibraryAsync(uri);
            }
        } catch (error) {
            console.error('Image saving error:', error);
        }
    };

    // Lifecycle
    useEffect(() => {
        loadProfileData();
        loadMediaItems();
        loadSharedGroups();
        initializeWebSocket();

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                initializeWebSocket();
            } else {
                websocketRef.current?.close();
            }
        });

        return () => {
            mountedRef.current = false;
            websocketRef.current?.close();
            clearTimeout(retryTimeoutRef.current);
            appStateSubscription.remove();
        };
    }, []);

    // Animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    // Status Updates
    const handleStatusUpdate = useCallback((data) => {
        if (Date.now() - lastUpdateRef.current < 1000) return;

        lastUpdateRef.current = Date.now();
        setProfileData(prev => ({
            ...prev,
            status: data.status,
            lastSeen: data.lastSeen
        }));
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Animated.View
                    style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}
                >
                    <LinearGradient
                        colors={[dominantColor, 'rgba(255,255,255,0.8)']}
                        style={styles.headerContent}
                    >
                        <Animated.View
                            style={[
                                styles.profileImageWrapper,
                                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                            ]}
                        >
                            <TouchableOpacity
                                ref={profileImageRef}
                                onLongPress={handleProfileImageLongPress}
                                delayLongPress={500}
                                activeOpacity={0.9}
                            >
                                <FastImage
                                    source={{
                                        uri: profileData?.profileImage,
                                        priority: FastImage.priority.high,
                                        cache: FastImage.cacheControl.immutable
                                    }}
                                    style={styles.profileImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                {profileData?.isOnline && (
                                    <View style={styles.onlineIndicator} />
                                )}
                            </TouchableOpacity>
                        </Animated.View>

                        <Animated.View
                            style={[styles.profileInfo, { opacity: fadeAnim }]}
                        >
                            <Text style={styles.nameText} numberOfLines={1}>
                                {profileData?.name}
                            </Text>
                            <Text style={styles.statusText} numberOfLines={2}>
                                {profileData?.statusMessage}
                            </Text>
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>

                <TabView
                    navigationState={{ index: activeTab, routes: tabRoutes }}
                    renderScene={SceneMap({
                        info: () => (
                            <ScrollView
                                ref={scrollViewRef}
                                contentContainerStyle={styles.tabContent}
                                scrollEventThrottle={16}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                    { useNativeDriver: true }
                                )}
                            >
                                <InfoTab data={profileData} />
                            </ScrollView>
                        ),
                        media: () => (
                            <MediaGrid
                                ref={mediaGridRef}
                                items={mediaItems}
                                onItemPress={handleMediaItemPress}
                            />
                        ),
                        groups: () => (
                            <SharedGroups
                                groups={sharedGroups}
                                onGroupPress={handleGroupPress}
                            />
                        ),
                    })}
                    onIndexChange={setActiveTab}
                    initialLayout={{ width: SCREEN_WIDTH }}
                    renderTabBar={props => (
                        <TabBar
                            {...props}
                            style={styles.tabBar}
                            indicatorStyle={[
                                styles.tabIndicator,
                                { backgroundColor: dominantColor }
                            ]}
                            labelStyle={styles.tabLabel}
                            activeColor={dominantColor}
                            inactiveColor="#666666"
                            pressColor="transparent"
                            pressOpacity={0.7}
                        />
                    )}
                    lazy
                    lazyPreloadDistance={1}
                    swipeEnabled={true}
                    onSwipeStart={() => Haptics.selectionAsync()}
                    onSwipeEnd={() => Haptics.selectionAsync()}
                />

                <BlurView
                    intensity={95}
                    tint="light"
                    style={styles.actionButtonsContainer}
                >
                    <View style={styles.actionButtonsWrapper}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: dominantColor }]}
                            onPress={() => handleAction('chat')}
                            activeOpacity={0.8}
                        >
                            <Icon name="message-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>채팅</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                            onPress={() => handleAction('voice')}
                            activeOpacity={0.8}
                        >
                            <Icon name="phone" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>음성통화</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                            onPress={() => handleAction('video')}
                            activeOpacity={0.8}
                        >
                            <Icon name="video" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>화상통화</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#757575' }]}
                            onPress={() => handleAction('block')}
                            activeOpacity={0.8}
                        >
                            <Icon
                                name={isBlocked ? "user-x" : "more-vertical"}
                                size={24}
                                color="#FFFFFF"
                            />
                            <Text style={styles.actionButtonText}>
                                {isBlocked ? '차단됨' : '더보기'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={dominantColor} />
                    </View>
                )}

                <Portal>
                    <Modal
                        visible={!!selectedMedia}
                        onDismiss={() => setSelectedMedia(null)}
                        style={styles.mediaModal}
                    >
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setSelectedMedia(null)}
                        >
                            <Icon name="x" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        {selectedMedia && (
                            <FastImage
                                source={{ uri: selectedMedia.uri }}
                                style={styles.modalImage}
                                resizeMode={FastImage.resizeMode.contain}
                            />
                        )}
                    </Modal>
                </Portal>

                <Toast ref={toastRef} position="bottom" />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: PROFILE_SIZE + 120,
        zIndex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerGradient: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        left: 16,
        zIndex: 2,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageWrapper: {
        width: PROFILE_SIZE,
        height: PROFILE_SIZE,
        borderRadius: PROFILE_SIZE / 2,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: PROFILE_SIZE / 2,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    nameText: {
        fontSize: 24,
        fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'sans-serif-medium',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
        includeFontPadding: false,
    },
    statusText: {
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        includeFontPadding: false,
    },
    lastSeenText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        color: '#999999',
        marginTop: 4,
        includeFontPadding: false,
    },
    tabBar: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        height: 48,
    },
    tabIndicator: {
        height: 3,
        borderRadius: 3,
    },
    tabLabel: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        textTransform: 'none',
        includeFontPadding: false,
        margin: 0,
    },
    tabContent: {
        flexGrow: 1,
        paddingTop: PROFILE_SIZE + 140,
    },
    scrollViewContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    actionButtonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    actionButtonText: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        color: '#FFFFFF',
        includeFontPadding: false,
    },
    mediaGrid: {
        padding: 1,
        marginTop: PROFILE_SIZE + 140,
    },
    mediaItem: {
        width: (SCREEN_WIDTH - 4) / 3,
        height: (SCREEN_WIDTH - 4) / 3,
        margin: 1,
        backgroundColor: '#F5F5F5',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
    },
    mediaLoadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupsContainer: {
        paddingTop: PROFILE_SIZE + 140,
    },
    groupsScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    groupCard: {
        width: SCREEN_WIDTH * 0.7,
        height: 180,
        marginRight: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    groupImage: {
        width: '100%',
        height: 120,
    },
    groupInfo: {
        padding: 12,
    },
    groupName: {
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        color: '#333333',
        marginBottom: 4,
        includeFontPadding: false,
    },
    groupMemberCount: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        color: '#666666',
        includeFontPadding: false,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    mediaModal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
    },
    modalCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        color: '#666666',
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
    },
    retryButtonText: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        color: '#FFFFFF',
    },
});

export default FriendProfile;