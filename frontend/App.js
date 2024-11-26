import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { authAPI } from './src/services/api';

// 스크린 컴포넌트 import
import IntroScreen from './src/screens/auth/IntroScreen';
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import FindAccountScreen from "./src/screens/auth/FindAccountScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import ChatListScreen from './src/screens/chat/ChatListScreen';
import PersonalStudyDashboardScreen from './src/screens/personalStudy/PersonalStudyDashboardScreen';
import GroupScreen from './src/screens/groupStudy/GroupScreen';
import ProfileScreen from './src/screens/mypage/ProfileScreen';

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
                    <Stack.Screen
                        name="MainTab"
                        component={TabNavigator}
                        options={{
                            headerShown: false,
                            gestureEnabled: false
                        }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
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
});

export default App;