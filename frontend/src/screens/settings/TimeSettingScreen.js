import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { settingsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimeSettingScreen = ({ route }) => {
    const { title } = route.params;
    const [loading, setLoading] = useState(false);
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        fetchTimeSettings();
    }, []);

    const fetchTimeSettings = async () => {
        try {
            const response = await settingsAPI.getTimeSettings(title);
            if (response.data) {
                setStartTime(new Date(response.data.startTime));
                setEndTime(new Date(response.data.endTime));
            }
        } catch (error) {
            Alert.alert('오류', '시간 설정을 불러오는데 실패했습니다.');
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
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
            setLoading(true);
            let newStartTime = startTime;
            let newEndTime = endTime;

            if (type === 'start') {
                newStartTime = selectedTime;
                if (!validateTimes(selectedTime, endTime)) return;
            } else {
                newEndTime = selectedTime;
                if (!validateTimes(startTime, selectedTime)) return;
            }

            const response = await settingsAPI.updateTimeSettings(title, {
                startTime: newStartTime,
                endTime: newEndTime
            });

            if (response.data.success) {
                if (type === 'start') {
                    setStartTime(selectedTime);
                    setStartPickerVisible(false);
                } else {
                    setEndTime(selectedTime);
                    setEndPickerVisible(false);
                }
                await AsyncStorage.setItem(`timeSettings_${title}`, JSON.stringify({
                    startTime: newStartTime,
                    endTime: newEndTime
                }));
            }
        } catch (error) {
            Alert.alert('오류', '시간 설정 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title} 알림 시간</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => setStartPickerVisible(true)}
                    disabled={loading}
                >
                    <Text style={styles.itemTitle}>시작 시간</Text>
                    <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.item}
                    onPress={() => setEndPickerVisible(true)}
                    disabled={loading}
                >
                    <Text style={styles.itemTitle}>종료 시간</Text>
                    <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>

                <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="time"
                    onConfirm={(time) => handleTimeChange('start', time)}
                    onCancel={() => setStartPickerVisible(false)}
                    date={startTime}
                />

                <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="time"
                    onConfirm={(time) => handleTimeChange('end', time)}
                    onCancel={() => setEndPickerVisible(false)}
                    date={endTime}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    backButton: {
        padding: 8,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    timeText: {
        fontSize: 16,
        color: '#0066FF',
    },
});

export default TimeSettingScreen;