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
import ChangeNameModal from "./src/screens/community/chat/ChangeNameModal";
import ChatBackupRestoreScreen from "./src/screens/community/chat/ChatBackupRestoreScreen";
import FriendListScreen from "./src/screens/community/friend/FriendListScreen";
import FriendProfileScreen from "./src/screens/community/friend/FriendProfileScreen";
import EditRoomNameScreen from "./src/screens/community/chat/EditRoomNameScreen";
import ParticipantManagementScreen from "./src/screens/community/chat/ParticipantManagementScreen";
import EditQuestionScreen from "./src/screens/community/study/EditQuestionScreen";
import MentorDetailScreen from "./src/screens/community/study/MentorDetailScreen";
import RegisterMentorScreen from './src/screens/community/study/RegisterMentorScreen';
import EditMentorProfileScreen from './src/screens/community/study/EditMentorProfileScreen';
import ChatListContent from './src/screens/community/chat/ChatListContent';
import AddFriendScreen from './src/screens/community/friend/AddFriendScreen';
import FriendsListContent from './src/screens/community/friend/FriendsListContent';
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
import CreateGroupScreen from './src/screens/groupStudy/CreateGroupScreen';
import GroupDetailScreen from './src/screens/groupStudy/GroupDetailScreen';
import GroupActivityScreen from './src/screens/groupStudy/GroupActivityScreen';
import GroupSettingsScreen from './src/screens/groupStudy/GroupSettingsScreen';
import MemberManageScreen from './src/screens/groupStudy/MemberManageScreen';
import MemberActivityScreen from './src/screens/groupStudy/MemberActivityScreen';
import MemberInviteScreen from './src/screens/groupStudy/MemberInviteScreen';
import MemberRequestScreen from './src/screens/groupStudy/MemberRequestScreen';
import MemberRoleScreen from './src/screens/groupStudy/MemberRoleScreen';
import InviteMembersScreen from "./src/screens/groupStudy/InviteMembersScreen";
import InviteResponseScreen from "./src/screens/groupStudy/InviteResponseScreen";
import MemberKickScreen from "./src/screens/groupStudy/MemberKickScreen";
// import MentoringScreen from './src/screens/groupStudy/MentoringScreen';

// MyPage Stack EditProfile은 미사용
import ProfileScreen from "./src/screens/mypage/profile/ProfileScreen";
import EditInfoScreen from "./src/screens/mypage/profile/EditInfoScreen";
import SocialAccountsScreen from "./src/screens/mypage/profile/SocialAccountsScreen";
import SettingsScreen from "./src/screens/mypage/settings/SettingsScreen";
import NotificationSettingsScreen from "./src/screens/mypage/settings/NotificationSettingsScreen";
import NotificationDetailScreen from "./src/screens/mypage/settings/NotificationDetailScreen";
import TimeSettingScreen from "./src/screens/mypage/settings/TimeSettingScreen";
import DisplayModeScreen from "./src/screens/mypage/settings/DisplayModeScreen";
import FontSizeScreen from "./src/screens/mypage/settings/FontSizeScreen";
import PrivacySettingScreen from "./src/screens/mypage/settings/PrivacySettingScreen";
import DataStorageScreen from "./src/screens/mypage/settings/DataStorageScreen";
import SettingsBackupScreen from "./src/screens/mypage/settings/SettingsBackupScreen";
import BackupScreen from "./src/screens/mypage/settings/BackupScreen";
import {Platform} from "react-native";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = createNativeStackNavigator()
const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const PersonalStudyStack = createNativeStackNavigator();
const GroupStudyStack = createNativeStackNavigator();
const MyPageStack = createNativeStackNavigator();

const AuthNavigator = () => (
    <AuthStack.Navigator id="AuthStack" screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Intro" component={IntroScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="SignUp" component={SignUpScreen} />
        <AuthStack.Screen name="FindAccount" component={FindAccountScreen} />
        <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
);

const HomeNavigator = () => (
    <HomeStack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="HomeMain" component={HomeScreen} />
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
        <HomeStack.Screen name="Achievement" component={AchievementScreen} />
        <HomeStack.Screen name="LevelDetail" component={LevelDetailScreen} />
        <HomeStack.Screen name="InviteResponse" component={InviteResponseScreen} />
    </HomeStack.Navigator>
);

const ChatNavigator = () => (
    <ChatStack.Navigator id="ChatStack" screenOptions={{ headerShown: false }}>
        <ChatStack.Screen name="ChatAndFriends" component={ChatAndFriendsScreen} />
        <ChatStack.Screen name="ChatList" component={ChatListScreen} />
        <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <ChatStack.Screen name="ChatRoomSettings" component={ChatRoomSettingsScreen} />
        <ChatStack.Screen name="ChatBackupRestore" component={ChatBackupRestoreScreen} />
        <ChatStack.Screen name="ChangeName" component={ChangeNameModal} />
        <ChatStack.Screen name="ParticipantManagement" component={ParticipantManagementScreen} />
        <ChatStack.Screen name="ChatListContent" component={ChatListContent} />
        <ChatStack.Screen name="AddFriend" component={AddFriendScreen} />
        <ChatStack.Screen name="FriendProfile" component={FriendProfileScreen} />
        <ChatStack.Screen name="FriendsListContent" component={FriendsListContent} />
        <ChatStack.Screen name="FriendList" component={FriendListScreen} />
    </ChatStack.Navigator>
);

const CommunityNavigator = () => (
    <CommunityStack.Navigator id="CommunityStack" screenOptions={{ headerShown: false }}>
        <CommunityStack.Screen name="StudyCommunity" component={StudyCommunityScreen} />
        <CommunityStack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
        <CommunityStack.Screen name="QuestionDetail" component={QuestionDetailScreen} />
        <CommunityStack.Screen name="FileShare" component={FileShareScreen} />
        <CommunityStack.Screen name="FriendList" component={FriendListScreen} />
        <CommunityStack.Screen name="FriendProfile" component={FriendProfileScreen} />
        <CommunityStack.Screen name="EditRoomName" component={EditRoomNameScreen} />
        <CommunityStack.Screen name="ParticipantManagement" component={ParticipantManagementScreen} />
        <CommunityStack.Screen name="EditQuestion" component={EditQuestionScreen} />
        <CommunityStack.Screen name="MentorDetail" component={MentorDetailScreen} />
        <CommunityStack.Screen name="RegisterMentor" component={RegisterMentorScreen} />
        <CommunityStack.Screen name="EditMentorProfile" component={EditMentorProfileScreen} />
    </CommunityStack.Navigator>
);

const PersonalStudyNavigator = () => (
    <PersonalStudyStack.Navigator id="PersonalStudyStack" screenOptions={{ headerShown: false }}>
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
    <GroupStudyStack.Navigator id="GroupStudyStack" screenOptions={{ headerShown: false }}>
        <GroupStudyStack.Screen name="GroupMain" component={GroupScreen} />
        <GroupStudyStack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <GroupStudyStack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <GroupStudyStack.Screen name="GroupActivity" component={GroupActivityScreen} />
        <GroupStudyStack.Screen name="GroupSettings" component={GroupSettingsScreen} />
        <GroupStudyStack.Screen name="MemberManage" component={MemberManageScreen} />
        <GroupStudyStack.Screen name="MemberActivity" component={MemberActivityScreen} />
        <GroupStudyStack.Screen name="MemberInvite" component={MemberInviteScreen} />
        <GroupStudyStack.Screen name="MemberRequest" component={MemberRequestScreen} />
        <GroupStudyStack.Screen name="MemberRole" component={MemberRoleScreen} />
        <GroupStudyStack.Screen name="InviteMembers" component={InviteMembersScreen} />
        <GroupStudyStack.Screen name="InviteResponse" component={InviteResponseScreen} />
        <GroupStudyStack.Screen name="MemberKick" component={MemberKickScreen} />
        {/* <GroupStudyStack.Screen name="Mentoring" component={MentoringScreen} /> */}
    </GroupStudyStack.Navigator>
);

const MyPageNavigator = () => (
    <MyPageStack.Navigator id="MyPageStack" screenOptions={{ headerShown: false }}>
        <MyPageStack.Screen name="Profile" component={ProfileScreen} />
        <MyPageStack.Screen name="EditInfo" component={EditInfoScreen} />
        <MyPageStack.Screen name="SocialAccounts" component={SocialAccountsScreen} />
        <MyPageStack.Screen name="Settings" component={SettingsScreen} />
        <MyPageStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <MyPageStack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
        <MyPageStack.Screen name="TimeSetting" component={TimeSettingScreen} />
        <MyPageStack.Screen name="DisplayMode" component={DisplayModeScreen} />
        <MyPageStack.Screen name="FontSize" component={FontSizeScreen} />
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
                    case '채팅':
                        iconName = 'message-circle';
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
                    // ios: theme.shadows.ios.small,
                    // android: theme.shadows.android.small
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                    },
                    android: {
                        elevation: 5,
                    }
                }),
                backgroundColor: theme.colors.background
            }
        })}
    >
        <Tab.Screen name="홈" component={HomeNavigator} />
        <Tab.Screen name="채팅" component={ChatNavigator} />
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
                    initialRouteName="Intro"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.colors.background }
                    }}
                >
                    {/* MainTab을 마지막에 배치 */}
                    <Stack.Screen name="Intro" component={IntroScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="FindAccount" component={FindAccountScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    <Stack.Screen
                        name="MainTab"
                        component={TabNavigator}
                        options={{
                            gestureEnabled: false,
                            headerLeft: null
                        }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
};

export default App;