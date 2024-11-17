// src/navigation/TabNavigator.js
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../features/home/screens/HomeScreen';
import ChatListScreen from '../features/social/screens/chat/ChatListScreen';
import FriendListScreen from '../features/social/screens/friend/FriendListScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Chat':
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                            break;
                        case 'Friends':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        default:
                            iconName = 'ellipsis-horizontal';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0057D9',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E5EA',
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4
                        },
                        android: {
                            elevation: 8
                        }
                    })
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 4
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: '홈',
                    tabBarBadge: null
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatListScreen}
                options={({ route }) => ({
                    title: '채팅',
                    tabBarBadge: route.params?.unreadCount > 0
                        ? route.params.unreadCount
                        : null,
                    tabBarBadgeStyle: {
                        backgroundColor: '#FF3B30',
                        fontSize: 12
                    }
                })}
            />
            <Tab.Screen
                name="Friends"
                component={FriendListScreen}
                options={{
                    title: '친구',
                    tabBarBadge: null
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;