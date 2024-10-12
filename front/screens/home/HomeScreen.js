import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    Animated,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'http://121.127.165.43:3000'; // 실제 API 주소로 변경해야 합니다.

const HomeScreen = () => {
    const [userData, setUserData] = useState(null);
    const [studyData, setStudyData] = useState(null);
    const [quizData, setQuizData] = useState([]);
    const [badges, setBadges] = useState([]);
    const [quote, setQuote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const navigation = useNavigation();
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        fetchData();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const [userResponse, studyResponse, quizResponse, badgesResponse, quoteResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/user`, config),
                axios.get(`${API_BASE_URL}/study-data`, config),
                axios.get(`${API_BASE_URL}/quiz-data`, config),
                axios.get(`${API_BASE_URL}/badges`, config),
                axios.get(`${API_BASE_URL}/daily-quote`, config)
            ]);

            setUserData(userResponse.data);
            setStudyData(studyResponse.data);
            setQuizData(quizResponse.data);
            setBadges(badgesResponse.data);
            setQuote(quoteResponse.data.quote);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('데이터를 불러오는 데 실패했습니다. 다시 시도해 주세요.');
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    const renderQuickAccessButtons = () => (
        <View style={styles.quickAccessContainer}>
            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('PersonalStudy')}>
                <Icon name="book" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>개인 학습</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('GroupStudy')}>
                <Icon name="group" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>그룹 학습</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Quiz')}>
                <Icon name="quiz" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>퀴즈</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessButton} onPress={() => navigation.navigate('Resources')}>
                <Icon name="library-books" size={24} color="#fff" />
                <Text style={styles.quickAccessText}>학습 자료</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>안녕하세요, {userData.name}님!</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <View style={styles.notificationIcon}>
                            <Icon name="notifications" size={24} color="#fff" />
                            {userData.notifications > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationText}>{userData.notifications}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>오늘의 학습 요약</Text>
                    <View style={styles.studySummary}>
                        <View style={styles.circularProgress}>
                            <Text style={styles.progressText}>{studyData.todayStudyTime} 분</Text>
                        </View>
                        <Text style={styles.summaryText}>오늘 {Math.floor(studyData.todayStudyTime / 60)}시간 {studyData.todayStudyTime % 60}분 공부했어요</Text>
                    </View>
                </View>

                {renderQuickAccessButtons()}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>주간 학습 통계</Text>
                    <LineChart
                        data={{
                            labels: ['월', '화', '수', '목', '금', '토', '일'],
                            datasets: [{ data: studyData.weeklyStudyData }]
                        }}
                        width={width - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                            style: { borderRadius: 16 }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>학습 스트릭</Text>
                    <View style={styles.streakContainer}>
                        <Icon name="local-fire-department" size={48} color="#FFA000" />
                        <Text style={styles.streakText}>{studyData.streak} 일</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>최근 퀴즈</Text>
                    {quizData.map((quiz) => (
                        <View key={quiz.id} style={styles.quizItem}>
                            <Text style={styles.quizTitle}>{quiz.title}</Text>
                            <View style={styles.quizScore}>
                                <Text style={styles.quizScoreText}>{quiz.score}%</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>성취</Text>
                    <View style={styles.badgeContainer}>
                        {badges.map((badge) => (
                            <View key={badge.id} style={styles.badge}>
                                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>오늘의 동기부여</Text>
                    <Text style={styles.quoteText}>{quote}</Text>
                </View>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    notificationIcon: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: 'red',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    studySummary: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circularProgress: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryText: {
        flex: 1,
        fontSize: 14,
    },
    quickAccessContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    quickAccessButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        width: '23%',
    },
    quickAccessText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    quizItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizTitle: {
        fontSize: 16,
    },
    quizScore: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    quizScoreText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    badgeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    badge: {
        alignItems: 'center',
    },
    badgeIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
    badgeName: {
        fontSize: 12,
        textAlign: 'center',
    },
    quoteText: {
        fontStyle: 'italic',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;