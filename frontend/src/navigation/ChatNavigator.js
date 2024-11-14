// src/navigation/ChatNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatListScreen from '../screens/ChatScreens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatScreens/ChatRoomScreen';
import ChatRoomManagementScreen from '../screens/ChatScreens/ChatRoomManagementScreen';
import FileMediaManagementScreen from '../screens/ChatScreens/FileMediaManagementScreen';
import FriendInviteManagementScreen from '../screens/ChatScreens/FriendInviteManagementScreen';
import GroupMemberManagementScreen from '../screens/ChatScreens/GroupMemberManagementScreen';
import NotificationSettingsScreen from '../screens/ChatScreens/NotificationSettingsScreen';
import PersonalNoteSettingsScreen from '../screens/ChatScreens/PersonalNoteSettingsScreen';
import SearchSortScreen from '../screens/ChatScreens/SearchSortScreen';
import SecuritySettingsScreen from '../screens/ChatScreens/SecuritySettingsScreen';

const Stack = createStackNavigator();

const ChatNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="ChatList">
            <Stack.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{ title: 'Chats' }}
            />
            <Stack.Screen
                name="ChatRoom"
                component={ChatRoomScreen}
                options={({ route }) => ({
                    title: route.params?.roomName || 'Chat Room',
                })}
            />
            <Stack.Screen
                name="ChatRoomManagement"
                component={ChatRoomManagementScreen}
                options={{ title: 'Chat Room Management' }}
            />
            <Stack.Screen
                name="FileMediaManagement"
                component={FileMediaManagementScreen}
                options={{ title: 'File & Media Management' }}
            />
            <Stack.Screen
                name="FriendInviteManagement"
                component={FriendInviteManagementScreen}
                options={{ title: 'Friend Invite Management' }}
            />
            <Stack.Screen
                name="GroupMemberManagement"
                component={GroupMemberManagementScreen}
                options={{ title: 'Group Member Management' }}
            />
            <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{ title: 'Notification Settings' }}
            />
            <Stack.Screen
                name="PersonalNoteSettings"
                component={PersonalNoteSettingsScreen}
                options={{ title: 'Personal Note Settings' }}
            />
            <Stack.Screen
                name="SearchSort"
                component={SearchSortScreen}
                options={{ title: 'Search & Sort' }}
            />
            <Stack.Screen
                name="SecuritySettings"
                component={SecuritySettingsScreen}
                options={{ title: 'Security Settings' }}
            />
        </Stack.Navigator>
    );
};

export default ChatNavigator;
