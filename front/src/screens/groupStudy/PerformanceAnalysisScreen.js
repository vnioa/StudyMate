import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import api from '../../api/api';

const PerformanceAnalysisScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchPerformanceData = useCallback(async () => {
        try {
            setLoading(true);
            const [studyTimeResponse, achievementResponse, comparisonResponse] = await Promise.all([
                api.get(`/groups/${groupId}/study-time-stats`),
                api.get(`/groups/${groupId}/achievement-stats`),
                api.get(`/groups/${groupId}/comparison-stats`)
            ]);

            setStats({
                studyTime: studyTimeResponse.data,
                achievement: achievementResponse.data,
                comparison: comparisonResponse.data
            });
        } catch (error) {
            setError('데이터를 불러오는데 실패했습니다.');
            Alert.alert('오류', '성과 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchPerformanceData();
            return () => setStats(null);
        }, [fetchPerformanceData])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>성과 분석</Text>
                <Pressable
                    onPress={fetchPerformanceData}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="refresh-cw" size={20} color="#333" />
                </Pressable>
            </View>

            <ScrollView style={styles.content}>
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>학습 시간 통계</Text>
                            {stats?.studyTime && (
                                <View style={styles.chartContainer}>
                                    <LineChart
                                        data={stats.studyTime.chartData}
                                        width={300}
                                        height={200}
                                        chartConfig={{
                                            backgroundColor: '#fff',
                                            backgroundGradientFrom: '#fff',
                                            backgroundGradientTo: '#fff',
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                                        }}
                                        style={styles.chart}
                                    />
                                    <Text style={styles.sectionContent}>
                                        {stats.studyTime.summary}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>목표 달성률</Text>
                            {stats?.achievement && (
                                <View style={styles.achievementContainer}>
                                    <Text style={styles.achievementRate}>
                                        {stats.achievement.rate}%
                                    </Text>
                                    <Text style={styles.sectionContent}>
                                        {stats.achievement.description}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>그룹 비교 분석</Text>
                            {stats?.comparison && (
                                <View style={styles.chartContainer}>
                                    <BarChart
                                        data={stats.comparison.chartData}
                                        width={300}
                                        height={200}
                                        chartConfig={{
                                            backgroundColor: '#fff',
                                            backgroundGradientFrom: '#fff',
                                            backgroundGradientTo: '#fff',
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                                        }}
                                        style={styles.chart}
                                    />
                                    <Text style={styles.sectionContent}>
                                        {stats.comparison.analysis}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    sectionContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 8,
    },
    achievementContainer: {
        alignItems: 'center',
    },
    achievementRate: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 10,
    },
    errorText: {
        textAlign: 'center',
        color: '#FF5252',
        marginTop: 20,
        fontSize: 16,
    }
});

export default PerformanceAnalysisScreen;