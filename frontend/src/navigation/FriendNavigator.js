// src/navigation/FriendNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AddFriendScreen from '../screens/FriendScreens/AddFriendScreen';
import BlockedUsersScreen from '../screens/FriendScreens/BlockedUsersScreen';
import FriendListScreen from '../screens/FriendScreens/FriendListScreen';
import FriendProfileScreen from '../screens/FriendScreens/FriendProfileScreen';
import FriendRequestScreen from '../screens/FriendScreens/FriendRequestScreen';

const Stack = createStackNavigator();

const FriendNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="FriendList">
            <Stack.Screen
                name="FriendList"
                component={FriendListScreen}
                options={{ title: 'Friends' }}
            />
            <Stack.Screen
                name="AddFriend"
                component={AddFriendScreen}
                options={{ title: 'Add Friend' }}
            />
            <Stack.Screen
                name="BlockedUsers"
                component={BlockedUsersScreen}
                options={{ title: 'Blocked Users' }}
            />
            <Stack.Screen
                name="FriendProfile"
                component={FriendProfileScreen}
                options={({ route }) => ({
                    title: route.params?.username || 'Friend Profile',
                })}
            />
            <Stack.Screen
                name="FriendRequest"
                component={FriendRequestScreen}
                options={{ title: 'Friend Requests' }}
            />
        </Stack.Navigator>
    );
};

export default FriendNavigator;
