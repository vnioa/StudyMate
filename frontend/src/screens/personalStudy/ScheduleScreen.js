import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Modal,
    TextInput,
    Switch,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleAPI } from '../../services/api';

const ScheduleScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [viewMode, setViewMode] = useState('month');
    const [schedules, setSchedules] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        title: '',
        startTime: new Date(),
        endTime: new Date(),
        repeat: false,
        notification: false,
        shared: false,
    });

    useEffect(() => {
        fetchSchedules();
    }, [selectedDate]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await scheduleAPI.getSchedules(selectedDate);
            setSchedules(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '일정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async () => {
        if (!newSchedule.title.trim()) {
            Alert.alert('알림', '일정 제목을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await scheduleAPI.createSchedule({
                ...newSchedule,
                date: selectedDate
            });

            if (response.data.success) {
                setSchedules(prev => [...prev, response.data.schedule]);
                setModalVisible(false);
                setNewSchedule({
                    title: '',
                    startTime: new Date(),
                    endTime: new Date(),
                    repeat: false,
                    notification: false,
                    shared: false,
                });
                Alert.alert('성공', '일정이 추가되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '일정 추가에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (id) => {
        Alert.alert(
            '일정 삭제',
            '정말로 이 일정을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await scheduleAPI.deleteSchedule(id);
                            setSchedules(prev => prev.filter(schedule => schedule.id !== id));
                        } catch (error) {
                            Alert.alert('오류', '일정 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const ViewModeButtons = () => (
        <View style={styles.viewModeContainer}>
            {['month', 'week', 'day'].map((mode) => (
                <Pressable
                    key={mode}
                    style={[
                        styles.viewModeButton,
                        viewMode === mode && styles.activeViewMode
                    ]}
                    onPress={() => setViewMode(mode)}
                >
                    <Text style={styles.viewModeText}>
                        {mode === 'month' ? '월간' : mode === 'week' ? '주간' : '일간'}
                    </Text>
                </Pressable>
            ))}
        </View>
    );

    if (loading && !schedules.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </Pressable>
                <Text style={styles.headerTitle}>학습 일정</Text>
                <Pressable onPress={() => setModalVisible(true)}>
                    <Icon name="plus" size={24} color="#333" />
                </Pressable>
            </View>

            <ViewModeButtons />

            <Calendar
                style={styles.calendar}
                onDayPress={day => setSelectedDate(day.dateString)}
                markedDates={{
                    [selectedDate]: { selected: true, selectedColor: '#4A90E2' },
                }}
            />

            <ScrollView style={styles.scheduleList}>
                {schedules.map(schedule => (
                    <View key={schedule.id} style={styles.scheduleItem}>
                        <View style={styles.scheduleInfo}>
                            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                            <Text style={styles.scheduleTime}>
                                {new Date(schedule.startTime).toLocaleTimeString()} -
                                {new Date(schedule.endTime).toLocaleTimeString()}
                            </Text>
                        </View>
                        <View style={styles.scheduleActions}>
                            <Pressable onPress={() => {}}>
                                <Icon name="edit-2" size={20} color="#666" />
                            </Pressable>
                            <Pressable onPress={() => handleDeleteSchedule(schedule.id)}>
                                <Icon name="trash-2" size={20} color="#666" />
                            </Pressable>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>새 일정 추가</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="일정 제목"
                            value={newSchedule.title}
                            onChangeText={(text) => setNewSchedule({...newSchedule, title: text})}
                        />

                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>반복</Text>
                            <Switch
                                value={newSchedule.repeat}
                                onValueChange={(value) => setNewSchedule({...newSchedule, repeat: value})}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>알림</Text>
                            <Switch
                                value={newSchedule.notification}
                                onValueChange={(value) => setNewSchedule({...newSchedule, notification: value})}
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>공유</Text>
                            <Switch
                                value={newSchedule.shared}
                                onValueChange={(value) => setNewSchedule({...newSchedule, shared: value})}
                            />
                        </View>

                        <Pressable
                            style={[styles.addButton, loading && styles.addButtonDisabled]}
                            onPress={handleAddSchedule}
                            disabled={loading}
                        >
                            <Text style={styles.addButtonText}>
                                {loading ? '추가 중...' : '일정 추가'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// 기존 스타일에 추가할 스타일
const additionalStyles = {
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    addButtonDisabled: {
        opacity: 0.5
    }
};

export default ScheduleScreen;