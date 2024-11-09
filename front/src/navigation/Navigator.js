import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexts/AppContext';
import { theme } from '../utils/styles';

// Intro Screen
import IntroScreen from "../screens/home/IntroScreen";

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import FindIdPasswordScreen from '../screens/auth/FindIdPasswordScreen';
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import NotificationScreen from '../screens/home/NotificationScreen';

// Study Screens
import StudyMainScreen from '../screens/study/StudyMainScreen';
import PersonalStudyScreen from '../screens/study/PersonalStudyScreen';
import GroupStudyScreen from '../screens/study/GroupStudyScreen';
import QuizScreen from '../screens/study/QuizScreen';
import StudyMaterialScreen from '../screens/study/StudyMaterialScreen';
import StudyStatsScreen from '../screens/study/StudyStatsScreen';
import AIRecommendScreen from '../screens/study/AIRecommendScreen';

// Group Screens
import GroupListScreen from '../screens/group/GroupListScreen';
import GroupDetailScreen from '../screens/group/GroupDetailScreen';
import GroupCreateScreen from '../screens/group/GroupCreateScreen';
import GroupSettingsScreen from '../screens/group/GroupSettingsScreen';
import MemberManageScreen from '../screens/group/MemberManageScreen';
import GroupActivityScreen from '../screens/group/GroupActivityScreen';

// Friend Screens
import FriendListScreen from '../screens/friends/FriendListScreen';
import FriendDetailScreen from '../screens/friends/FriendDetailScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendRequestScreen from '../screens/friends/FriendRequestScreen';

// Chat Screens
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import VideoCallScreen from '../screens/chat/VideoCallScreen';
import FileShareScreen from '../screens/chat/FileShareScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AchievementsScreen from '../screens/profile/AchievementsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 스택 네비게이터 기본 옵션
const stackScreenOptions = {
    headerStyle: {
        backgroundColor: theme.colors.background.primary,
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTitleStyle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.h4,
    },
    headerTintColor: theme.colors.text.primary,
};

// 탭 네비게이터 기본 옵션
const tabScreenOptions = {
    tabBarStyle: {
        backgroundColor: theme.colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        height: 60,
        paddingBottom: 8,
    },
    tabBarActiveTintColor: theme.colors.primary.main,
    tabBarInactiveTintColor: theme.colors.text.secondary,
    tabBarLabelStyle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: 12,
    },
};

// Home Stack Navigator
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="HomeMain"
                component={HomeScreen}
                options={{ title: '홈' }}
            />
            <Stack.Screen
                name="Notification"
                component={NotificationScreen}
                options={{ title: '알림' }}
            />
        </Stack.Navigator>
    );
}

// Auth Stack Navigator
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="Intro"
                component={IntroScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignUp"
                component={SignupScreen}
                options={{ title: '회원가입' }}
            />
            <Stack.Screen
                name="FindIdPassword"
                component={FindIdPasswordScreen}
                options={{ title: '비밀번호 찾기' }}
            />
            <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ title: '비밀번호 찾기' }}
            />
        </Stack.Navigator>
    );
}

// Study Stack Navigator
function StudyStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="StudyMain"
                component={StudyMainScreen}
                options={{ title: '학습' }}
            />
            <Stack.Screen
                name="PersonalStudy"
                component={PersonalStudyScreen}
                options={{ title: '개인 학습' }}
            />
            <Stack.Screen
                name="GroupStudy"
                component={GroupStudyScreen}
                options={{ title: '그룹 학습' }}
            />
            <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={{ title: '퀴즈' }}
            />
            <Stack.Screen
                name="StudyMaterial"
                component={StudyMaterialScreen}
                options={{ title: '학습 자료' }}
            />
            <Stack.Screen
                name="StudyStats"
                component={StudyStatsScreen}
                options={{ title: '학습 통계' }}
            />
            <Stack.Screen
                name="AIRecommend"
                component={AIRecommendScreen}
                options={{ title: 'AI 추천' }}
            />
        </Stack.Navigator>
    );
}

// Group Stack Navigator
function GroupStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="GroupList"
                component={GroupListScreen}
                options={{ title: '그룹' }}
            />
            <Stack.Screen
                name="GroupDetail"
                component={GroupDetailScreen}
                options={{ title: '그룹 상세' }}
            />
            <Stack.Screen
                name="GroupCreate"
                component={GroupCreateScreen}
                options={{ title: '그룹 생성' }}
            />
            <Stack.Screen
                name="GroupSettings"
                component={GroupSettingsScreen}
                options={{ title: '그룹 설정' }}
            />
            <Stack.Screen
                name="MemberManage"
                component={MemberManageScreen}
                options={{ title: '멤버 관리' }}
            />
            <Stack.Screen
                name="GroupActivity"
                component={GroupActivityScreen}
                options={{ title: '그룹 활동' }}
            />
        </Stack.Navigator>
    );
}

// Friend Stack Navigator
function FriendStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="FriendList"
                component={FriendListScreen}
                options={{ title: '친구' }}
            />
            <Stack.Screen
                name="FriendDetail"
                component={FriendDetailScreen}
                options={{ title: '친구 정보' }}
            />
            <Stack.Screen
                name="AddFriend"
                component={AddFriendScreen}
                options={{ title: '친구 추가' }}
            />
            <Stack.Screen
                name="FriendRequest"
                component={FriendRequestScreen}
                options={{ title: '친구 요청' }}
            />
        </Stack.Navigator>
    );
}

// Chat Stack Navigator
function ChatStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{ title: '채팅' }}
            />
            <Stack.Screen
                name="ChatRoom"
                component={ChatRoomScreen}
                options={({ route }) => ({ title: route.params?.name || '채팅방' })}
            />
            <Stack.Screen
                name="VideoCall"
                component={VideoCallScreen}
                options={{
                    title: '화상 통화',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="FileShare"
                component={FileShareScreen}
                options={{ title: '파일 공유' }}
            />
        </Stack.Navigator>
    );
}

// Profile Stack Navigator
function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: '프로필' }}
            />
            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ title: '프로필 수정' }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: '설정' }}
            />
            <Stack.Screen
                name="Achievements"
                component={AchievementsScreen}
                options={{ title: '성취' }}
            />
        </Stack.Navigator>
    );
}

// Tab Navigator
function TabNavigator() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    title: '홈',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="StudyTab"
                component={StudyStack}
                options={{
                    title: '학습',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="GroupTab"
                component={GroupStack}
                options={{
                    title: '그룹',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="FriendTab"
                component={FriendStack}
                options={{
                    title: '친구',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="ChatTab"
                component={ChatStack}
                options={{
                    title: '채팅',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    title: '프로필',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
}

// Main Navigator
export default function Navigator() {
    const { state } = useApp();
    const { isAuthenticated } = state.auth;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <Stack.Screen
                    name="Auth"
                    component={AuthStack}
                    options={{
                        animationEnabled: false
                    }}
                />
            ) : (
                <Stack.Screen
                    name="Main"
                    component={TabNavigator}
                    options={{
                        animationEnabled: false
                    }}
                />
            )}
        </Stack.Navigator>
    );
}

// 유틸리티 함수: 현재 라우트에 따라 탭바 숨김 여부 결정
export function getTabBarVisibility(route) {
    const routeName = getFocusedRouteNameFromRoute(route);
    const hideOnScreens = ['VideoCall', 'ChatRoom'];
    return hideOnScreens.includes(routeName) ? false : true;
}