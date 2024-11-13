// components/OnlineStatus.js

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getUserStatus } from '../../api/chat';

const OnlineStatus = ({ userId }) => {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await getUserStatus(userId);
                setIsOnline(status.online);
            } catch (error) {
                console.error('Failed to fetch user status:', error);
            }
        };

        fetchStatus();

        const statusInterval = setInterval(fetchStatus, 5000); // Refresh status every 5 seconds
        return () => clearInterval(statusInterval);
    }, [userId]);

    return (
        <View style={{ padding: 5 }}>
            <Text>User is {isOnline ? 'Online' : 'Offline'}</Text>
        </View>
    );
};

export default OnlineStatus;
