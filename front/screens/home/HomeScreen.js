import {useState, useEffect, useRef, useCallback} from "react";
import {Animated, Dimensions, Platform, AppState} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {SharedElement} from 'react-navigation-shared-element';
import SkeletonContent from 'react-native-skeleton-content';
import CircularProgress from 'react-native-circular-progress';
import {BlurView} from 'expo-blur';
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';

const {width, height} = Dimensions.get('window');
const REFRESH_INTERVAL = 300000; // 5분
const MAX_RETRY_ATTEMPTS = 3;
const CACHE_EXPIRY = 3600000; // 1시간

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


}