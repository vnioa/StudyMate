// App.js
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
import CommunityScreen from './src/screens/community/CommunityScreen';
import PersonalStudyScreen from './src/screens/personalStudy/PersonalStudyScreen';
import GroupStudyScreen from './src/screens/groupStudy/GroupStudyScreen';
import MyPageScreen from './src/screens/MyPageScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 네비게이터 컴포넌트
const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case '홈':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case '커뮤니티':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case '개인 학습':
                            iconName = focused ? 'book' : 'book-outline';
                            break;
                        case '그룹 학습':
                            iconName = focused ? 'people-circle' : 'people-circle-outline';
                            break;
                        case '마이페이지':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0066FF',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
            })}
        >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="커뮤니티" component={CommunityScreen} />
            <Tab.Screen name="개인 학습" component={PersonalStudyScreen} />
            <Tab.Screen name="그룹 학습" component={GroupStudyScreen} />
            <Tab.Screen name="마이페이지" component={MyPageScreen} />
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
                        gestureEnabled: false,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;