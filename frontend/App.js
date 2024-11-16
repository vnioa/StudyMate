// App.js
import React, { useEffect } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import TabNavigator from './src/navigation/TabNavigator';
import { navigationTheme } from './src/navigation/navigationConfig';
import { useAppState } from './src/features/home/hooks/useAppState';
import { useSocket } from './src/features/social/hooks/useSocket';

// 개발 환경에서 특정 경고 무시
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Warning: Failed prop type',
  'Required cycle:'
]);

const AppContent = () => {
  const { initializeApp } = useAppState();
  const { initializeSocket } = useSocket();

  // 앱 초기화
  useEffect(() => {
    initializeApp();
    initializeSocket();
  }, [initializeApp, initializeSocket]);

  return (
      <NavigationContainer theme={navigationTheme}>
        <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent={Platform.OS === 'android'}
        />
        <TabNavigator />
      </NavigationContainer>
  );
};

const App = () => {
  return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
  );
};

// 개발 환경 설정
if (__DEV__) {
  // 성능 모니터링 설정
  const ignoreWarns = [
    'VirtualizedLists should never be nested',
    'Warning: Failed prop type',
    'Required cycle:'
  ];

  const warn = console.warn;
  console.warn = (...arg) => {
    for (const warning of ignoreWarns) {
      if (arg[0].startsWith(warning)) {
        return;
      }
    }
    warn(...arg);
  };

  // 개발 환경에서 모든 로그 무시
  LogBox.ignoreAllLogs();
}

export default App;