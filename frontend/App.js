import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 스크린 컴포넌트 import
import IntroScreen from './src/screens/auth/IntroScreen';
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import FindAccountScreen from "./src/screens/auth/FindAccountScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import ChatListScreen from './src/screens/chat/ChatListScreen';
import DashboardScreen from './src/screens/personalStudy/DashboardScreen';
import GroupScreen from './src/screens/groupStudy/GroupScreen';
import ProfileScreen from './src/screens/mypage/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = {
                        '홈': focused ? 'home' : 'home-outline',
                        '커뮤니티': focused ? 'people' : 'people-outline',
                        '개인 학습': focused ? 'book' : 'book-outline',
                        '그룹 학습': focused ? 'people-circle' : 'people-circle-outline',
                        '마이페이지': focused ? 'person' : 'person-outline'
                    }[route.name];

                    return <Ionicons name={iconName} size={size} color={color} />;
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
            <Tab.Screen name="커뮤니티" component={ChatListScreen} />
            <Tab.Screen name="개인 학습" component={DashboardScreen} />
            <Tab.Screen name="그룹 학습" component={GroupScreen} />
            <Tab.Screen name="마이페이지" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Intro"
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#fff' }
                }}
            >
                <Stack.Screen name="Intro" component={IntroScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="FindAccount" component={FindAccountScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen
                    name="MainTab"
                    component={TabNavigator}
                    options={{
                        headerShown: false,
                        gestureEnabled: false
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;