import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';
import { authAPI } from './src/services/api';

// Intro, Home
import IntroScreen from "./src/screens/auth/IntroScreen";
import HomeScreen from "./src/screens/home/HomeScreen";

// Auth
import FindAccountScreen from "./src/screens/auth/FindAccountScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";

// Chat
import ChatAndFriendsScreen from "./src/screens/chat/ChatAndFriendsScreen";
import ChatListScreen from "./src/screens/chat/ChatListScreen";
import ChatRoomScreen from "./src/screens/chat/ChatRoomScreen";
import ChatRoomSettingsScreen from "./src/screens/chat/ChatRoomSettingsScreen";

// Community
import CreateQuestionScreen from "./src/screens/community/CreateQuestionScreen";
import QuestionDetailScreen from './src/screens/community/QuestionDetailScreen';
import StudyCommunityScreen from './src/screens/community/StudyCommunityScreen';

// Friend
import FriendListScreen from './src/screens/friend/FriendListScreen'
import FriendProfileScreen from './src/screens/friend/FriendProfileScreen';

// Group Study
import GroupActivityScreen from "./src/screens/groupStudy/GroupActivityScreen";
import GroupCreateScreen from "./src/screens/groupStudy/GroupCreateScreen";
import GroupDetailScreen from "./src/screens/groupStudy/GroupDetailScreen";
import GroupScreen from "./src/screens/groupStudy/GroupScreen";
import GroupSettingsScreen from "./src/screens/groupStudy/GroupSettingsScreen";
import MemberActivityScreen from "./src/screens/groupStudy/MemberActivityScreen";
import MemberInviteScreen from "./src/screens/groupStudy/MemberInviteScreen";
import MemberManageScreen from "./src/screens/groupStudy/MemberManageScreen";
import MemberRequestScreen from "./src/screens/groupStudy/MemberRequestScreen";
import MemberRoleScreen from "./src/screens/groupStudy/MemberRoleScreen";
import MentoringScreen from "./src/screens/groupStudy/MentoringScreen";
import MyGroupScreen from "./src/screens/groupStudy/MyGroupScreen";

// MyPage
import EditProfileScreen from "./src/screens/mypage/EditProfileScreen";
import ProfileScreen from "./src/screens/mypage/ProfileScreen";

// Notification
import NotificationScreen from "./src/screens/settings/NotificationScreen";

// Personal Study
import AddGoalScreen from "./src/screens/personalStudy/AddGoalScreen";
import EditGoalScreen from "./src/screens/personalStudy/EditGoalScreen";
import PersonalStudyDashboardScreen from "./src/screens/personalStudy/PersonalStudyDashboardScreen";
import ScheduleScreen from "./src/screens/personalStudy/ScheduleScreen";
import StudyAnalyticsScreen from "./src/screens/personalStudy/StudyAnalyticsScreen";
import StudyFeedbackScreen from "./src/screens/personalStudy/StudyFeedbackScreen";
import StudyGoalsScreen from "./src/screens/personalStudy/StudyGoalsScreen";
import StudyMaterialsScreen from "./src/screens/personalStudy/StudyMaterialsScreen";
import StudyMaterialDetailScreen from './src/screens/personalStudy/StudyMaterialDetailScreen';
import StudySessionScreen from "./src/screens/personalStudy/StudySessionScreen";

// Settings
import BackupScreen from "./src/screens/settings/BackupScreen";
import DataStorageScreen from "./src/screens/settings/DataStorageScreen";
import DisplayModeScreen from "./src/screens/settings/DisplayModeScreen";
import EditInfoScreen from "./src/screens/settings/EditInfoScreen";
import FontSizeScreen from "./src/screens/settings/FontSizeScreen";
import LanguageScreen from "./src/screens/settings/LanguageScreen";
import NotificationDetailScreen from "./src/screens/settings/NotificationDetailScreen";
import NotificationScreen from './src/screens/settings/NotificationScreen';
import PrivacySettingScreen from "./src/screens/settings/PrivacySettingScreen";
import SettingsBackupScreen from "./src/screens/settings/SettingsBackupScreen";
import SettingsScreen from "./src/screens/settings/SettingsScreen";
import SocialAccountsScreen from "./src/screens/settings/SocialAccountsScreen";
import TimeSettingScreen from "./src/screens/settings/TimeSettingScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 갱신
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await authAPI.getUnreadCount();
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    return (
        <Tab.Navigator
            id="MainTab"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = {
                        '홈': focused ? 'home' : 'home-outline',
                        '커뮤니티': focused ? 'people' : 'people-outline',
                        '개인 학습': focused ? 'book' : 'book-outline',
                        '그룹 학습': focused ? 'people-circle' : 'people-circle-outline',
                        '마이페이지': focused ? 'person' : 'person-outline'
                    }[route.name];

                    return (
                        <View>
                            <Ionicons name={iconName} size={size} color={color} />
                            {route.name === '커뮤니티' && unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    );
                },
                tabBarActiveTintColor: '#0066FF',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 5
                }
            })}
        >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen
                name="커뮤니티"
                component={ChatListScreen}
                options={{ tabBarBadge: unreadCount || null }}
            />
            <Tab.Screen name="개인 학습" component={PersonalStudyDashboardScreen} />
            <Tab.Screen name="그룹 학습" component={GroupScreen} />
            <Tab.Screen name="마이페이지" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const response = await authAPI.validateToken(token);
                setIsAuthenticated(response.data.isValid);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await AsyncStorage.removeItem('userToken');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                id="AuthStack"
                initialRouteName={isAuthenticated ? "MainTab" : "Intro"}
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#fff' }
                }}
            >
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Intro" component={IntroScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="FindAccount" component={FindAccountScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="MainTab"
                            component={TabNavigator}
                            options={{
                                headerShown: false,
                                gestureEnabled: false
                            }}
                        />
                        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
                        <Stack.Screen name="NewChat" component={NewChatScreen} />
                        <Stack.Screen name="StudySession" component={StudySessionScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = {
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
};

export default App;