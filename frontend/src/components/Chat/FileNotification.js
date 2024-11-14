// 파일 전송 알림 제공

import React from 'react';
import { View, Button, Alert } from 'react-native';
import { sendFileNotification } from '../../api/chat';

const FileNotification = ({ chatId, fileName }) => {
    const handleSendNotification = async () => {
        try {
            await sendFileNotification(chatId, fileName);
            Alert.alert('파일 전송 알림이 전송되었습니다.');
        } catch (error) {
            Alert.alert('알림 전송 실패', error.message);
        }
    };

    return (
        <View>
            <Button title="파일 전송 알림" onPress={handleSendNotification} />
        </View>
    );
};

export default FileNotification;
