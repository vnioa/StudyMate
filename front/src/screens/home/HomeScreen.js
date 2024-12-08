import React, { useState, useCallback, memo, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ScrollView,
    ActivityIndicator,
    Platform,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { CircularProgress } from 'react-native-circular-progress';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../styles/theme';
import axios from "axios";

const BASE_URL = 'http://121.127.165.43:3000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const { width } = Dimensions.get('window');

// Grid Button Component
const GridButton = memo(({ title, icon, onPress }) => (
    <TouchableOpacity
        style={styles.gridButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Icon name={icon} size={24} color={theme.colors.text} />
        <Text style={styles.gridButtonText}>{title}</Text>
    </TouchableOpacity>
));

// Tech Icon Component
const TechIcon = memo(({ item, onPress }) => (
    <TouchableOpacity
        style={styles.techItem}
        onPress={onPress}
    >
        <View style={styles.techIconBox}>
            <Icon name={item.icon} size={30} color={theme.colors.text} />
        </View>
        <Text style={styles.techText}>{item.title}</Text>
        <Text style={styles.techDescription}>{item.description}</Text>
    </TouchableOpacity>
));

const HomeScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [weeklyData, setWeeklyData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);
    const [userData, setUserData] = useState({
        name: '',
        todayStudyTime: 0,
        streak: 0,
        progress: 0,
        weeklyData: [],
        recommendations: []
    });

    useEffect(() => {
        if(weeklyData.length > 0){
            setChartData({
                labels: weeklyData.map(d => d.data || ''),
                datasets: [{
                    data: weeklyData.map(d => {
                        const value = Number(d.studyTime);
                        return (isFinite(value) && value >= 0) ? Math.min(value, 1440) : 0;
                    })
                }]
            })
        }
    }, [weeklyData]);

    const validateNumber = (value) => !isNaN(value) && isFinite(value) && typeof value === 'number';

    // 대시보드 데이터 조회
    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/study/dashboard');

            if (response.data.success) {
                const data = response.data.weeklyData || [];
                setUserData(response.data);
                setWeeklyData(
                    data.map((d) => ({
                        date: d.date || '',
                        studyTime: validateNumber(parseFloat(d.study_time))
                            ? Math.min(Math.round(parseFloat(d.study_time)), 1440)
                            : 0
                    }))
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);


    // 학습 세션 시작
    const handleStartStudy = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/study/sessions/start');

            if (response.data.success) {
                navigation.navigate('StudySession', {
                    sessionId: response.data.sessionId
                });
            }
        } catch (error) {
            Alert.alert('오류', '학습 세션을 시작할 수 없습니다');
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    }, [fetchUserData]);

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
            return () => {
                setUserData({
                    name: '',
                    todayStudyTime: 0,
                    streak: 0,
                    progress: 0,
                    weeklyData: [],
                    recommendations: []
                });
            };
        }, [fetchUserData])
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.profileIcon}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon name="user" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Studymate</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={styles.iconButton}
                    >
                        <Icon name="bell" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.iconButton}
                    >
                        <Icon name="settings" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.welcomeText}>
                    {userData.name}님, 환영합니다!
                </Text>
                <Text style={styles.studyTimeText}>
                    오늘 {Math.floor(userData.todayStudyTime / 60)}시간{' '}
                    {userData.todayStudyTime % 60}분 학습했어요
                </Text>
                <View style={styles.circularProgressContainer}>
                    <CircularProgress
                        size={200}
                        width={15}
                        fill={userData.progress}
                        tintColor={theme.colors.primary}
                        backgroundColor={theme.colors.surface}
                    >
                        {() => (
                            <Text style={styles.progressText}>
                                {userData.progress}%
                            </Text>
                        )}
                    </CircularProgress>
                </View>
                <TouchableOpacity style={styles.streakButton}>
                    <Text style={styles.streakButtonText}>
                        {userData.streak}일째 연속 공부중!
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.buttonGrid}>
                <GridButton
                    title="개인 학습 시작"
                    icon="play"
                    onPress={handleStartStudy}
                />
                <GridButton
                    title="그룹 학습 참여"
                    icon="users"
                    onPress={() => navigation.navigate('GroupList')}
                />
                <GridButton
                    title="학습 통계"
                    icon="bar-chart-2"
                    onPress={() => navigation.navigate('Statistics')}
                />
            </View>

            <View style={styles.techStack}>
                <Text style={styles.techTitle}>추천드리는 콘텐츠</Text>
                <View style={styles.techContainer}>
                    {userData.recommendations.map((item, index) => (
                        <TechIcon
                            key={index}
                            item={item}
                            onPress={() => navigation.navigate('ContentDetail', {
                                contentId: item.id
                            })}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.graphContainer}>
                <Text style={styles.graphTitle}>최근 7일 공부량</Text>
                {!chartLoading && (
                    <LineChart
                        data={chartData}
                        width={width - 32}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        bezier
                        withInnerLines={false}
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                )}
            </View>

            <Text style={styles.bottomMessage}>
                큰 목표를 이루고 싶으면 하려할 것이지 마라. - 미상
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    iconButton: {
        padding: theme.spacing.sm,
    },
    progressSection: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    welcomeText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    studyTimeText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    circularProgressContainer: {
        marginBottom: theme.spacing.lg,
    },
    progressText: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        fontWeight: '600',
    },
    streakButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.large,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    streakButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    gridButton: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    gridButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    techStack: {
        padding: theme.spacing.md,
    },
    techTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    techContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    techItem: {
        flex: 1,
        minWidth: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    techIconBox: {
        width: 50,
        height: 50,
        backgroundColor: theme.colors.background,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    techText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    techDescription: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    graphContainer: {
        padding: theme.spacing.md,
    },
    graphTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    graph: {
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    bottomMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        fontStyle: 'italic',
        padding: theme.spacing.xl,
    }
});

HomeScreen.displayName = 'HomeScreen';

export default memo(HomeScreen);