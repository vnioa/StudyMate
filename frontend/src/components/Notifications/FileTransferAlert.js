// components/Notifications/FileTransferAlert.js

import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { setFileTransferAlert } from '../../api/notifications';

const FileTransferAlert = () => {
    const [isEnabled, setIsEnabled] = useState(false);

    const toggleFileTransferAlert = async () => {
        const enabled = !isEnabled;
        setIsEnabled(enabled);

        try {
            await setFileTransferAlert(enabled);
            Alert.alert('Notification', `File transfer alerts ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update file transfer alert setting');
        }
    };

    return (
        <View>
            <Text>파일 전송 알림</Text>
            <Switch value={isEnabled} onValueChange={toggleFileTransferAlert} />
        </View>
    );
};

export default FileTransferAlert;
