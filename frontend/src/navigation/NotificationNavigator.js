// src/navigation/NotificationNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NotificationListScreen from '../screens/NotificationScreens/NotificationListScreen';
import NotificationDetailScreen from '../screens/NotificationScreens/NotificationDetailScreen';
import NotificationSettingsScreen from '../screens/NotificationScreens/NotificationSettingsScreen';

const Stack = createStackNavigator();

const NotificationNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="NotificationList">
            <Stack.Screen
                name="NotificationList"
                component={NotificationListScreen}
                options={{ title: 'Notifications' }}
            />
            <Stack.Screen
                name="NotificationDetail"
                component={NotificationDetailScreen}
                options={({ route }) => ({
                    title: route.params?.title || 'Notification Detail',
                })}
            />
            <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{ title: 'Notification Settings' }}
            />
        </Stack.Navigator>
    );
};

export default NotificationNavigator;
