import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import MessageScheduler from './MessageScheduler';
import FileUpload from './FileUpload';

const ChatInput = ({ onSend, onScheduleMessage }) => {
    const [text, setText] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    const handleSend = () => {
        if (text) {
            onSend(text);
            setText('');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="메시지 입력..."
            />
            <FileUpload onUpload={(file) => onSend(file)} />
            <Button title="전송" onPress={handleSend} />
            <Button title="예약" onPress={() => setIsScheduling(true)} />
            {isScheduling && (
                <MessageScheduler
                    onSchedule={(scheduledText) => {
                        onScheduleMessage(scheduledText);
                        setIsScheduling(false);
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    input: { flex: 1, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 8 },
});

export default ChatInput;
