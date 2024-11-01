import React from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/home/HomeScreen';
import {ChatListScreen} from "./screens/chat/ChatListScreen";
import PersonalStudyMainScreen from './screens/PersonalStudyMainScreen';
import GroupStudyMainScreen from './screens/group/GroupStudyMainScreen';
import MyPageMainScreen from './screens/mypage/MyPageMainScreen';
import IntroScreen from './screens/home/IntroScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import FindIdPasswordScreen from './screens/auth/FindIdPasswordScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';

// Stack Navigator for intro, login, signup and related screens
const Stack = createStackNavigator();

// Bottom Tab Navigator for the main screens after login
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
      <Tab.Navigator>
        <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: () => (
                  <Image
                      source={require('./assets/home-office.png')}
                      style={{ width: 24, height: 24 }}
                  />
              ),
            }}
        />
        <Tab.Screen
            name="Chat"
            component={ChatListScreen}
            options={{
              tabBarIcon: () => (
                  <Image
                      source={require('./assets/chat.png')}
                      style={{ width: 24, height: 24 }}
                  />
              ),
            }}
        />
        <Tab.Screen
            name="My Study"
            component={PersonalStudyMainScreen}
            options={{
              tabBarIcon: () => (
                  <Image
                      source={require('./assets/studying.png')}
                      style={{ width: 24, height: 24 }}
                  />
              ),
            }}
        />
        <Tab.Screen
            name="Group"
            component={GroupStudyMainScreen}
            options={{
              tabBarIcon: () => (
                  <Image
                      source={require('./assets/work-group.png')}
                      style={{ width: 24, height: 24 }}
                  />
              ),
            }}
        />
        <Tab.Screen
            name="My Page"
            component={MyPageMainScreen}
            options={{
              tabBarIcon: () => (
                  <Image
                      source={require('./assets/profile.png')}
                      style={{ width: 24, height: 24 }}
                  />
              ),
            }}
        />
      </Tab.Navigator>
  );
};

const App = () => {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="IntroScreen">
          <Stack.Screen
              name="IntroScreen"
              component={IntroScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="SignupScreen"
              component={SignupScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="FindIdPasswordScreen"
              component={FindIdPasswordScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="ResetPasswordScreen"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
          />
          <Stack.Screen
              name="HomeScreen"
              component={MainTabNavigator}
              options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

export default App;
