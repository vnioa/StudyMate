// components/Notifications/NotificationOptions.js

import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { fetchNotificationSettings, updateNotificationSettings } from '../../api/notifications';

const NotificationOptions = () => {
    const [options, setOptions] = useState({
        pushNotifications: false,
        readReceipts: false,
    });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetchNotificationSettings();
                setOptions(response.data);
            } catch (error) {
                Alert.alert('Error', 'Failed to load notification settings');
            }
        };
        loadSettings();
    }, []);

    const toggleOption = async (option) => {
        const updatedOptions = { ...options, [option]: !options[option] };
        setOptions(updatedOptions);

        try {
            await updateNotificationSettings(updatedOptions);
        } catch (error) {
            Alert.alert('Error', 'Failed to update notification settings');
        }
    };

    return (
        <View>
            <Text>푸시 알림</Text>
            <Switch
                value={options.pushNotifications}
                onValueChange={() => toggleOption('pushNotifications')}
            />
            <Text>메시지 읽음 확인</Text>
            <Switch
                value={options.readReceipts}
                onValueChange={() => toggleOption('readReceipts')}
            />
        </View>
    );
};

export default NotificationOptions;
