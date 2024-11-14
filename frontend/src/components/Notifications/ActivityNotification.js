// components/Notifications/ActivityNotification.js

import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { setActivityNotification } from '../../api/notifications';

const ActivityNotification = () => {
    const [isEnabled, setIsEnabled] = useState(false);

    const toggleActivityNotification = async () => {
        const enabled = !isEnabled;
        setIsEnabled(enabled);

        try {
            await setActivityNotification(enabled);
            Alert.alert('Notification', `Activity notifications ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update activity notification setting');
        }
    };

    return (
        <View>
            <Text>채팅방 활동 알림</Text>
            <Switch value={isEnabled} onValueChange={toggleActivityNotification} />
        </View>
    );
};

export default ActivityNotification;
