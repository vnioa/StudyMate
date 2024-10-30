import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Platform,
    StatusBar,
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setUserData, setRecentActivities, setRecommendedContent, setWeeklyStats, setMotivationalQuote } from './redux/actions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://121.127.165.43:3000';
const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userData = useSelector(state => state.user);
    const recentActivities = useSelector(state => state.recentActivities);
    const recommendedContent = useSelector(state => state.recommendedContent);
    const weeklyStats = useSelector(state => state.weeklyStats);
    const motivationalQuote = useSelector(state => state.motivationalQuote);

    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const progressAnimation = new Animated.Value(0);

    useEffect(() => {
        fetchAllData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle('light-content');
            Platform.OS === 'android' && StatusBar.setBackgroundColor('#4A90E2');
            return () => {
                StatusBar.setBarStyle('default');
                Platform.OS === 'android' && StatusBar.setBackgroundColor('transparent');
            };
        }, [])
    );

    const fetchAllData = async () => {
        setRefreshing(true);
        setErrorMessage('');
        try {
            await Promise.all([
                fetchUserData(),
                fetchRecentActivities(),
                fetchRecommendedContent(),
                fetchWeeklyStats(),
                fetchMotivationalQuote()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            setErrorMessage('데이터를 불러오는 데 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/user/data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setUserData(response.data));
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    };

    const fetchRecentActivities = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/activities/recent`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setRecentActivities(response.data));
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            throw error;
        }
    };

    const fetchRecommendedContent = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/content/recommended`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setRecommendedContent(response.data));
        } catch (error) {
            console.error('Error fetching recommended content:', error);
            throw error;
        }
    };

    const fetchWeeklyStats = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/stats/weekly`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setWeeklyStats(response.data));
        } catch (error) {
            console.error('Error fetching weekly stats:', error);
            throw error;
        }
    };

    const fetchMotivationalQuote = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/quote/motivational`);
            dispatch(setMotivationalQuote(response.data.quote));
        } catch (error) {
            console.error('Error fetching motivational quote:', error);
            throw error;
        }
    };

    useEffect(() => {
        Animated.timing(progressAnimation, {
            toValue: userData.learningProgress,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [userData.learningProgress]);

    const onRefresh = useCallback(() => {
        fetchAllData();
    }, []);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Image
                    source={{ uri: userData.profileImage }}
                    style={styles.profileImage}
                />
            </TouchableOpacity>
            <Image
                source={require('./assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={styles.headerIcons}>
                <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color="#FFF" style={{ marginLeft: 15 }} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderLearningProgress = () => (
        <View style={styles.learningProgressCard}>
            <Progress.Circle
                size={100}
                progress={userData.learningProgress}
                thickness={10}
                color="#4CAF50"
                unfilledColor="#E0E0E0"
                borderWidth={0}
                animated
                showsText
                formatText={() => `${Math.round(userData.learningProgress * 100)}%`}
            />
            <Text style={styles.learningTimeText}>{`오늘 ${userData.learningTime}분 학습했어요`}</Text>
            <View style={styles.streakContainer}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <Text style={styles.streakText}>{`${userData.streakDays}일 연속 학습 중`}</Text>
            </View>
        </View>
    );

    const renderQuickAccessButtons = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAccessContainer}>
            {['개인 학습 시작', '그룹 학습 참여', '퀴즈 풀기', '학습 자료 찾기'].map((title, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.quickAccessButton}
                    onPress={() => navigation.navigate(title.replace(' ', ''))}
                >
                    <Ionicons name={getIconName(title)} size={32} color="#4A90E2" />
                    <Text style={styles.quickAccessText}>{title}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const getIconName = (title) => {
        switch (title) {
            case '개인 학습 시작': return 'book-outline';
            case '그룹 학습 참여': return 'people-outline';
            case '퀴즈 풀기': return 'help-circle-outline';
            case '학습 자료 찾기': return 'search-outline';
            default: return 'star-outline';
        }
    };

    const renderRecentActivities = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>최근 활동</Text>
            {recentActivities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                    <Ionicons name={getActivityIcon(activity.type)} size={24} color="#4A90E2" />
                    <View style={styles.activityContent}>
                        <Text style={styles.activityText}>{activity.content}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const getActivityIcon = (type) => {
        switch (type) {
            case 'quiz': return 'checkbox-outline';
            case 'lesson': return 'book-outline';
            case 'practice': return 'create-outline';
            default: return 'ellipsis-horizontal-outline';
        }
    };

    const renderRecommendedContent = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>추천 학습</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommendedContent.map((content, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.recommendedCard}
                        onPress={() => navigation.navigate('ContentDetail', { contentId: content.id })}
                    >
                        <Image source={{ uri: content.image }} style={styles.recommendedImage} />
                        <Text style={styles.recommendedTitle}>{content.title}</Text>
                        <Text style={styles.recommendedDescription}>{content.description}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderWeeklyStats = () => (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>주간 학습 통계</Text>
            <View style={styles.weeklyStatsChart}>
                {weeklyStats.map((stat, index) => (
                    <View key={index} style={styles.statBar}>
                        <View style={[styles.statFill, { height: `${(stat.hours / 24) * 100}%` }]} />
                        <Text style={styles.statDay}>{stat.day}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderMotivationalQuote = () => (
        <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>{motivationalQuote}</Text>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {renderHeader()}
            {renderLearningProgress()}
            {renderQuickAccessButtons()}
            {renderRecentActivities()}
            {renderRecommendedContent()}
            {renderWeeklyStats()}
            {renderMotivationalQuote()}
            {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        </ScrollView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 10,
        backgroundColor: '#4A90E2',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    logo: {
        width: 120,
        height: 30,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    learningProgressCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        margin: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    learningTimeText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        color: '#333',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
        color: '#FF6B6B',
    },
    quickAccessContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    quickAccessButton: {
        alignItems: 'center',
        marginRight: 20,
    },
    quickAccessText: {
        marginTop: 5,
        fontSize: 12,
        color: '#333',
    },
    sectionContainer: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    activityContent: {
        marginLeft: 10,
    },
    activityText: {
        fontSize: 14,
        color: '#333',
    },
    activityTime: {
        fontSize: 12,
        color: '#757575',
    },
    recommendedCard: {
        width: 200,
        marginRight: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedImage: {
        width: '100%',
        height: 120,
    },
    recommendedTitle: {
        fontSize: 16,
        fontWeight: '600',
        margin: 10,
        color: '#333',
    },
    recommendedDescription: {
        fontSize: 12,
        color: '#757575',
        marginHorizontal: 10,
        marginBottom: 10,
    },
    weeklyStatsChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 200,
        marginTop: 10,
    },
    statBar: {
        width: 30,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        alignItems: 'center',
    },
    statFill: {
        width: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    statDay: {
        marginTop: 5,
        fontSize: 12,
        color: '#757575',
    },
    quoteContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        margin: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quoteText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#333',
        textAlign: 'center',
    },
    errorMessage: {
        color: '#FF3B30',
        textAlign: 'center',
        marginTop: 10,
    },
});