import {useState, useEffect, useRef} from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    PanResponder,
    Platform,
    AppState,
    InteractionManager,
    StatusBar
} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {format, differenceInDays, startOfWeek, endOfWeek} from 'date-fns';
import * as Haptics from 'expo-haptics';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import {SafeAreaView} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import {BlurView} from "expo-blur";
import * as FileSystem from "expo-file-system";

const {width, height} = Dimensions.get('window');
const API_URL = 'http://121.127.165.43:3000';
const CACHE_CONFIG = {
    TTL: 300000,
    VERSION: '1.0.0',
    PREFIX: 'group_main_'
};

const ANIMATIONS = {
    CURATION: {
        FAST: 200,
        NORMAL: 300,
        SLOW: 500
    },
    TIMING: {
        ENTRY_DELAY: 50,
        PROGRESS_DURATION: 1500
    }
};

const GroupMainScreen = ({navigation, route}) => {
    const [userProfile, setUserProfile] = useState({
        id: '',
        name: '',
        avatarUrl: '',
        role: '',
        groupIds: [],
        preferences: {},
        settings: {},
        lastActive: null,
        deviceToken: null
    });

    const [learningStats, setLearningStats] = useState({
        daily: {
            totalTime: 0,
            completeTasks: 0,
            activeTime: 0,
            focusScore: 0,
            breaks: 0
        },
        weekly: {
            totalTime: 0,
            averageDaily: 0,
            bestDay: null,
            completionRate: 0
        },
        monthly: {
            totalTime: 0,
            streakCount: 0,
            milestones: [],
            progression: []
        }
    });

    const [groupData, setGroupData] = useState({
        activeGroups: [],
        pendingInvites: [],
        groupActivities: [],
        notifications: [],
        rankings: []
    });

    // UI States
    const [uiState, setUiState] = useState({
        isLoading: true,
        isRefreshing: false,
        activeSection: null,
        modalVisible: false,
        toastConfig: null,
        errorState: null,
        networkStatus: true,
        orientation: 'portrait',
        theme: 'light',
        accessibility: {
            reduceMotion: false,
            fontSize: 'normal'
        }
    });

    // Animation Refs
    const animationRefs = {
        fade: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(1)).current,
        progress: useRef(new Animated.Value(0)).current,
        slide: useRef(new Animated.Value(0)).current,
        rotation: useRef(new Animated.Value(0)).current,
    };

    // Functional Refs
    const functionalRefs = {
        scroll: useRef(null),
        timer: useRef(null),
        network: useRef(null),
        appState: useRef(AppState.currentState),
        interaction: useRef(null),
        cache: useRef(new Map()),
        errorBoundary: useRef(null),
    };

    // System Monitors
    const systemMonitors = {
        memoryWarning: useRef(false),
        lastSync: useRef(Date.now()),
        performanceMetrics: useRef({
            fps: 60,
            memoryUsage: 0,
            lastRender: 0
        }),
        networkStatus: useRef({
            type: 'unknown',
            isConnected: true
        })
    };

    // PanResponder Setup
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const {dx, dy} = gestureState;
                return Math.abs(dx) > 20 && Math.abs(dy) < 50;
            },
            onPanResponderGrant: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                animationRefs.scale.setValue(0.98);
            },
            onPanResponderMove: Animated.event(
                [null, {dx: animationRefs.slide}],
                {useNativeDriver: true}
            ),
            onPanResponderRelease: (_, gestureState) => {
                const {dx, dy} = gestureState;
                handleSwipeGesture(dx, vx);
            }
        })
    ).current;

    // Context & Navigation Listeners
    useEffect(() => {
        const unsubscribeNavigation = navigation.addListener('focus', handleScreenFocus);
        const unsubscribeAppState = AppState.addEventListener('change', handleAppStateChange);
        const unsubscribeNetwork = NetInfo.addEventListener(handleNetworkChange);

        return () => {
            unsubscribeNavigation();
            unsubscribeAppState.remove();
            unsubscribeNetwork();
        };
    }, [navigation]);

    // Part2 시작

    // Data Fetching and Management
    const fetchUserProfile = async () => {
        try{
            const cachedProfile = await getCachedData('userProfile');
            if(cachedProfile){
                setUserProfile(cachedProfile);
            }

            const response = await api.get('/user/profile', {
                headers: {'Authorization': `Bearer ${await getAuthToken()}`}
            });

            if(response.status === 200){
                const profileData = response.data;
            }
        }catch(error){

        }
    }
}

export default GroupMainScreen;