import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import IntroScreen from './src/screens/IntroScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import FindIdPasswordScreen from './src/screens/FindIdPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Create Stack Navigator
const Stack = createStackNavigator();

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="IntroScreen" screenOptions={{ headerShown: false }}>
                {/* Intro Screen */}
                <Stack.Screen name="IntroScreen" component={IntroScreen} />

                {/* Login Screen */}
                <Stack.Screen name="LoginScreen" component={LoginScreen} />

                {/* Signup Screen */}
                <Stack.Screen name="SignupScreen" component={SignupScreen} />

                {/* Find ID/Password Screen */}
                <Stack.Screen name="FindIdPasswordScreen" component={FindIdPasswordScreen} />

                {/* Reset Password Screen */}
                <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;