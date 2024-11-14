// src/components/Chat/ScheduleMessage.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const ScheduleMessage = ({ onSchedule }) => {
    const [message, setMessage] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 메시지 전송 예약
    const handleScheduleMessage = () => {
        if (!message.trim()) {
            alert('메시지를 입력해 주세요.');
            return;
        }
        onSchedule({ message, scheduledTime: selectedDate });
        setMessage('');
        setSelectedDate(new Date());
    };

    // 날짜 선택기 열기/닫기
    const toggleDatePicker = () => {
        setShowDatePicker(!showDatePicker);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Enter message to schedule"
                value={message}
                onChangeText={setMessage}
            />
            <TouchableOpacity onPress={toggleDatePicker} style={styles.dateButton}>
                <Text style={styles.dateButtonText}>
                    {`Send at: ${selectedDate.toLocaleString()}`}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="datetime"
                    display="default"
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setSelectedDate(date);
                    }}
                />
            )}
            <TouchableOpacity onPress={handleScheduleMessage} style={styles.scheduleButton}>
                <Text style={styles.scheduleButtonText}>Schedule Message</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    dateButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginBottom: 10,
    },
    dateButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    scheduleButton: {
        padding: 10,
        backgroundColor: '#28a745',
        borderRadius: 5,
        alignItems: 'center',
    },
    scheduleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ScheduleMessage;
