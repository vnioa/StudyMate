// screens/home/HomeScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
    StatusBar,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryChart, VictoryBar, VictoryTheme, VictoryAxis } from 'victory-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {API_URL} from '../../config/api';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [studyData, setStudyData] = useState({
        todayStudyTime: 0,
        studyStreak: 0,
        weeklyStudyData: [],
        achievementRate: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [recommendedContents, setRecommendedContents] = useState([]);
    const [motivationalQuote, setMotivationalQuote] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    // 애니메이션 값들
    const scrollY = useRef(new Animated.Value(0)).current;
    const notificationSlide = useRef(new Animated.Value(width)).current;
    const notificationBounce = useRef(new Animated.Value(0)).current;
    const motivationalFade = useRef(new Animated.Value(1)).current;

    // API 호출 함수들
    const getAuthToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            return token;
        } catch (error) {
            console.error('Token retrieval error:', error);
            return null;
        }
    };

    const fetchUserProfile = async () => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch user profile');

            const data = await response.json();
            setUserProfile(data);
        } catch (error) {
            console.error('Profile fetch error:', error);
            Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
        }
    };

    const fetchStudyData = async () => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_URL}/study/summary`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch study data');

            const data = await response.json();
            setStudyData(data);
        } catch (error) {
            console.error('Study data fetch error:', error);
            Alert.alert('오류', '학습 데이터를 불러오는데 실패했습니다.');
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_URL}/activities/recent`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch activities');

            const data = await response.json();
            setRecentActivities(data);
        } catch (error) {
            console.error('Activities fetch error:', error);
            Alert.alert('오류', '최근 활동을 불러오는데 실패했습니다.');
        }
    };

    const fetchRecommendedContents = async () => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_BASE_URL}/contents/recommended`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch recommended contents');

            const data = await response.json();
            setRecommendedContents(data);
        } catch (error) {
            console.error('Recommended contents fetch error:', error);
            Alert.alert('오류', '추천 콘텐츠를 불러오는데 실패했습니다.');
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = await getAuthToken();
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Notifications fetch error:', error);
            Alert.alert('오류', '알림을 불러오는데 실패했습니다.');
        }
    };

    const fetchMotivationalQuote = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quotes/random`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to fetch quote');

            const data = await response.json();
            setMotivationalQuote(data.quote);
        } catch (error) {
            console.error('Quote fetch error:', error);
            setMotivationalQuote('오늘도 열심히 공부해봐요!');
        }
    };

    // 데이터 로딩 함수
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchUserProfile(),
                fetchStudyData(),
                fetchRecentActivities(),
                fetchRecommendedContents(),
                fetchNotifications(),
                fetchMotivationalQuote()
            ]);
        } catch (error) {
            console.error('Data loading error:', error);
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 새로고침 핸들러
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadAllData().finally(() => setRefreshing(false));
    }, []);

    // 알림 패널 토글
    const toggleNotificationPanel = () => {
        Animated.spring(notificationSlide, {
            toValue: notifications.length > 0 ? 0 : width,
            useNativeDriver: true
        }).start();
    };

    // 초기 로딩
    useEffect(() => {
        loadAllData();
        const refreshInterval = setInterval(fetchMotivationalQuote, 300000); // 5분마다 명언 갱신
        return () => clearInterval(refreshInterval);
    }, []);

    if (isLoading) {
        return (
            <SkeletonPlaceholder>
                <View style={styles.skeletonContainer}>
                    <View style={styles.skeletonHeader} />
                    <View style={styles.skeletonCard} />
                    <View style={styles.skeletonList} />
                </View>
            </SkeletonPlaceholder>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#F8F9FA', '#E9ECEF']}
                style={styles.background}
            >
                {/* 헤더 */}
                <Animated.View style={[styles.header, { height: headerHeight }]}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('MyPage');
                        }}
                        style={styles.profileButton}
                    >
                        <Image
                            source={userProfile?.profileImage ? { uri: userProfile.profileImage } : require('../../assets/default-profile.png')}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logoImage}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={toggleNotificationPanel}
                            style={styles.iconButton}
                        >
                            <Animated.View style={{ transform: [{ translateX: notificationBounce }] }}>
                                <Ionicons
                                    name="notifications"
                                    size={24}
                                    color="#4A90E2"
                                />
                                {notifications.length > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {notifications.length}
                                        </Text>
                                    </View>
                                )}
                            </Animated.View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            style={styles.iconButton}
                        >
                            <Ionicons
                                name="settings-outline"
                                size={24}
                                color="#4A90E2"
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* 메인 콘텐츠 */}
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {/* 학습 요약 카드 */}
                    <View style={styles.summaryCard}>
                        <CircularProgress
                            value={studyData.achievementRate}
                            radius={40}
                            duration={2000}
                            progressValueColor={'#4A90E2'}
                            maxValue={100}
                            title={'달성률'}
                            titleColor={'#4A90E2'}
                            titleStyle={{ fontWeight: 'bold' }}
                        />
                        <View style={styles.studyInfo}>
                            <Text style={styles.studyTimeText}>
                                오늘 학습시간: {Math.floor(studyData.todayStudyTime / 60)}시간 {studyData.todayStudyTime % 60}분
                            </Text>
                            <Text style={styles.streakText}>
                                🔥 {studyData.studyStreak}일 연속 학습 중
                            </Text>
                        </View>
                    </View>

                    {/* 빠른 액세스 버튼 */}
                    <ScrollView
                        horizontal
                        style={styles.quickAccessContainer}
                        showsHorizontalScrollIndicator={false}
                    >
                        {[
                            { title: '개인학습', icon: 'book', screen: 'PersonalStudy' },
                            { title: '그룹학습', icon: 'people', screen: 'GroupStudy' },
                            { title: '채팅', icon: 'chatbubbles', screen: 'Chat' },
                            { title: '통계', icon: 'stats-chart', screen: 'Statistics' }
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickAccessButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate(item.screen);
                                }}
                            >
                                <Ionicons name={item.icon} size={24} color="white" />
                                <Text style={styles.quickAccessText}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* 최근 활동 */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>최근 활동</Text>
                        {recentActivities.map((activity, index) => (
                            <View key={index} style={styles.activityItem}>
                                <Text style={styles.activityContent}>{activity.content}</Text>
                                <Text style={styles.activityTime}>{activity.time}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 추천 학습 콘텐츠 */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>추천 학습</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        >
                            {recommendedContents.map((content, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.contentCard}
                                    onPress={() => navigation.navigate('ContentDetail', { contentId: content.id })}
                                >
                                    <Image
                                        source={{ uri: content.thumbnail }}
                                        style={styles.contentThumbnail}
                                    />
                                    <View style={styles.contentInfo}>
                                        <Text style={styles.contentTitle}>{content.title}</Text>
                                        <Text style={styles.contentDescription}>{content.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* 동기부여 문구 */}
                    <Animated.View
                        style={[
                            styles.motivationalContainer,
                            { opacity: motivationalFade }
                        ]}
                    >
                        <Text style={styles.motivationalText}>{motivationalQuote}</Text>
                        <TouchableOpacity
                            onPress={fetchMotivationalQuote}
                            style={styles.refreshQuoteButton}
                        >
                            <Ionicons name="refresh" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* 학습 통계 요약 */}
                    <View style={styles.statisticsContainer}>
                        <Text style={styles.sectionTitle}>주간 학습 통계</Text>
                        <VictoryChart
                            theme={VictoryTheme.material}
                            domainPadding={20}
                            height={200}
                        >
                            <VictoryAxis
                                tickFormat={studyData.weeklyStudyData.map(item => item.day)}
                            />
                            <VictoryAxis
                                dependentAxis
                                tickFormat={(x) => `${x}h`}
                            />
                            <VictoryBar
                                data={studyData.weeklyStudyData}
                                x="day"
                                y="hours"
                                style={{
                                    data: {
                                        fill: "#4A90E2",
                                        width: 20
                                    }
                                }}
                            />
                        </VictoryChart>
                    </View>
                </ScrollView>

                {/* 알림 패널 */}
                <Animated.View
                    style={[
                        styles.notificationPanel,
                        {
                            transform: [{ translateX: notificationSlide }]
                        }
                    ]}
                >
                    <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>알림</Text>
                        <TouchableOpacity onPress={toggleNotificationPanel}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {notifications.map((notification, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.notificationItem}
                                onPress={() => {
                                    // 알림 처리 로직
                                    navigation.navigate(notification.screen, notification.params);
                                    toggleNotificationPanel();
                                }}
                            >
                                <Text style={styles.notificationContent}>{notification.content}</Text>
                                <Text style={styles.notificationTime}>{notification.time}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    profileButton: {
        width: 40,
        height: 40,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    logoImage: {
        width: 120,
        height: 30,
        resizeMode: 'contain',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 8,
        marginLeft: 8,
    },
    notificationBadge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    studyInfo: {
        marginLeft: 16,
        flex: 1,
    },
    studyTimeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 8,
    },
    streakText: {
        fontSize: 14,
        color: '#34495E',
    },
    quickAccessContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    quickAccessButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        width: 100,
        alignItems: 'center',
    },
    quickAccessText: {
        color: 'white',
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    sectionContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
    },
    activityItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    activityContent: {
        fontSize: 14,
        color: '#2C3E50',
    },
    activityTime: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 4,
    },
    contentCard: {
        width: width * 0.7,
        backgroundColor: 'white',
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    contentThumbnail: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    contentInfo: {
        padding: 12,
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    contentDescription: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    motivationalContainer: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    motivationalText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    refreshQuoteButton: {
        marginTop: 8,
    },
    statisticsContainer: {
        padding: 16,
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    notificationPanel: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: width * 0.8,
        height: '100%',
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
    },
    notificationItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    notificationContent: {
        fontSize: 14,
        color: '#2C3E50',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    skeletonContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    skeletonHeader: {
        height: 60,
        marginBottom: 16,
    },
    skeletonCard: {
        height: 100,
        margin: 16,
        borderRadius: 12,
    },
    skeletonList: {
        height: 200,
        margin: 16,
    },
});

export default HomeScreen;