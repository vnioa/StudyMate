// components/MessageScheduler.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const MessageScheduler = ({ onScheduleMessage }) => {
    const [message, setMessage] = useState('');
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios'); // iOS에서만 계속 표시
        if (selectedDate) {
            setScheduledDate(selectedDate);
        }
    };

    const openDatePicker = () => {
        setShowDatePicker(true);
    };

    const scheduleMessage = () => {
        if (message && scheduledDate) {
            onScheduleMessage({ message, date: scheduledDate });
            setMessage('');
            setScheduledDate(new Date());
        }
    };

    return (
        <View style={{ padding: 10 }}>
            <Text>Schedule a Message</Text>
            <TextInput
                placeholder="Enter your message"
                value={message}
                onChangeText={setMessage}
                style={{ borderBottomWidth: 1, marginBottom: 10 }}
            />
            <Button title="Pick a date" onPress={openDatePicker} />
            {scheduledDate && (
                <Text>Scheduled for: {scheduledDate.toLocaleDateString()} {scheduledDate.toLocaleTimeString()}</Text>
            )}
            {showDatePicker && (
                <DateTimePicker
                    value={scheduledDate}
                    mode="datetime"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
            <Button title="Schedule Message" onPress={scheduleMessage} />
        </View>
    );
};

export default MessageScheduler;
