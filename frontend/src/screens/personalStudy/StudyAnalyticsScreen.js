import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { studyAPI } from '../../services/api';

const { width } = Dimensions.get('window');

const StudyAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('week');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [analyticsData, setAnalyticsData] = useState({
        subjects: {},
        weeklyHours: {
            labels: [],
            datasets: [{ data: [] }]
        },
        goals: {
            total: 0,
            achieved: 0
        },
        monthlyProgress: {
            labels: [],
            datasets: [{ data: [] }]
        }
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getAnalytics(timeRange);
            setAnalyticsData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const achievementRate = (analyticsData.goals.achieved / analyticsData.goals.total) * 100;

    const pieChartData = Object.entries(analyticsData.subjects).map(([name, hours], index) => ({
        name,
        hours,
        color: [`#FF6384`, `#36A2EB`, `#FFCE56`, `#4BC0C0`, `#9966FF`][index],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
    }));

    const handleTimeRangeChange = async (range) => {
        setTimeRange(range);
    };

    if (loading && !Object.keys(analyticsData.subjects).length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchAnalyticsData}
                />
            }
        >
            {/* Header and other components remain the same... */}

            <View style={styles.timeRangeSelector}>
                {['week', 'month', 'year'].map((range) => (
                    <Pressable
                        key={range}
                        style={[
                            styles.timeRangeButton,
                            timeRange === range && styles.activeTimeRange
                        ]}
                        onPress={() => handleTimeRangeChange(range)}
                        disabled={loading}
                    >
                        <Text style={[
                            styles.timeRangeText,
                            timeRange === range && styles.activeTimeRangeText
                        ]}>
                            {range === 'week' ? '주간' : range === 'month' ? '월간' : '연간'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Charts and other components remain the same... */}
        </ScrollView>
    );
};

// Add these styles to existing styles
const additionalStyles = {
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    timeRangeButtonDisabled: {
        opacity: 0.5
    }
};

export default StudyAnalyticsScreen;