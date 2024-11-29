import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import {DefaultTheme, Provider as PaperProvider} from 'react-native-paper';
import theme from "./src/styles/theme";

// Auth Screens
import IntroScreen from './src/screens/auth/IntroScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindAccountScreen from './src/screens/auth/FindAccountScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';

// Home Stack
import HomeScreen from './src/screens/home/HomeScreen';
import NotificationsScreen from "./src/screens/home/NotificationsScreen";
import AchievementScreen from "./src/screens/home/AchievementScreen";
import LevelDetailScreen from "./src/screens/home/LevelDetailScreen";

// Community Stack
import StudyCommunityScreen from "./src/screens/community/study/StudyCommunityScreen";
import CreateQuestionScreen from "./src/screens/community/study/CreateQuestionScreen";
import QuestionDetailScreen from "./src/screens/community/study/QuestionDetailScreen";
import FileShareScreen from './src/screens/community/study/FileShareScreen';
import ChatAndFriendsScreen from "./src/screens/community/chat/ChatAndFriendsScreen";
import ChatListScreen from "./src/screens/community/chat/ChatListScreen";
import ChatRoomScreen from "./src/screens/community/chat/ChatRoomScreen";
import ChatRoomSettingsScreen from "./src/screens/community/chat/ChatRoomSettingsScreen";
import ChatBackupRestoreScreen from "./src/screens/community/chat/ChatBackupRestoreScreen";
import FriendListScreen from "./src/screens/community/friend/FriendListScreen";
import FriendProfileScreen from "./src/screens/community/friend/FriendProfileScreen";

// Personal Study Stack
import PersonalStudyDashboardScreen from './src/screens/personalStudy/PersonalStudyDashboardScreen';
import StudyGoalsScreen from './src/screens/personalStudy/StudyGoalsScreen';
import AddGoalScreen from './src/screens/personalStudy/AddGoalScreen';
import EditGoalScreen from './src/screens/personalStudy/EditGoalScreen';
import StudySessionScreen from './src/screens/personalStudy/StudySessionScreen';
import StudyAnalyticsScreen from './src/screens/personalStudy/StudyAnalyticsScreen';
import StudyFeedbackScreen from './src/screens/personalStudy/StudyFeedbackScreen';
import ScheduleScreen from './src/screens/personalStudy/ScheduleScreen';
import StudyMaterialDetailScreen from './src/screens/personalStudy/StudyMaterialDetailScreen';
import StudyMaterialsScreen from './src/screens/personalStudy/StudyMaterialsScreen';

// Group Study Stack
import GroupScreen from './src/screens/groupStudy/GroupScreen';
import GroupCreateScreen from './src/screens/groupStudy/GroupCreateScreen';
import GroupDetailScreen from './src/screens/groupStudy/GroupDetailScreen';
import GroupActivityScreen from './src/screens/groupStudy/GroupActivityScreen';
import GroupSettingsScreen from './src/screens/groupStudy/GroupSettingsScreen';
import MyGroupScreen from './src/screens/groupStudy/MyGroupScreen';
import MemberManageScreen from './src/screens/groupStudy/MemberManageScreen';
import MemberActivityScreen from './src/screens/groupStudy/MemberActivityScreen';
import MemberInviteScreen from './src/screens/groupStudy/MemberInviteScreen';
import MemberRequestScreen from './src/screens/groupStudy/MemberRequestScreen';
import MemberRoleScreen from './src/screens/groupStudy/MemberRoleScreen';
import MentoringScreen from './src/screens/groupStudy/MentoringScreen';
import RegisterMentorScreen from "./src/screens/groupStudy/RegisterMentorScreen";
import InviteMembersScreen from "./src/screens/groupStudy/InviteMembersScreen";

// MyPage Stack
import ProfileScreen from "./src/screens/mypage/profile/ProfileScreen";
import EditProfileScreen from "./src/screens/mypage/profile/EditProfileScreen";
import EditInfoScreen from "./src/screens/mypage/profile/EditInfoScreen";
import ChangeNameModal from "./src/screens/mypage/profile/ChangeNameModal";
import SocialAccountsScreen from "./src/screens/mypage/profile/SocialAccountsScreen";
import SettingsScreen from "./src/screens/mypage/settings/SettingsScreen";
import NotificationSettingsScreen from "./src/screens/mypage/settings/NotificationSettingsScreen";
import NotificationDetailScreen from "./src/screens/mypage/settings/NotificationDetailScreen";
import TimeSettingScreen from "./src/screens/mypage/settings/TimeSettingScreen";
import DisplayModeScreen from "./src/screens/mypage/settings/DisplayModeScreen";
import FontSizeScreen from "./src/screens/mypage/settings/FontSizeScreen";
import LanguageScreen from "./src/screens/mypage/settings/LanguageScreen";
import PrivacySettingScreen from "./src/screens/mypage/settings/PrivacySettingScreen";
import DataStorageScreen from "./src/screens/mypage/settings/DataStorageScreen";
import SettingsBackupScreen from "./src/screens/mypage/settings/SettingsBackupScreen";
import BackupScreen from "./src/screens/mypage/settings/BackupScreen";
import {Platform} from "react-native";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const PersonalStudyStack = createNativeStackNavigator();
const GroupStudyStack = createNativeStackNavigator();
const MyPageStack = createNativeStackNavigator();

const HomeNavigator = () => (
    <HomeStack.Navigator id="HomeStack">
        <HomeStack.Screen name="HomeMain" component={HomeScreen} />
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
        <HomeStack.Screen name="Achievement" component={AchievementScreen} />
        <HomeStack.Screen name="LevelDetail" component={LevelDetailScreen} />
    </HomeStack.Navigator>
);

const CommunityNavigator = () => (
    <CommunityStack.Navigator id="CommunityStack">
        <CommunityStack.Screen name="StudyCommunity" component={StudyCommunityScreen} />
        <CommunityStack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
        <CommunityStack.Screen name="QuestionDetail" component={QuestionDetailScreen} />
        <CommunityStack.Screen name="FileShare" component={FileShareScreen} />
        <CommunityStack.Screen name="ChatAndFriends" component={ChatAndFriendsScreen} />
        <CommunityStack.Screen name="ChatList" component={ChatListScreen} />
        <CommunityStack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <CommunityStack.Screen name="ChatRoomSettings" component={ChatRoomSettingsScreen} />
        <CommunityStack.Screen name="ChatBackupRestore" component={ChatBackupRestoreScreen} />
        <CommunityStack.Screen name="FriendList" component={FriendListScreen} />
        <CommunityStack.Screen name="FriendProfile" component={FriendProfileScreen} />
    </CommunityStack.Navigator>
);

const PersonalStudyNavigator = () => (
    <PersonalStudyStack.Navigator id="PersonalStudyStack">
        <PersonalStudyStack.Screen name="PersonalStudyDashboard" component={PersonalStudyDashboardScreen} />
        <PersonalStudyStack.Screen name="StudyGoals" component={StudyGoalsScreen} />
        <PersonalStudyStack.Screen name="AddGoal" component={AddGoalScreen} />
        <PersonalStudyStack.Screen name="EditGoal" component={EditGoalScreen} />
        <PersonalStudyStack.Screen name="StudySession" component={StudySessionScreen} />
        <PersonalStudyStack.Screen name="StudyAnalytics" component={StudyAnalyticsScreen} />
        <PersonalStudyStack.Screen name="StudyFeedback" component={StudyFeedbackScreen} />
        <PersonalStudyStack.Screen name="Schedule" component={ScheduleScreen} />
        <PersonalStudyStack.Screen name="StudyMaterialDetail" component={StudyMaterialDetailScreen} />
        <PersonalStudyStack.Screen name="StudyMaterials" component={StudyMaterialsScreen} />
    </PersonalStudyStack.Navigator>
);

const GroupStudyNavigator = () => (
    <GroupStudyStack.Navigator id="GroupStudyStack">
        <GroupStudyStack.Screen name="GroupMain" component={GroupScreen} />
        <GroupStudyStack.Screen name="GroupCreate" component={GroupCreateScreen} />
        <GroupStudyStack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <GroupStudyStack.Screen name="GroupActivity" component={GroupActivityScreen} />
        <GroupStudyStack.Screen name="GroupSettings" component={GroupSettingsScreen} />
        <GroupStudyStack.Screen name="MyGroup" component={MyGroupScreen} />
        <GroupStudyStack.Screen name="MemberManage" component={MemberManageScreen} />
        <GroupStudyStack.Screen name="MemberActivity" component={MemberActivityScreen} />
        <GroupStudyStack.Screen name="MemberInvite" component={MemberInviteScreen} />
        <GroupStudyStack.Screen name="MemberRequest" component={MemberRequestScreen} />
        <GroupStudyStack.Screen name="MemberRole" component={MemberRoleScreen} />
        <GroupStudyStack.Screen name="Mentoring" component={MentoringScreen} />
        <GroupStudyStack.Screen name="RegisterMentor" component={RegisterMentorScreen} />
        <GroupStudyStack.Screen name="InviteMembers" component={InviteMembersScreen} />
    </GroupStudyStack.Navigator>
);

const MyPageNavigator = () => (
    <MyPageStack.Navigator id="MyPageStack">
        <MyPageStack.Screen name="Profile" component={ProfileScreen} />
        <MyPageStack.Screen name="EditProfile" component={EditProfileScreen} />
        <MyPageStack.Screen name="EditInfo" component={EditInfoScreen} />
        <MyPageStack.Screen name="ChangeName" component={ChangeNameModal} />
        <MyPageStack.Screen name="SocialAccounts" component={SocialAccountsScreen} />
        <MyPageStack.Screen name="Settings" component={SettingsScreen} />
        <MyPageStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <MyPageStack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
        <MyPageStack.Screen name="TimeSetting" component={TimeSettingScreen} />
        <MyPageStack.Screen name="DisplayMode" component={DisplayModeScreen} />
        <MyPageStack.Screen name="FontSize" component={FontSizeScreen} />
        <MyPageStack.Screen name="Language" component={LanguageScreen} />
        <MyPageStack.Screen name="PrivacySetting" component={PrivacySettingScreen} />
        <MyPageStack.Screen name="DataStorage" component={DataStorageScreen} />
        <MyPageStack.Screen name="SettingsBackup" component={SettingsBackupScreen} />
        <MyPageStack.Screen name="Backup" component={BackupScreen} />
    </MyPageStack.Navigator>
);

const TabNavigator = () => (
    <Tab.Navigator
        id="MainTab"
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                switch (route.name) {
                    case '홈':
                        iconName = 'home';
                        break;
                    case '커뮤니티':
                        iconName = 'users';
                        break;
                    case '개인 학습':
                        iconName = 'book-open';
                        break;
                    case '그룹 학습':
                        iconName = 'users';
                        break;
                    case '마이페이지':
                        iconName = 'user';
                        break;
                }
                return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.inactive,
            headerShown: false,
            tabBarStyle: {
                ...Platform.select({
                    ios: theme.shadows.ios.small,
                    android: theme.shadows.android.small
                }),
                backgroundColor: theme.colors.background
            }
        })}
    >
        <Tab.Screen name="홈" component={HomeNavigator} />
        <Tab.Screen name="커뮤니티" component={CommunityNavigator} />
        <Tab.Screen name="개인 학습" component={PersonalStudyNavigator} />
        <Tab.Screen name="그룹 학습" component={GroupStudyNavigator} />
        <Tab.Screen name="마이페이지" component={MyPageNavigator} />
    </Tab.Navigator>
);

const App = () => {
    return (
        <PaperProvider theme={theme}>
            <NavigationContainer>
                <Stack.Navigator
                    id="RootStack"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.colors.background }
                    }}
                >
                    <Stack.Screen name="Intro" component={IntroScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="FindAccount" component={FindAccountScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    <Stack.Screen name="MainTab" component={TabNavigator} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
};

export default App;