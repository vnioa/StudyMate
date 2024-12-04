import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { studyAPI } from '../../services/api';

const { width } = Dimensions.get('window');

const StudyAnalyticsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
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
    }, [timeRange, selectedSubject]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const response = await studyAPI.getAnalytics(timeRange);
            if (selectedSubject !== 'all') {
                const subjectData = await studyAPI.getSubjectAnalytics(selectedSubject, timeRange);
                setAnalyticsData({ ...response.data, ...subjectData.data });
            } else {
                setAnalyticsData(response.data);
            }
        } catch (error) {
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalyticsData();
    };

    const achievementRate = analyticsData.goals.total > 0
        ? (analyticsData.goals.achieved / analyticsData.goals.total) * 100
        : 0;

    // Infinity 값 필터링 및 안전한 숫자 변환 추가
    const pieChartData = Object.entries(analyticsData.subjects)
        .filter(([_, hours]) => isFinite(hours) && hours !== null && hours !== undefined)
        .map(([name, hours], index) => ({
            name,
            hours: parseFloat(hours) || 0,
            color: [`#FF6384`, `#36A2EB`, `#FFCE56`, `#4BC0C0`, `#9966FF`][index % 5],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
        }));

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16
        },
        formatYLabel: (value) => {
            if (!isFinite(value)) return '0';
            return value.toString();
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726'
        }
    };

    const renderTimeRangeSelector = () => (
        <View style={styles.timeRangeSelector}>
            {['week', 'month', 'year'].map((range) => (
                <Pressable
                    key={range}
                    style={[
                        styles.timeRangeButton,
                        timeRange === range && styles.activeTimeRange,
                        loading && styles.timeRangeButtonDisabled
                    ]}
                    onPress={() => setTimeRange(range)}
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
    );

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
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#4A90E2']}
                />
            }
        >
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 분석</Text>
                <View style={styles.headerRight} />
            </View>

            {renderTimeRangeSelector()}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>과목별 학습 시간</Text>
                {pieChartData.length > 0 ? (
                    <PieChart
                        data={pieChartData.map(item => ({
                            ...item,
                            hours: isFinite(item.hours) ? Math.min(item.hours, 24) : 0
                        }))}
                        width={width - 32}
                        height={220}
                        chartConfig={chartConfig}
                        accessor="hours"
                        backgroundColor="transparent"
                        paddingLeft="15"
                    />
                ) : (
                    <Text style={styles.noDataText}>데이터가 없습니다</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>주간 학습 시간</Text>
                {analyticsData.weeklyHours.datasets[0].data.length > 0 ? (
                    <LineChart
                        data={{
                            labels: ['월', '화', '수', '목', '금', '토', '일'],
                            datasets: [{
                                data: analyticsData.weeklyHours.datasets[0].data.map(value => {
                                    const num = Number(value);
                                    return isFinite(num) ? Math.min(num, 1440) : 0;
                                })
                            }]
                        }}
                        width={width - 32}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                ) : (
                    <Text style={styles.noDataText}>데이터가 없습니다</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>목표 달성률</Text>
                <View style={styles.achievementContainer}>
                    <Text style={styles.achievementRate}>
                        {achievementRate.toFixed(1)}%
                    </Text>
                    <Text style={styles.achievementDetail}>
                        {analyticsData.goals.achieved}/{analyticsData.goals.total} 목표 달성
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        width: 24,
    },
    timeRangeSelector: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    timeRangeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginHorizontal: 4,
        backgroundColor: '#f1f3f5',
    },
    activeTimeRange: {
        backgroundColor: '#4A90E2',
    },
    timeRangeText: {
        color: '#666',
        fontSize: 14,
    },
    activeTimeRangeText: {
        color: '#fff',
    },
    timeRangeButtonDisabled: {
        opacity: 0.5,
    },
    section: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    achievementContainer: {
        alignItems: 'center',
    },
    achievementRate: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    achievementDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    noDataText: {
        textAlign: 'center',
        color: '#666',
        padding: 20,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    }
});

export default StudyAnalyticsScreen;