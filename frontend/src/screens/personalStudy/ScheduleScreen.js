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
    Alert,
    ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleAPI } from '../../services/api';

const TimePickerField = ({ label, value, onChange }) => {
    const [show, setShow] = useState(false);

    return (
        <View style={styles.timePickerContainer}>
            <Text style={styles.timeLabel}>{label}</Text>
            <Pressable onPress={() => setShow(true)} style={styles.timeButton}>
                <Text style={styles.timeText}>
                    {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </Pressable>
            {show && (
                <DateTimePicker
                    value={value}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedTime) => {
                        setShow(false);
                        if (selectedTime) onChange(selectedTime);
                    }}
                />
            )}
        </View>
    );
};

const ScheduleScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [viewMode, setViewMode] = useState('month');
    const [schedules, setSchedules] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [newSchedule, setNewSchedule] = useState({
        title: '',
        startTime: new Date(),
        endTime: new Date(),
        repeat: false,
        notification: false,
        shared: false,
    });

    useEffect(() => {
        if (selectedDate) {
            fetchSchedules();
        }
    }, [selectedDate]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await scheduleAPI.getSchedules(selectedDate);
            setSchedules(response.data);
        } catch (error) {
            Alert.alert('오류', '일정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!newSchedule.title.trim()) {
            Alert.alert('알림', '일정 제목을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            if (editingSchedule) {
                const response = await scheduleAPI.updateSchedule(
                    editingSchedule.id,
                    { ...newSchedule, date: selectedDate }
                );
                setSchedules(prev =>
                    prev.map(item => item.id === editingSchedule.id ? response.data : item)
                );
            } else {
                const response = await scheduleAPI.createSchedule({
                    ...newSchedule,
                    date: selectedDate
                });
                setSchedules(prev => [...prev, response.data]);
            }

            closeModal();
            Alert.alert('성공', `일정이 ${editingSchedule ? '수정' : '추가'}되었습니다.`);
        } catch (error) {
            Alert.alert('오류', `일정 ${editingSchedule ? '수정' : '추가'}에 실패했습니다.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setNewSchedule({
            title: schedule.title,
            startTime: new Date(schedule.startTime),
            endTime: new Date(schedule.endTime),
            repeat: schedule.repeat,
            notification: schedule.notification,
            shared: schedule.shared,
        });
        setModalVisible(true);
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

    const closeModal = () => {
        setModalVisible(false);
        setEditingSchedule(null);
        setNewSchedule({
            title: '',
            startTime: new Date(),
            endTime: new Date(),
            repeat: false,
            notification: false,
            shared: false,
        });
    };

    const ViewModeButtons = () => (
        <View style={styles.viewModeContainer}>
            {['month', 'week', 'day'].map((mode) => (
                <Pressable
                    key={mode}
                    style={[styles.viewModeButton, viewMode === mode && styles.activeViewMode]}
                    onPress={() => setViewMode(mode)}
                >
                    <Text style={[
                        styles.viewModeText,
                        viewMode === mode && styles.activeViewModeText
                    ]}>
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
                theme={{
                    todayTextColor: '#4A90E2',
                    selectedDayBackgroundColor: '#4A90E2',
                    arrowColor: '#4A90E2',
                }}
            />

            <ScrollView style={styles.scheduleList}>
                {schedules.map(schedule => (
                    <View key={schedule.id} style={styles.scheduleItem}>
                        <View style={styles.scheduleInfo}>
                            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                            <Text style={styles.scheduleTime}>
                                {new Date(schedule.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })} - {new Date(schedule.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            </Text>
                        </View>
                        <View style={styles.scheduleActions}>
                            <Pressable
                                onPress={() => handleEditSchedule(schedule)}
                                style={styles.actionButton}
                            >
                                <Icon name="edit-2" size={20} color="#666" />
                            </Pressable>
                            <Pressable
                                onPress={() => handleDeleteSchedule(schedule.id)}
                                style={styles.actionButton}
                            >
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
                            <Text style={styles.modalTitle}>
                                {editingSchedule ? '일정 수정' : '새 일정 추가'}
                            </Text>
                            <Pressable onPress={closeModal}>
                                <Icon name="x" size={24} color="#333" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="일정 제목"
                            value={newSchedule.title}
                            onChangeText={(text) => setNewSchedule({...newSchedule, title: text})}
                        />

                        <TimePickerField
                            label="시작 시간"
                            value={newSchedule.startTime}
                            onChange={(time) => setNewSchedule({...newSchedule, startTime: time})}
                        />

                        <TimePickerField
                            label="종료 시간"
                            value={newSchedule.endTime}
                            onChange={(time) => setNewSchedule({...newSchedule, endTime: time})}
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
                            onPress={handleSaveSchedule}
                            disabled={loading}
                        >
                            <Text style={styles.addButtonText}>
                                {loading ? '처리 중...' : editingSchedule ? '수정하기' : '추가하기'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    viewModeContainer: {
        flexDirection: 'row',
        padding: 8,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    viewModeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 16,
    },
    activeViewMode: {
        backgroundColor: '#4A90E2',
    },
    viewModeText: {
        color: '#666',
    },
    activeViewModeText: {
        color: '#fff',
    },
    calendar: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    scheduleList: {
        flex: 1,
    },
    scheduleItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleInfo: {
        flex: 1,
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    scheduleTime: {
        fontSize: 14,
        color: '#666',
    },
    scheduleActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    timePickerContainer: {
        marginBottom: 16,
    },
    timeLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    timeButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
    },
    timeText: {
        fontSize: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    settingLabel: {
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ScheduleScreen;