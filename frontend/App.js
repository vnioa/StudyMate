import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KakaoLoginScreen from './src/screens/auth/KakaoLoginScreen';
import NaverLoginScreen from './src/screens/auth/NaverLoginScreen '; 
import GoogleloginScreen from './src/screens/auth/GoogleloginScreen'; 
// Auth Screens
import IntroScreen from './src/screens/auth/IntroScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import FindAccountScreen from './src/screens/auth/FindAccountScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';

// Main Screens
import HomeScreen from './src/screens/home/HomeScreen';
import ChatListScreen from './src/screens/chat/ChatListScreen';
import PersonalStudyDashboardScreen from './src/screens/personalStudy/PersonalStudyDashboardScreen';
import GroupScreen from './src/screens/groupStudy/GroupScreen';
import ProfileScreen from './src/screens/mypage/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
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

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4A90E2',
                tabBarInactiveTintColor: '#666',
                headerShown: true
            })}
        >
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="커뮤니티" component={ChatListScreen} />
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
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <NavigationContainer>
            <Stack.Navigator
                id="AuthNavigator"
                screenOptions={{ headerShown: false }}
                initialRouteName={isAuthenticated ? "MainTab" : "Intro"}
            >
                {!isAuthenticated ? (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Intro" component={IntroScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="FindAccount" component={FindAccountScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                ) : (
                    // Main Stack with Tab Navigator
                    <Stack.Screen
                        name="MainTab"
                        component={TabNavigator}
                        options={{ gestureEnabled: false }}
                    />
                )}
                {/* KakaoLoginScreen을 AuthStack 내에서 정의하고, 로그인 후 다른 페이지로 이동 */}
                <Stack.Screen name="KakaoLoginScreen" component={KakaoLoginScreen} />
                <Stack.Screen name="NaverLoginScreen" component={NaverLoginScreen} />
                <Stack.Screen name="GoogleloginScreen" component={GoogleloginScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
