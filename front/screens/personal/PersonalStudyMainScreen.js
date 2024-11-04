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

    // 학습 세션 관리
    const startStudySession = async () => {
        if(studySession){
            Alert.alert('진행 중인 세션', '이미 학습 세션이 진행 중입니다.');
            return;
        }
        const newSession = {
            id: Date.now().toString(),
            startTime: new Date(),
            duration: 0,
            focusIntervals: [],
            breaks: 0,
            subject: studyData.currentSubject || '일반 학습',
            focusRate: 100,
        };

        setStudySession(newSession)
        startStudyTimer();
        startFocusTracking();
    };

    // 학습 타이머 관리
    const startStudyTimer = () => {
        if(studyTimeRef.current){
            clearInterval(studyTimerRef.current);
        }

        studyTimerRef.current = setInterval(() => {
            setStudySession(prev => {
                if(!prev){
                    return null;
                }
                return {
                    ...prev,
                    duration: prev.duration + 1
                };
            });
        }, 60000); // 1분 간격
    };

    // 집중도 추적
    const startFocusTracking = () => {
        // 화면 활성 상태 모니터링
        AppState.addEventListener('change', handleAppStateChange);
        // 디바이스 움직임 감지(옵션)
        if(Platform.OS === 'ios'){
            setupMotionTracking();
        }
    };

    // 학습 세션 종료
    const endStudySession = async () => {
        if(!studySession){
            return;
        }
        try{
            clearInterval(studyTimerRef.current);
            AppState.removeEventListener('change', handleAppStateChange);

            const finalSession = {
                ...studySession,
                endTime: new Date(),
                finalFocusRate: calculateFocusRate(studySession.focusIntervals),
            };

            // 로컬 데이터 업데이트
            const updatedStudyData = await updateLocalStudyData(finalSession);
            setStudyData(updatedStudyData);

            // 서버 동기화
            if(isOnline){
                await syncSessionToServer(finalSession);
            }else{
                await addToOfflineQueue({
                    method: 'POST',
                    endpoint: '/study/sessions',
                    data: finalSession
                });
            }

            // 학습 목표 진행상황 업데이트
            await updateGoalsProgress(finalSession.duration);

            // 보상 및 성취 체크
            await checkAchievements(finalSession);

            setStudySession(null);
            Alert.alert('학습 완료', `${finalSession.duration}분 동안 학습하셨습니다!`);
        }catch(error){
            handleError(error, '세션 종료 실패');
        }
    };

    // 로컬 학습 데이터 업데이트
    const updateLocalStudyData = async (session) => {
        const updatedData = {
            ...studyData,
            dailyTime: studyData.dailyTime + session.duration,
            weeklyStats: updateWeeklyStats(studyData.weeklyStats, session.duration),
            monthlyStats: updateMonthlyStats(studyData.monthlyStats, session.duration),
            totalExperience: studyData.totalExperience + calculateExperience(session)
        };

        await AsyncStorage.setItem('studyData', JSON.stringify(updatedData));
        return updatedData;
    };

    // 주간 통계 업데이트
    const updateWeeklyStats = (stats, duration) => {
        const today = new Date().getDay();
        return stats.map((time, index) => index === today ? time + duration : time)
    };

    // 월간 통계 업데이트
    const updateMonthlyStats = (stats, duration) => {
        const today = new Date().getDate() - 1;
        return stats.map((time, index) => index === today ? time + duration : time);
    };

    // 경험치 계산
    const calculateExperience = (session) => {
        const baseXP = session.duration;
        const focusBonus = Math.floor(session.finalFocusRate / 10);
        const streakBonus = Math.floor(studyData.streak / 7) * 5;

        return baseXP + focusBonus + streakBonus;
    };

    // 집중도 계산
    const calculateFocusRate = (intervals) => {
        if(!intervals.length){
            return 100;
        }
        const totalTime = studySession.duration;
        const focusedTime = intervals.reduce((acc, interval) => acc + (interval.end - interval.start), 0);

        return Math.round((focusedTime / totalTime) * 100);
    };

    // 목표 진행 상황 업데이트
    const updateGoalsProgress = async(duration) => {
        const updatedGoals = studyData.goals.map(goal => {
            if(goal.type === 'time' && !goal.completed){
                const newProgress = goal.progress + duration;
                return {
                    ...goal,
                    progress: newProgress,
                    completed: newProgress >= goal.target
                };
            }
            return goal;
        });

        const newStudyData = {
            ...studyData,
            goals: updatedGoals
        };

        await AsyncStorage.setItem('studyData', JSON.stringify(newStudyData));
        setStudyData(newStudyData);

        // 완료된 목표 체크 및 알림
        updatedGoals.filter(goal => goal.completed && !goal.notified).forEach(goal => {
            Alert.alert('목표 달성!', `축하합니다! "${goal.title}" 목표를 달성했습니다!`);
        });
    };

    // 성취 체크
    const checkAchievements = async(session) => {
        const achievements = [];

        // 일일 학습 시간 성취
        if(studyData.dailyTime + session.duration >= 120){
            achievements.push('DAILY_2HOURS');
        }

        // 연속 학습 성취
        if(studyData.streak >= 7){
            achievements.push('WEEKLY_STREAK');
        }

        // 집중도 성취
        if(session.finalFocusRate >= 90){
            achievements.push('HIGH_FOCUS');
        }

        if(achievements.length > 0){
            await updateAchievement(achievements);
        }
    };

    // 성과 분석 및 레벨 시스템
    const analyzePerformance = async () => {
        try{
            // 학습 패턴 분석
            const patterns = analyzeStudyPatterns();
            // 효율성 분석
            const efficiency = calculateStudyEfficiency();
            // 추천 사항 생성
            const recommendations = generateRecommendations(patterns, efficiency);

            return {
                patterns,
                efficiency,
                recommendations,
                level: calculateLevel(),
                nextLevelProgress: calculateNextLevelProgress()
            };
        }catch(error){
            handleError(error, '성과 분석 실패');
            return null;
        }
    };

    // 학습 패턴 분석
    const analyzeStudyPatterns = () => {
        const weeklyData = studyData.weeklyStats;
        const monthlyData = studyData.monthlyStats;

        return {
            // 최적 학습 시간대 분석
            bestStudyTime: findBestStudyTime(),
            // 주간 학습 패턴
            weeklyPattern: {
                mostProductiveDay: weeklyData.indexOf(Math.max(...weeklyData)),
                averageDaily: weeklyData.reduce((a, b) => a + b, 0) / 7,
                consistency: calculateMonthlyTrend(monthlyData)
            }
        };

        // 학습 효율성 계산
        const calculateStudyEfficiency = () => {
            const recentSessions = studyData.recentSessions || [];

            return {
                // 평균 집중도
                averageFocusRate: calculateAverageFocusRate(recentSessions),
                // 목표 달성률
                goalCompletionRate: calculateGoalCompletionRate(),
                // 퀴즈 성과
                quizPerfomance: analyzeQuizPerformance(),
                // 학습 지속성
                continuity: calculateContinuity()
            };
        };

        // 추천 사항 생성
        const generateRecommendations = (patterns, efficiency) => {
            const recommendations = [];

            // 학습 시간 추천
            if(patterns.weeklyPattern.consistency < 0.7){
                recommendations.push({
                    type: 'schedule',
                    message: '더 일관된 학습 일정을 유지하시면 좋을 것 같습니다.',
                    action: '매일 같은 시간에 학습하기'
                });
            }

            // 집중도 개선 추천
            if(efficiency.averageFocusRate < 80){
                recommendations.push({
                    type: 'focus',
                    message: '집중도를 높일 수 있는 방법을 시도해 보세요.',
                    action: '포모도로 기법 활용하기'
                });
            }

            // 목표 설정 추천
            if(efficiency.goalCompletionRate > 0.5){
                recommendations.push({
                    type: 'goals',
                    message: '현실적인 목표 설정이 필요해 보입니다.',
                    action: '주간 목표 조정하기'
                });
            }
            return recommendations;
        };

        // 보상 시스템
        const processRewards = async () => {
            try{
                // 일일 보상 체크
                const dailyRewards = checkDailyRewards();
                // 성취 보상 체크
                const achievementRewards = checkAchievementsRewards();
                // 특별 보상 체크
                const specialRewards = checkSpecialRewards();

                const allRewards = [...dailyRewards, ...achievementRewards, ...specialRewards];

                if(allRewards.length > 0){
                    await updateUserRewards(allRewards);
                    notifyRewards(allRewards);
                }
            }catch(error){
                handleError(error, '보상 처리 실패');
            }
        };

        // 레벨 계산
        const calculateLevel = () => {
            const experience = studyData.totalExperience;
            return Math.floor(Math.sqrt(experience / 100)) + 1;
        };

        // 다음 레벨까지 진행도 계산
        const calculateNextLevelProgress = () => {
            const currentLevel = calculateLevel();
            const currentExp = studyData.totalExperience;
            const nextLevelExp = Math.pow(currentLevel + 1, 2) * 100;
            const prevLevelExp = Math.pow(currentLevel, 2) * 100;

            return ((currentExp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100;
        };

        // 성취 업데이트
        const updateAchievements = async(newAchievements) => {
            try{
                const updataedData = {
                    ...studyData,
                    achievements: [...studyData.achievements, ...newAchievements.map(a => ({
                        id: a,
                        achievedAt: new Date().toISOString(),
                        notified: false
                    }))]
                };

                await AsyncStorage.setItem('studyData', JSON.stringify(updataedData));
                setStudyData(updataedData);

                // 성취 알림
                newAchievements.forEach(achievement => {
                    const achievementData = ACHIEVEMENT_DEFINITIONS[achievement];
                    if(achievementData) {
                        Alert.alert(
                            '새로운 성취',
                            `"${achievementData.title}" 성취를 획득했습니다!\n${achievementData.description}`
                        );
                    }
                });
            }catch(error){
                handleError(error, '성취 업데이트 실패');
            }
        };

        // 학습 통계 데이터 내보내기
        const exportStudyData = async () => {
            try {
                const exportData = {
                    userData: studyData,
                    analytics: await analyzePerformance(),
                    timestamp: new Date().toISOString()
                };

                const fileName = `study_data_${Date.now()}.json`;
                await saveFile(fileName, JSON.stringify(exportData, null, 2));

                return fileName;
            } catch (error) {
                handleError(error, '데이터 내보내기 실패');
                return null;
            }
        };
    }
}

export default PersonalStudyMainScreen;