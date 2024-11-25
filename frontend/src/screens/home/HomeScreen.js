import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { CircularProgress } from 'react-native-circular-progress';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { studyAPI } from '../../services/api';

const MainScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        todayStudyTime: 0,
        streak: 0,
        progress: 0,
        weeklyData: [],
        recommendations: []
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getDashboardData();
            setUserData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartStudy = async () => {
        try {
            const response = await studyAPI.startStudySession();
            if (response.data.success) {
                navigation.navigate('StudySession', { sessionId: response.data.sessionId });
            }
        } catch (error) {
            Alert.alert('오류', '학습 세션을 시작할 수 없습니다.');
        }
    };

    const GridButton = ({ title, icon, onPress }) => (
        <TouchableOpacity
            style={styles.gridButton}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Icon name={icon} size={24} color="#333" />
            <Text style={styles.gridButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    const TechIcon = ({ item }) => (
        <TouchableOpacity
            style={styles.techItem}
            onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
        >
            <View style={styles.techIconBox}>
                <Icon name={item.icon} size={30} color="#333" />
            </View>
            <Text style={styles.techText}>{item.title}</Text>
            <Text style={styles.techDescription}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchUserData}
                />
            }
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.profileIcon}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon name="user" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Studymate</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <Icon name="bell" size={24} color="#333" style={styles.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Icon name="settings" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.welcomeText}>{userData.name}님, 환영합니다!</Text>
                <Text style={styles.studyTimeText}>
                    오늘 {Math.floor(userData.todayStudyTime / 60)}시간 {userData.todayStudyTime % 60}분 학습했어요
                </Text>
                <View style={styles.circularProgressContainer}>
                    <CircularProgress
                        size={200}
                        width={15}
                        fill={userData.progress}
                        tintColor="#4A90E2"
                        backgroundColor="#eee"
                    >
                        {() => (
                            <Text style={styles.progressText}>{userData.progress}%</Text>
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
                        <TechIcon key={index} item={item} />
                    ))}
                </View>
            </View>

            <View style={styles.graphContainer}>
                <Text style={styles.graphTitle}>최근 7일 공부량</Text>
                <LineChart
                    data={{
                        labels: userData.weeklyData.map(d => d.date),
                        datasets: [{
                            data: userData.weeklyData.map(d => d.studyTime)
                        }]
                    }}
                    width={350}
                    height={200}
                    chartConfig={{
                        backgroundColor: '#fff',
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                        style: {
                            borderRadius: 16
                        }
                    }}
                    style={styles.graph}
                />
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
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    icon: {
        marginRight: 15,
    },
    progressSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 16,
        marginBottom: 5,
    },
    studyTimeText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    circularProgressContainer: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    streakButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    streakButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    gridButton: {
        width: '30%',
        height: 100,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridButtonText: {
        marginTop: 10,
        fontSize: 12,
        textAlign: 'center',
    },
    techStack: {
        marginBottom: 30,
    },
    techTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    techContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    techItem: {
        width: '48%',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 15,
    },
    techIconBox: {
        width: 50,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    techText: {
        fontSize: 12,
    },
    graphContainer: {
        marginBottom: 20,
    },
    graphTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    graph: {
        borderRadius: 16,
    },
    bottomMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default MainScreen;