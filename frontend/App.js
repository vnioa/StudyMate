// App.js

import React, { useEffect } from 'react';
import { LogBox, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import { AppProvider } from './src/contexts/AppContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import Navigator from './src/navigation/Navigator';
import { theme } from './src/utils/styles';
import api from './src/services/api';

// 폰트 사전 로드
const loadFonts = () => {
  return Font.loadAsync({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });
};

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 스플래시 스크린 설정
const prepareSplashScreen = async () => {
  try {
    await SplashScreen.preventAutoHideAsync();
  } catch (e) {
    console.warn('Error preventing splash screen auto hide:', e);
  }
};

// 스플래시 스크린 초기 설정 실행
(async () => {
  try {
    await prepareSplashScreen();
  } catch (error) {
    console.warn('Failed to prepare splash screen:', error);
  }
})();

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 경고 무시 설정
        LogBox.ignoreLogs([
          'ViewPropTypes will be removed',
          'ColorPropType will be removed',
          'Async Storage has been extracted from react-native',
        ]);

        // 앱 초기화 작업 병렬 처리
        await Promise.all([
          loadFonts(),
          api.initialize(),
          requestNotificationPermission(),
          new Promise(resolve => setTimeout(resolve, 2000)), // 최소 스플래시 표시 시간
        ]);

        // 스플래시 스크린 숨김
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('App initialization failed:', error);
        // 에러가 발생해도 스플래시 스크린은 숨김
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    };

    // 초기화 함수 실행 및 프로미스 처리
    const init = async () => {
      try {
        await initializeApp();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();
  }, []);

  // 푸시 알림 권한 요청
  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: theme.colors.primary.main,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync();
        await api.user.updatePushToken(token.data);
      }
    } catch (error) {
      console.error('Failed to get push token:', error);
    }
  };

  return (
      <NavigationContainer
          theme={{
            colors: {
              primary: theme.colors.primary.main,
              background: theme.colors.background.primary,
              card: theme.colors.background.primary,
              text: theme.colors.text.primary,
              border: theme.colors.border,
              notification: theme.colors.primary.main,
            },
          }}
      >
        <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background.primary}
            translucent
        />
        <AppProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <Navigator />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </AppProvider>
      </NavigationContainer>
  );
}