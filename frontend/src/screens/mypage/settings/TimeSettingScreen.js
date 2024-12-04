import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimeSettingScreen = ({ route }) => {
    const { title, onUpdate } = route.params;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [timeSettings, setTimeSettings] = useState({
        startTime: new Date(),
        endTime: new Date(),
        enabled: true,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);

    useEffect(() => {
        fetchTimeSettings();
    }, [title]);

    const fetchTimeSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getTimeSettings(title);
            if (response.data) {
                const settings = {
                    ...response.data,
                    startTime: new Date(response.data.startTime),
                    endTime: new Date(response.data.endTime)
                };
                setTimeSettings(settings);
                await AsyncStorage.setItem(`timeSettings_${title}`, JSON.stringify(settings));
            }
        } catch (error) {
            Alert.alert('오류', '시간 설정을 불러오는데 실패했습니다.');
            // Fallback to cached settings
            const cachedSettings = await AsyncStorage.getItem(`timeSettings_${title}`);
            if (cachedSettings) {
                const settings = JSON.parse(cachedSettings);
                setTimeSettings({
                    ...settings,
                    startTime: new Date(settings.startTime),
                    endTime: new Date(settings.endTime)
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatTime = (date) => {
        if (!date || !(date instanceof Date) || !isFinite(date.getTime())) {
            return '00:00';
        }
        try {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    };

    const validateTimes = (start, end) => {
        if (start >= end) {
            Alert.alert('오류', '종료 시간은 시작 시간보다 늦어야 합니다.');
            return false;
        }
        return true;
    };

    const handleTimeChange = async (type, selectedTime) => {
        try {
            let newSettings = { ...timeSettings };

            if (type === 'start') {
                if (!validateTimes(selectedTime, timeSettings.endTime)) return;
                newSettings.startTime = selectedTime;
            } else {
                if (!validateTimes(timeSettings.startTime, selectedTime)) return;
                newSettings.endTime = selectedTime;
            }

            setLoading(true);
            const response = await settingsAPI.updateTimeSettings(title, newSettings);

            if (response.data.success) {
                setTimeSettings(newSettings);
                await AsyncStorage.setItem(`timeSettings_${title}`, JSON.stringify(newSettings));
                if (onUpdate) onUpdate();
                Alert.alert('성공', '시간이 변경되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '시간 설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
            setStartPickerVisible(false);
            setEndPickerVisible(false);
        }
    };

    const toggleEnabled = async () => {
        try {
            setLoading(true);
            const newSettings = {
                ...timeSettings,
                enabled: !timeSettings.enabled
            };

            const response = await settingsAPI.updateTimeSettings(title, newSettings);
            if (response.data.success) {
                setTimeSettings(newSettings);
                await AsyncStorage.setItem(`timeSettings_${title}`, JSON.stringify(newSettings));
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !timeSettings.startTime) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title} 알림 시간</Text>
                <TouchableOpacity onPress={toggleEnabled}>
                    <Ionicons
                        name={timeSettings.enabled ? "notifications" : "notifications-off"}
                        size={24}
                        color={timeSettings.enabled ? "#4A90E2" : "#666"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchTimeSettings}
                        colors={['#4A90E2']}
                    />
                }
            >
                <View style={styles.timeSection}>
                    <TouchableOpacity
                        style={[styles.timeItem, !timeSettings.enabled && styles.timeItemDisabled]}
                        onPress={() => setStartPickerVisible(true)}
                        disabled={loading || !timeSettings.enabled}
                    >
                        <Text style={styles.timeTitle}>시작 시간</Text>
                        <Text style={[styles.timeText, !timeSettings.enabled && styles.timeTextDisabled]}>
                            {formatTime(timeSettings.startTime)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.timeItem, !timeSettings.enabled && styles.timeItemDisabled]}
                        onPress={() => setEndPickerVisible(true)}
                        disabled={loading || !timeSettings.enabled}
                    >
                        <Text style={styles.timeTitle}>종료 시간</Text>
                        <Text style={[styles.timeText, !timeSettings.enabled && styles.timeTextDisabled]}>
                            {formatTime(timeSettings.endTime)}
                        </Text>
                    </TouchableOpacity>
                </View>

                <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="time"
                    onConfirm={(time) => handleTimeChange('start', time)}
                    onCancel={() => setStartPickerVisible(false)}
                    date={timeSettings.startTime}
                />

                <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="time"
                    onConfirm={(time) => handleTimeChange('end', time)}
                    onCancel={() => setEndPickerVisible(false)}
                    date={timeSettings.endTime}
                />
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
        </View>
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
        backgroundColor: '#f8f9fa',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
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
    content: {
        flex: 1,
    },
    timeSection: {
        backgroundColor: '#fff',
        marginTop: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    timeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    timeItemDisabled: {
        opacity: 0.5,
    },
    timeTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    timeText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '500',
    },
    timeTextDisabled: {
        color: '#666',
    }
});

export default TimeSettingScreen;