import {useState, useEffect, useRef, useCallback} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    RefreshControl,
    Image,
    Platform,
    Alert, AppState
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {LineChart} from "react-native-chart-kit";
import {Ionicons} from '@expo/vector-icons'
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const API_URL = 'http://121.127.165.43';

const PersonalStudyMainScreen = ({navigation}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [studySession, setStudySession] = useState(null);
    const [studyData, setStudyData] = useState({
        dailyTime: 0,
        weeklyStats: Array(7).fill(0),
        monthlyStats: Array(30).fill(0),
        streak: 0,
        quizResults: [],
        badges: [],
        todayQuote: {text: '', author: ''},
        currentLevel: 1,
        totalExperience: 0,
        upcomingSchedules: [],
        lastSyncTime: null,
        goals: []
    });

    // Refs
    const appStateRef = useRef(AppState.currentState);
    const studyTimerRef = useRef(null);
    const animationRef = useRef(new Animated.Value(0)).current;

    // 초기 데이터 로드 및 이벤트 리스너 설정
    useEffect(() => {
        const initializeApp = async () => {
            await checkAuthStatus();
            await loadInitialData();
            setupEventListeners();
        };

        initializeApp();
        return () => cleanupEventListeners();
    }, []);

    // 인증 상태 확인
    const checkAuthStatus = async () => {
        try{
            const token = await AsyncStorage.getItem('userToken');
            if(!token){
                navigation.replace('Auth');
                return false;
            }
            return true;
        }catch(error) {
            console.error('Auth check failed: ', error);
            return false;
        }
    };

    // 이벤트 리스너 설정
    const setupEventListeners = () => {
        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
            if(state.isConnected){
                syncDataWithServer();
            }
        });

        const appStateSubScription = AppState.addEventListener('change', nextAppState => {
            if(appStateRef.current === 'background' && nextAppState === 'active'){
                loadInitialData();
            }
            appStateRef.current = nextAppState;
        });

        return () => {
            unsubscribeNetInfo();
            appStateSubScription.remove();
        };
    };

    // 데이터 로드 및 동기화
    const loadInitialData = async() => {
        try{
            setIsLoading(true);
            const localData = await AsyncStorage.getItem('studyData');

            if(localData){
                setStudyData(JSON.parse(localData));
            }
            if(isOnline){
                await syncDataWithServer();
            }

            await loadDailyQuote();
            await checkAndUpdateStreak();
            startEntryAnimation();
        }catch(error){
            handleError(error, '데이터 로드 실패');
        }finally{
            setIsLoading(false);
        }
    };

    // 서버 데이터 동기화
    const syncDataWithServer = async() => {
        try{
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/study/data`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const serverData = response.data;
            const mergedData = mergeStudyData(studyData, serverData);

            await AsyncStorage.setItem('studyData', JSON.stringify(mergedData));
            setStudyData(mergedData);

            // 오프라인 데이터 큐 처리
            await processOfflineDataQueue();
        }catch(error){
            console.error('Server sync failed: ', error);
            // 오프라인 모드로 전환
            setIsOnline(false);
        }
    };

    // 로컬 데이터와 서버 데이터 병합
    const mergeStudyData = async (localData, serverData) => {
        return {
            ...localData,
            ...serverData,
            lastSyncTime: new Date().toISOString(),
            weeklyStats: serverData.weeklyStats || localData.weeklyStats,
            monthlyStats: serverData.monthlyStats || localData.monthlyStats,
            quizResults: [...(serverData.quizResults || []),
                ...(localData.quizResults || [])].filter((v, i, a) =>
                a.findIndex(t => t.id === v.id) === i).sort((a, b) => new Date(b.date) - new Date(a.date)),
            goals: mergeGoals(localData.goals, serverData.goals),
            upcomingSchedules: mergeSchedules(localData.upcomingSchedules, serverData.upcomingSchedules)
        };
    };

    // 목표 데이터 병합
    const mergeGoals = async (localData, serverData) => {
        const allGoals = [...(localGoals || []), ...(serverData.goals || [])];
        return allGoals
            .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    };

    // 일정 데이터 병합
    const mergeSchedules = (localSchedules, serverSchedules) => {
        const allSchedules = [...(localSchedules || []), ...(serverSchedules || [])];
        return allSchedules
            .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    };

    // 오프라인 데이터 큐 처리
    const processOfflineDataQueue = async () => {
        try{
            const offlineQueue = await AsyncStorage.getItem('offlineQueue');
            if(!offlineQueue) return;

            const queue = JSON.parse(offlineQueue);
            for(const item of queue) {
                await processOfflineItem(item);
            }

            await AsyncStorage.removeItem('offlineDataQueue');
        }catch(error){
            console.error('Failed to process offline queue: ', error);
        }
    };

    // 오프라인 항목 처리
    const processOfflineItem = async (item) => {
        try{
            const token = await AsyncStorage.getItem('userToken');
            await axios({
                method: item.method,
                url: `${API_URL}${item.endpoint}`,
                data: item.data,
                headers: {Authorization: `Bearer ${token}`},
            });
        }catch(error){
            console.error('Failed to process offline item: ', error);
        }
    };

    // 연속 학습일 체크 및 업데이트
    const checkAndUpdateStreak = async () => {
        try{
            const lastStudyDate = await AsyncStorage.getItem('lastStudyDate');
            const today = new Date().toISOString().split('T')[0];

            if(lastStudyDate) {
                const lastDate = new Date(lastStudyDate);
                const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));

                if(diffDays > 1) {
                    // 연속 학습 중단
                    setStudyData(prev => ({...prev, streak: 0}));
                }else if(diffDays === 1){
                    // 연속 학습 유지 및 증가
                    setStudyData(prev => ({...prev, streak: prev.streak + 1}));
                }
            }
        }catch(error){
            console.error('Streak update failed: ', error);
        }
    };

    // 일일 명언 로드
    const loadDailyQuote = async() => {
        try{
            const lastQuoteDate = await AsyncStorage.getItem('lastQuoteDate');
            const today = new Date().toISOString().split('T')[0];

            if(lastQuoteDate !== today){
                const response = await axios.get(`${API_URL}/quotes/daily`);
                const newQuote = response.data;

                setStudyData(prev => ({
                    ...prev,
                    todayQuote: newQuote
                }));

                await AsyncStorage.setItem('lastQuoteDate', today);
            }
        }catch(error){
            console.error('Quote loading failed: ', error);
        }
    };
}