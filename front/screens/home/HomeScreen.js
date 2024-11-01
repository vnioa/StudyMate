import {useState, useEffect, useRef, useCallback} from "react";
import {Animated, Dimensions, Platform, AppState, SafeAreaView, View, TouchableOpacity, ScrollView} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {SharedElement} from 'react-navigation-shared-element';
import SkeletonContent from 'react-native-skeleton-content';
import CircularProgress from 'react-native-circular-progress';
import {BlurView} from 'expo-blur';
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import * as BackgroundFetch from "expo-notifications";

const {width, height} = Dimensions.get('window');
const isSmallDevice = width < 375;
const HEADER_HEIGHT = Platform.OS === 'ios' ? '88' : '64';
const BOTTOM_TAB_HEIGHT = Platform.OS === 'ios' ? '83' : '60';
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? '34' : '0';
const REFRESH_INTERVAL = 300000; // 5분
const MAX_RETRY_ATTEMPTS = 3;
const CACHE_EXPIRY = 3600000; // 1시간
const colors = {
    primary: '#4A90E2',
    primaryLight: 'rgba(74,144,226,0.1)',
    primaryDark: '#357ABD',
    secondary: '#FF6B6B',
    success: '#6BCB77',
    warning: '#FFD93D',
    background: '#F8F9FA',
    white: '#FFFFFF',
    text: '#333333',
    textSecondary: '#757575',
    border: '#E9ECEF',
    shadow: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

const shadows = {
    small: Platform.select({
        ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 3,
        },
    }),
    medium: Platform.select({
        ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        android: {
            elevation: 6,
        },
    }),
    large: Platform.select({
        ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
        },
        android: {
            elevation: 8,
        },
    }),
};

const HomeScreen = ({navigation}) => {
    // 기본 상태 관리
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [networkStatus, setNetworkStatus] = useState(true);

    // 데이터 상태 관리
    const [userProfile, setUserProfile] = useState(null);
    const [learningStats, setLearningStats] = useState({
        todayMinutes: 0,
        streakDays: 0,
        weeklyStats: Array(7).fill(0),
        goalAchievement: 0,
        lastUpdateTime: null,
        totalLearningDays: 0,
        preferredLearningTime: null
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [recommendedContent, setRecommendedContent] = useState([]);
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [notiffications, setNotiffications] = useState({});
    const [cachedData, setCachedData] = useState({});
    const [userPreference, setUserPreference] = useState({
        notificationEnabled: true,
        darkMode: false,
        soundEnabled: true,
        hapticEnabled: true,
        autoPlay: false
    });

    // 애니메이션 상태 관리
    const scrollY = useRef(new Animated.Value(0)).current;
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const refreshAnimation = useRef(new Animated.Value(0)).current;
    const cardScaleAnimations = useRef({}).current;
    const progressRef = useRef(null);
    const scrollViewRef = useRef(null);
    const networkRetryCount = useRef(0);
    const refreshTimeout = useRef(null);
    const appStateSubscription = useRef(null);
    const networkSubscription = useRef(null);

    // 헤더 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [80, 60],
        extrapolate: 'clamp'
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.9],
        extrapolate: 'clamp'
    });

    // 초기화 및 정리
    useEffect(() => {
        initializeApp();
        setupSubscriptions();
        return () => cleanupResources();
    }, []);

    // 네트워크 상태 모니터링
    useEffect(() => {
        setupNetworkMonitoring();
        return () => networkSubscription.current?.();
    }, []);

    // 앱 상태 모니터링
    useEffect(() => {
        setupAppStateMonitoring();
        return () => appStateSubscription.current?.remove();
    }, []);

    // 자동 새로고침
    useEffect(() => {
        setupAutoRefresh();
        return () => clearTimeout(refreshTimeout.current);
    }, []);

    const setupSubscriptions = () => {
        setupNotificationSubscription();
        setupProgressTracking();
        setupCacheManagement();
    };

    const setupNetworkingMonitoring = () => {
        networkSubscription.current = NetInfo.addEventListener(state => {
            setNetworkStatus(state.isConnected);
            if(state.isConnected && !isLoading){
                syncOfflineData();
            }
        });
    };

    const setupAppStateMonitoring = () => {
        appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
            if(nextAppState === 'active'){
                refreshData();
                syncLearningProgress();
            }else if(nextAppState === 'background'){
                saveCacheData();
            }
        });
    };

    const setupAutoRefresh = () => {
        refreshTimeout.current = setInterval(() => {
            if(networkStatus && !isLoading){
                refreshData(true);
            }
        }, REFRESH_INTERVAL);
    };

    const initializeApp = async () => {
        try{
            await loadCachedData();
            await Promise.all([
                initializeUserData(),
                initializeLearningStats(),
                initializeContent(),
                setupNotifications(),
                loadUserPreferences()
            ]);
            setIsLoading(false);
        }catch(error){
            handleError(error);
        }
    };

    const initializeUserData = async () => {
        try {
            const [userData, preferences] = await Promise.all([
                API.getUserProfile(),
                AsyncStorage.getItem('userPreferences')
            ]);
            setUserProfile(userData);
            if (preferences) {
                setUserPreferences(JSON.parse(preferences));
            }
        } catch (error) {
            throw new Error('User data initialization failed');
        }
    };

    const initializeLearningStats = async () => {
        try {
            const stats = await API.getLearningStats();
            validateAndUpdateStats(stats);
            startProgressAnimation(stats.goalAchievement);
        } catch (error) {
            throw new Error('Learning stats initialization failed');
        }
    };

    const validateAndUpdateStats = (stats) => {
        if (isValidStats(stats)) {
            setLearningStats(stats);
            updateLocalCache('learningStats', stats);
        } else {
            throw new Error('Invalid learning stats data');
        }
    };

    const isValidStats = (stats) => {
        return stats &&
            typeof stats.todayMinutes === 'number' &&
            Array.isArray(stats.weeklyStats) &&
            stats.weeklyStats.length === 7;
    };

    const handleError = (error) => {
        setError(error);
        if (networkRetryCount.current < MAX_RETRY_ATTEMPTS) {
            networkRetryCount.current += 1;
            setTimeout(initializeApp, 1000 * networkRetryCount.current);
        } else {
            setIsLoading(false);
            showErrorMessage('네트워크 연결을 확인해주세요');
        }
    };

    // 데이터 동기화 및 캐시 관리
    const syncOfflineData = async () => {
        try {
            const offlineActions = await AsyncStorage.getItem('offlineActions');
            if (offlineActions) {
                const actions = JSON.parse(offlineActions);
                await Promise.all(actions.map(action => processOfflineAction(action)));
                await AsyncStorage.removeItem('offlineActions');
            }
        } catch (error) {
            console.error('Offline sync error:', error);
        }
    };

    const processOfflineAction = async (action) => {
        switch (action.type) {
            case 'UPDATE_PROGRESS':
                await API.updateLearningProgress(action.data);
                break;
            case 'COMPLETE_ACTIVITY':
                await API.completeActivity(action.data);
                break;
            // 추가 오프라인 액션 처리
        }
    };

    // 학습 진행도 관리
    const updateLearningProgress = async (minutes, activityType) => {
        try {
            if (!networkStatus) {
                await saveOfflineAction('UPDATE_PROGRESS', { minutes, activityType });
                return;
            }

            const updatedStats = await API.updateLearningProgress(minutes, activityType);
            validateAndUpdateStats(updatedStats);
            updateStreakStatus(updatedStats);
            triggerAchievementCheck(updatedStats);

            if (updatedStats.goalAchievement >= 100) {
                celebrateGoalCompletion();
            }
        } catch (error) {
            handleProgressUpdateError(error);
        }
    };

    // 학습 데이터 관리
    const triggerAchievementCheck = async (stats) => {
        const achievements = calculateNewAchievements(stats);
        if (achievements.length > 0) {
            await updateUserAchievements(achievements);
            showAchievementNotifications(achievements);
        }
    };

    const calculateNewAchievements = (stats) => {
        const achievements = [];
        const milestones = [1, 7, 30, 100, 365]; // 학습 일수 마일스톤

        if (milestones.includes(stats.streakDays)) {
            achievements.push({
                type: 'STREAK',
                days: stats.streakDays,
                timestamp: Date.now()
            });
        }

        if (stats.totalLearningTime >= stats.dailyGoal * 2) {
            achievements.push({
                type: 'OVERACHIEVER',
                timestamp: Date.now()
            });
        }

        return achievements;
    };

    const updateUserAchievements = async (achievements) => {
        try {
            await API.updateAchievements(achievements);
            updateLocalAchievements(achievements);
        } catch (error) {
            console.error('Achievement update error:', error);
            queueOfflineAction('UPDATE_ACHIEVEMENTS', achievements);
        }
    };

    // 학습 통계 분석
    const analyzeLearningPattern = () => {
        const pattern = {
            preferredTime: calculatePreferredLearningTime(),
            weekdayPerformance: analyzeWeekdayPerformance(),
            subjectDistribution: analyzeSubjectDistribution(),
            improvementRate: calculateImprovementRate()
        };

        updateLearningRecommendations(pattern);
    };

    const calculatePreferredLearningTime = () => {
        const timeSlots = learningStats.learningTimeDistribution;
        return Object.entries(timeSlots)
            .sort(([, a], [, b]) => b - a)[0][0];
    };

    const analyzeWeekdayPerformance = () => {
        return learningStats.weeklyStats.map((minutes, index) => ({
            day: index,
            performance: minutes / learningStats.dailyGoal
        }));
    };

    // 콘텐츠 추천 시스템
    const updateLearningRecommendations = async (pattern) => {
        try {
            const recommendations = await API.getPersonalizedRecommendations(pattern);
            setRecommendedContent(prevContent =>
                mergeAndSortContent(prevContent, recommendations)
            );
        } catch (error) {
            console.error('Recommendation update error:', error);
        }
    };

    const mergeAndSortContent = (existing, new_content) => {
        const merged = [...existing, ...new_content];
        return merged
            .filter((content, index, self) =>
                index === self.findIndex(c => c.id === content.id)
            )
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
    };

    // 알림 관리
    const setupNotificationHandlers = () => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: userPreferences.notificationsEnabled,
                shouldPlaySound: userPreferences.soundEnabled,
                shouldSetBadge: true,
            }),
        });
    };

    const scheduleReminders = async () => {
        if (!userPreferences.notificationsEnabled) return;

        const preferredTime = learningStats.preferredLearningTime;
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "학습 시간이에요!",
                body: "오늘의 학습 목표를 달성해보세요.",
                data: { screen: 'Learning' },
            },
            trigger: {
                hour: preferredTime,
                minute: 0,
                repeats: true,
            },
        });
    };

    // 캐시 및 오프라인 데이터 관리
    const saveOfflineAction = async (type, data) => {
        try {
            const actions = await AsyncStorage.getItem('offlineActions') || '[]';
            const updatedActions = JSON.parse(actions);
            updatedActions.push({ type, data, timestamp: Date.now() });
            await AsyncStorage.setItem('offlineActions', JSON.stringify(updatedActions));
        } catch (error) {
            console.error('Offline action save error:', error);
        }
    };

    const updateLocalCache = async (key, data) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Cache update error:', error);
        }
    };

    // 인터랙션 핸들러
    const handleContentInteraction = async (contentId, interactionType) => {
        try {
            await API.trackContentInteraction(contentId, interactionType);
            updateContentRelevance(contentId, interactionType);
        } catch (error) {
            console.error('Content interaction error:', error);
            saveOfflineAction('TRACK_INTERACTION', { contentId, interactionType });
        }
    };

    const updateContentRelevance = (contentId, interactionType) => {
        setRecommendedContent(prevContent =>
            prevContent.map(content => {
                if (content.id === contentId) {
                    return {
                        ...content,
                        relevanceScore: calculateNewRelevanceScore(content, interactionType)
                    };
                }
                return content;
            })
        );
    };

    // 애니메이션 컨트롤
    const startProgressAnimation = (targetValue) => {
        Animated.sequence([
            Animated.timing(progressAnimation, {
                toValue: targetValue,
                duration: 1000,
                useNativeDriver: false,
            }),
            Animated.spring(progressAnimation, {
                toValue: targetValue,
                friction: 4,
                useNativeDriver: false,
            })
        ]).start();
    };

    const animateCardPress = (contentId) => {
        if (!cardScaleAnimations[contentId]) {
            cardScaleAnimations[contentId] = new Animated.Value(1);
        }

        Animated.sequence([
            Animated.timing(cardScaleAnimations[contentId], {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(cardScaleAnimations[contentId], {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();
    };

    // 성능 최적화
    const optimizeImageLoading = useCallback((images) => {
        return images.map(image => ({
            ...image,
            uri: generateOptimizedImageUrl(image.uri, {
                width: Math.round(width * 0.8),
                quality: 'auto'
            })
        }));
    }, [width]);

    const generateOptimizedImageUrl = (uri, options) => {
        const baseUrl = uri.split('?')[0];
        const params = new URLSearchParams({
            w: options.width,
            q: options.quality,
            auto: 'format'
        });
        return `${baseUrl}?${params.toString()}`;
    };

    // 에러 처리
    const handleProgressUpdateError = (error) => {
        console.error('Progress update error:', error);
        showErrorMessage('학습 진행도 업데이트 중 오류가 발생했습니다');
        saveOfflineAction('RETRY_PROGRESS_UPDATE', {
            timestamp: Date.now(),
            error: error.message
        });
    };

    const showErrorMessage = (message) => {
        // Toast 또는 알림 표시 로직
        if (userPreferences.hapticEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const getCurrentSessionId = () => {
        return `session_${Date.now()}_${userProfile.id}_${Math.random().toString(36).substring(7)}`;
    };

    // 분석 및 트래킹
    const trackUserBehavior = async (action, metadata = {}) => {
        try {
            const sessionId = getCurrentSessionId();
            const eventData = {
                ...metadata,
                timestamp: Date.now(),
                userId: userProfile.id,
                sessionId,
                deviceInfo: await getDeviceInfo(),
                networkType: await NetInfo.getConnectionInfo(),
                currentScreen: navigation.getCurrentRoute()?.name
            };

            await Analytics.logEvent(action, eventData);

            if (!networkStatus) {
                await storeAnalyticsOffline(action, eventData);
            }
        } catch (error) {
            console.error('Analytics tracking error:', error);
            await storeAnalyticsOffline(action, metadata);
        }
    };

    const storeAnalyticsOffline = async (action, data) => {
        try {
            const offlineAnalytics = await AsyncStorage.getItem('offlineAnalytics') || '[]';
            const updatedAnalytics = JSON.parse(offlineAnalytics);
            updatedAnalytics.push({
                action,
                data,
                timestamp: Date.now()
            });
            await AsyncStorage.setItem('offlineAnalytics', JSON.stringify(updatedAnalytics));
        } catch (error) {
            console.error('Offline analytics storage error:', error);
        }
    };

    // 성능 모니터링
    const monitorPerformance = () => {
        const startTime = performance.now();

        return {
            endMonitoring: () => {
                const endTime = performance.now();
                const duration = endTime - startTime;

                trackUserBehavior('PERFORMANCE_METRIC', {
                    duration,
                    screenName: 'HomeScreen',
                    memoryUsage: performance.memory?.usedJSHeapSize,
                    frameRate: global.__frameRate
                });
            }
        };
    };

    // 사용자 세션 관리
    const initializeSession = async () => {
        const sessionId = getCurrentSessionId();
        await AsyncStorage.setItem('currentSessionId', sessionId);

        return {
            sessionId,
            startTime: Date.now(),
            lastActiveTime: Date.now()
        };
    };

    const updateSessionActivity = async () => {
        try {
            const currentSession = await AsyncStorage.getItem('currentSessionId');
            if (currentSession) {
                await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
            } else {
                await initializeSession();
            }
        } catch (error) {
            console.error('Session update error:', error);
        }
    };

    // 딥링크 처리
    const handleDeepLink = async (link) => {
        try {
            const { path, params } = parseLinkUrl(link);

            switch (path) {
                case 'content':
                    await navigateToContent(params.contentId);
                    break;
                case 'activity':
                    await navigateToActivity(params.activityId);
                    break;
                case 'achievement':
                    await showAchievement(params.achievementId);
                    break;
                default:
                    console.warn('Unknown deep link path:', path);
            }

            trackUserBehavior('DEEP_LINK_OPENED', { path, params });
        } catch (error) {
            console.error('Deep link handling error:', error);
            showErrorMessage('콘텐츠를 불러오는 중 오류가 발생했습니다');
        }
    };

    const parseLinkUrl = (url) => {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const params = Object.fromEntries(parsedUrl.searchParams);

        return {
            path: pathSegments[0],
            params
        };
    };

    // 캐시 최적화
    const optimizeCacheStorage = async () => {
        try {
            const cacheInfo = await AsyncStorage.getItem('cacheInfo') || '{}';
            const parsedCache = JSON.parse(cacheInfo);
            const currentTime = Date.now();

            const expiredItems = Object.entries(parsedCache)
                .filter(([_, info]) => currentTime - info.timestamp > CACHE_EXPIRY);

            await Promise.all(
                expiredItems.map(([key]) => AsyncStorage.removeItem(key))
            );

            const updatedCache = Object.fromEntries(
                Object.entries(parsedCache)
                    .filter(([key]) => !expiredItems.find(([expiredKey]) => expiredKey === key))
            );

            await AsyncStorage.setItem('cacheInfo', JSON.stringify(updatedCache));
        } catch (error) {
            console.error('Cache optimization error:', error);
        }
    };

    // 메모리 관리
    const optimizeMemoryUsage = () => {
        if (Platform.OS === 'android') {
            if (global.gc) {
                global.gc();
            }
        }

        Object.keys(cardScaleAnimations).forEach(key => {
            if (!recentActivities.find(activity => activity.id === key)) {
                delete cardScaleAnimations[key];
            }
        });
    };

    // 이미지 프리로딩
    const preloadImages = async () => {
        try {
            const imagesToPreload = [
                ...recommendedContent.map(content => content.thumbnail),
                userProfile.avatar,
                ...recentActivities
                    .filter(activity => activity.image)
                    .map(activity => activity.image)
            ];

            const uniqueImages = [...new Set(imagesToPreload)];
            await Promise.all(
                uniqueImages.map(async (imageUrl) => {
                    try {
                        await Image.prefetch(imageUrl);
                    } catch (error) {
                        console.error('Image preload error:', imageUrl, error);
                    }
                })
            );
        } catch (error) {
            console.error('Image preloading error:', error);
        }
    };

    // 네트워크 요청 최적화
    const optimizeNetworkRequests = async (requests) => {
        const batchSize = 4; // 동시 요청 제한
        const results = [];

        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async request => {
                    try {
                        return await request();
                    } catch (error) {
                        console.error('Network request error:', error);
                        return null;
                    }
                })
            );
            results.push(...batchResults);
        }

        return results.filter(Boolean);
    };

    // 백그라운드 작업 관리
    const scheduleBackgroundTasks = async () => {
        try {
            await BackgroundFetch.registerTaskAsync('BACKGROUND_SYNC', {
                minimumInterval: 900, // 15분
                stopOnTerminate: false,
                startOnBoot: true
            });
        } catch (error) {
            console.error('Background task registration error:', error);
        }
    };

    const handleBackgroundSync = async () => {
        try {
            await syncOfflineData();
            await optimizeCacheStorage();
            await syncAnalytics();
        } catch (error) {
            console.error('Background sync error:', error);
        }
    };

    // 앱 상태 복원
    const restoreAppState = async () => {
        try {
            const savedState = await AsyncStorage.getItem('appState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (isStateValid(parsedState)) {
                    await restoreState(parsedState);
                }
            }
        } catch (error) {
            console.error('State restoration error:', error);
        }
    };

    const isStateValid = (state) => {
        return state &&
            state.version === APP_STATE_VERSION &&
            state.timestamp > Date.now() - STATE_VALIDITY_DURATION;
    };

    const restoreState = async (state) => {
        setLearningStats(state.learningStats);
        setRecentActivities(state.recentActivities);
        setRecommendedContent(state.recommendedContent);
        await restoreAnimationState(state.animationState);
    };

    // 리소스 정리
    const cleanupResources = () => {
        clearTimeout(refreshTimeout.current);
        networkSubscription.current?.();
        appStateSubscription.current?.remove();
        progressAnimation.removeAllListeners();
        scrollY.removeAllListeners();
        Object.values(cardScaleAnimations).forEach(animation =>
            animation.removeAllListeners()
        );
        BackgroundFetch.unregisterTaskAsync('BACKGROUND_SYNC')
            .catch(error => console.error('Background task cleanup error:', error));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 상단 바 */}
            <Animated.View style={[styles.header, {height: headerHeight, opacity: headerOpacity}]}>
                <BlurView intensity={100} style={StyleSheet.absoluteFill}>
                    <View style={styles.headerContent}>
                        {/* 좌측: 사용자 프로필 아이콘 */}
                        <TouchableOpacity
                            onPress={handleProfilePress}
                            style={styles.profileButton}
                        >
                            <Image
                                source={{uri: userProfile?.avatar}}
                                style={styles.profileIcon}
                            />
                        </TouchableOpacity>
                        {/* 중앙: 앱 로고 */}
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.profileIcon}
                        />
                        {/* 우측: 알림, 설정 아이콘 */}
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Notifications')}
                                style={styles.iconButton}
                            >
                                {notifications.length > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.badgeText}>
                                            {notifications.length}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons name="notifications-outline" size={24} color="#333333"/>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Settings')}
                                style={styles.iconButton}
                            >
                                <Ionicons name="settings-outline" size={24} color="#333333"/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>
            {/* 메인 콘텐츠 스크롤 영역 */}
            <Animated.ScrollView
                ref={scrollViewRef}
                onScroll={Animated.event(
                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                    {useNativeDriver: false}
                )}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 오늘의 학습 요약 카드 */}
                <View style={styles.learningCard}>
                    <LinearGradient
                        colors={['#4A90E2', '#357ABD']}
                        style={styles.gradientBackground}
                    >
                        <View style={styles.learningCardContent}>
                            <CircularProgress
                                ref={progressRef}
                                size={100}
                                width={10}
                                fill={learningStats.goalAchievement}
                                tintColor="#FFFFFF"
                                backgroundColor="rgba(255, 255, 255, 0.3)"
                                rotation={0}
                                lineCap="round"
                            >
                                {() => (
                                    <View style={styles.progressTextContainer}>
                                        <Text style={styles.progressPercentage}>
                                            {`${learningStats.goalAchievement}%`}
                                        </Text>
                                        <Text style={styles.progressLabel}>달성</Text>
                                    </View>
                                )}
                            </CircularProgress>

                            <View style={styles.learningStats}>
                                <Text style={styles.learningTimeText}>
                                    오늘 {Math.floor(learningStats.todayMinutes / 60)}시간{' '}{learningStats.todayMinutes % 60}분 학습했어요
                                </Text>
                                <View style={styles.streakContainer}>
                                    <Iconicons name="flame" size={20} color="#FFD93D"/>
                                    <Text style={styles.streakText}>
                                        {learningStats.streakDays}일 연속 학습 중
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
                {/* 빠른 액세스 버튼 영역 */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.quickAccessContainer}
                >
                    {[
                        {type: 'personal', icon: 'person', label: '개인 학습'},
                        {type: 'group', icon: 'people', label: '그룹 학습'},
                        {type: 'quiz', icon: 'help', label: '퀴즈 풀기'},
                        {type: 'materials', icon: 'library-books', label: '학습 자료'}
                    ].map((item, index) => (
                        <TouchableOpacity
                            key={item.type}
                            style={styles.quickAccessButton}
                            onPress={() => handleQuickAccessPress(item.type)}
                        >
                            <MaterialIcons name={item.icon} size={32} color="#4A90E2"/>
                            <Text style={styles.quickAccessLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {/* 최근 활동 섹션 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>최근 활동</Text>
                    {recentActivities.map((activity, index) => (
                        <Swipeable
                            key={activity.id}
                            renderRightActions={() => (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleActivityDelete(activity.id)}
                                >
                                    <MaterialIcons name="delete" size={24} color="#FF6868"/>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={styles.activityItem}>
                                <MaterialIcons name={activity.icon} size={24} color="#757575"/>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                </View>
                            </View>
                        </Swipeable>
                    ))}
                </View>
                {/* 추천 학습 콘텐츠 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>추천 학습</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.recommendedScrollView}
                        pagingEnabled
                    >
                        {recommendedContent.map((content, index) => (
                            <TouchableOpacity
                                key={content.id}
                                style={styles.contentCard}
                                onPress={() => handleContentPress(content)}
                            >
                                <Image
                                    source={{uri: content.thumbnail}}
                                    style={styles.contentThumbnail}
                                />
                                <View style={styles.contentInfo}>
                                    <Text style={styles.contentTitle}>{content.title}</Text>
                                    <Text style={styles.contentDescription}>{content.description}</Text>
                                    <TouchableOpacity
                                        style={styles.startLearningButton}
                                        onPress={() => handleContentPress(content)}
                                    >
                                        <Text style={styles.startLearningText}>지금 학습하기</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.paginationDots}>
                        {recommendedContent.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    {backgroundColor: currentPage === index ? '#4A90E2' : '#E9ECEF'}
                                ]}
                            />
                        ))}
                    </View>
                </View>
                {/* 학습 통계 요약 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>주간 학습 통계</Text>
                    <LineChart
                        data={{
                            labels: ['월', '화', '수', '목', '금', '토', '일'],
                            datasets: [{
                                data: learningStats.weeklyStats
                            }]
                        }}
                        width={width - 40}
                        height={200}
                        chartConfig={{
                            backgroundColor: "#FFFFFF",
                            backgroundGradientFrom: "#FFFFFF",
                            backgroundGradientTo: "#FFFFFF",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                            style: {
                                borderRadius: 16
                            }
                        }}
                        style={styles.chart}
                        bezier
                    />
                </View>
                {/* 동기부여 섹션 */}
                <View style={styles.motivationContainer}>
                    <Text style={styles.motivationalQuote}>{motivationalQuote}</Text>
                    <TouchableOpacity
                        style={styles.refreshQuoteButton}
                        onPress={refreshMotivationlQuote}
                    >
                        <MaterialIcons name="refresh" size={24} color="#4A90E2"/>
                    </TouchableOpacity>
                </View>
            </Animated.ScrollView>
            {/* 하단 탭 바 */}
            <View style={styles.tabBar}>
                {[
                    {icon: 'home', label: '홈'},
                    {icon: 'chat', label: '채팅'},
                    {icon: 'person', label: '개인 학습'},
                    {icon: 'group', label: '그룹 학습'},
                    {icon: 'account-circle', label: '마이페이지'}
                ].map((tab, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.tabItem}
                        onPress={() => handleTabPress(index)}
                    >
                        <MaterialIcons
                            name={tab.icon}
                            size={24}
                            color={currentTab === index ? '#4A90E2' : '#757575'}
                        />
                        <Text
                            style={[
                                styles.tabLabel,
                                {color: currentTab === index ? '#4A90E2' : '#757575'}
                            ]}
                        >{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // 기본 컨테이너
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // 헤더 스타일
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        height: HEADER_HEIGHT,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
        ...shadows.medium,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: Platform.OS === 'ios' ? 44 : 56,
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        ...shadows.small,
    },
    profileIcon: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    profileBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.white,
        ...shadows.small,
    },
    logo: {
        width: 120,
        height: 30,
        resizeMode: 'contain',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.transparent,
    },
    iconButtonPressed: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: colors.secondary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        borderWidth: 2,
        borderColor: colors.white,
        ...shadows.small,
    },
    badgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        includeFontPadding: false,
    },

    // 스크롤 컨텐츠
    scrollContent: {
        paddingTop: HEADER_HEIGHT,
        paddingBottom: BOTTOM_TAB_HEIGHT + SAFE_AREA_BOTTOM,
    },
    contentContainer: {
        flexGrow: 1,
    },

    // 학습 카드 스타일
    learningCard: {
        margin: 16,
        borderRadius: 24,
        overflow: 'hidden',
        height: 180,
        backgroundColor: colors.white,
        ...shadows.medium,
    },
    gradientBackground: {
        width: '100%',
        height: '100%',
        padding: 20,
    },
    learningCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
    },
    progressContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
    },
    progressCircle: {
        position: 'relative',
    },
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    progressPercentage: {
        color: colors.white,
        fontSize: isSmallDevice ? 22 : 24,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    progressLabel: {
        color: colors.white,
        fontSize: isSmallDevice ? 13 : 14,
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        includeFontPadding: false,
    },
    learningStats: {
        flex: 1,
        marginLeft: 20,
    },
    learningTimeText: {
        color: colors.white,
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: '600',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
        maxWidth: '90%',
    },
    streakIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    streakText: {
        color: colors.white,
        fontSize: isSmallDevice ? 13 : 14,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        includeFontPadding: false,
    },
    // 빠른 액세스 버튼 스타일
    quickAccessContainer: {
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    quickAccessScrollContent: {
        paddingRight: 16,
    },
    quickAccessButton: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
        ...shadows.small,
    },
    quickAccessGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    quickAccessIcon: {
        width: 32,
        height: 32,
        marginBottom: 4,
    },
    quickAccessLabel: {
        marginTop: 8,
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        includeFontPadding: false,
    },

    // 섹션 스타일
    sectionContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: '600',
        color: colors.text,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Bold' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.primary,
        marginRight: 4,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        includeFontPadding: false,
    },

    // 최근 활동 스타일
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...shadows.small,
    },
    activityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityIcon: {
        width: 24,
        height: 24,
    },
    activityContent: {
        flex: 1,
        marginLeft: 12,
    },
    activityTitle: {
        fontSize: isSmallDevice ? 15 : 16,
        color: colors.text,
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    activityTime: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        includeFontPadding: false,
    },
    activityRightAction: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: colors.secondary,
    },
    deleteButton: {
        backgroundColor: colors.secondary,
        width: 80,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    deleteIcon: {
        width: 24,
        height: 24,
        tintColor: colors.white,
    },
    // 추천 학습 콘텐츠 스타일
    recommendedScrollView: {
        marginTop: 8,
    },
    recommendedScrollContent: {
        paddingRight: 16,
    },
    contentCard: {
        width: width * 0.7,
        height: 250,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: colors.white,
        overflow: 'hidden',
        ...shadows.small,
    },
    contentThumbnail: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    contentGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        justifyContent: 'flex-end',
        padding: 16,
    },
    contentInfo: {
        padding: 12,
    },
    contentTitle: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    contentDescription: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.textSecondary,
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Regular' : 'sans-serif',
        includeFontPadding: false,
        lineHeight: 20,
    },
    startLearningButton: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    startLearningText: {
        color: colors.white,
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: '600',
        marginRight: 4,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
        includeFontPadding: false,
    },

    // 하단 탭 바 스타일
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: colors.white,
        height: BOTTOM_TAB_HEIGHT,
        paddingBottom: SAFE_AREA_BOTTOM,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.large,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    },
    tabItemActive: {
        backgroundColor: colors.primaryLight,
        borderRadius: 20,
        marginHorizontal: 8,
    },
    tabIcon: {
        width: 24,
        height: 24,
        marginBottom: 4,
        tintColor: colors.textSecondary,
    },
    tabIconActive: {
        tintColor: colors.primary,
    },
    tabLabel: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
        includeFontPadding: false,
    },
    tabLabelActive: {
        color: colors.primary,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
    },

    // 로딩 및 에러 상태
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorIcon: {
        width: 60,
        height: 60,
        marginBottom: 16,
        tintColor: colors.secondary,
    },
    errorText: {
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Medium' : 'sans-serif-medium',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        ...shadows.small,
    },
    retryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'SFProText-Semibold' : 'sans-serif-medium',
    },

    // 반응형 디자인을 위한 추가 스타일
    landscapeContainer: {
        flexDirection: 'row',
    },
    landscapeContent: {
        flex: 1,
        marginHorizontal: 16,
    },
    landscapeCard: {
        width: width * 0.4,
    },
    tabletContainer: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    tabletCard: {
        width: width * 0.3,
    },
});

export default HomeScreen;
