// hooks/useAppState.js
import { useState, useEffect, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppState = () => {
    const [appState, setAppState] = useState(AppState.currentState);
    const [lastActive, setLastActive] = useState(Date.now());
    const [isBackground, setIsBackground] = useState(false);
    const [resumeDuration, setResumeDuration] = useState(0);

    // 앱 상태 변경 핸들러
    const handleAppStateChange = useCallback(async (nextAppState) => {
        const now = Date.now();

        // 앱이 활성화될 때
        if (nextAppState === 'active') {
            const lastActiveTime = await AsyncStorage.getItem('lastActiveTime');
            if (lastActiveTime) {
                const duration = now - parseInt(lastActiveTime);
                setResumeDuration(duration);

                // 30분 이상 비활성 상태였다면 세션 갱신 필요
                if (duration > 30 * 60 * 1000) {
                    // 세션 갱신 이벤트 발생
                    global.eventEmitter.emit('sessionExpired');
                }
            }
            setIsBackground(false);
        }
        // 앱이 백그라운드로 전환될 때
        else if (
            appState === 'active' &&
            (nextAppState === 'background' || nextAppState === 'inactive')
        ) {
            await AsyncStorage.setItem('lastActiveTime', now.toString());
            setLastActive(now);
            setIsBackground(true);

            // 백그라운드 전환 시 정리 작업
            await handleBackgroundTransition();
        }

        setAppState(nextAppState);
    }, [appState]);

    // 백그라운드 전환 시 처리할 작업
    const handleBackgroundTransition = async () => {
        try {
            // 진행 중인 작업 저장
            await AsyncStorage.setItem('appState', JSON.stringify({
                lastScreen: global.currentScreen,
                unsavedData: global.unsavedData,
                timestamp: Date.now()
            }));

            // 메모리 정리
            if (Platform.OS === 'ios') {
                // iOS 특정 정리 작업
            } else {
                // Android 특정 정리 작업
            }
        } catch (error) {
            console.error('Background transition error:', error);
        }
    };

    // 앱 상태 복구
    const restoreAppState = useCallback(async () => {
        try {
            const savedState = await AsyncStorage.getItem('appState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // 저장된 상태 복구 로직
                return parsedState;
            }
        } catch (error) {
            console.error('Restore app state error:', error);
        }
        return null;
    }, []);

    // 앱 상태 초기화
    const resetAppState = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('appState');
            await AsyncStorage.removeItem('lastActiveTime');
            setLastActive(Date.now());
            setResumeDuration(0);
            setIsBackground(false);
        } catch (error) {
            console.error('Reset app state error:', error);
        }
    }, []);

    // 앱 상태 리스너 등록
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // 컴포넌트 마운트 시 상태 복구
        restoreAppState();

        return () => {
            subscription.remove();
        };
    }, [handleAppStateChange]);

    // 메모리 사용량 모니터링
    useEffect(() => {
        let memoryMonitor;
        if (__DEV__) {
            memoryMonitor = setInterval(() => {
                const used = Platform.OS === 'ios' ?
                    global.performance?.memory?.usedJSHeapSize :
                    // Android의 경우 다른 메모리 측정 방법 사용
                    0;

                if (used > 100 * 1024 * 1024) { // 100MB 이상일 경우
                    console.warn('High memory usage detected');
                }
            }, 30000); // 30초마다 체크
        }

        return () => {
            if (memoryMonitor) {
                clearInterval(memoryMonitor);
            }
        };
    }, []);

    return {
        appState,
        lastActive,
        isBackground,
        resumeDuration,
        restoreAppState,
        resetAppState,
        // 앱 상태 관련 유틸리티 함수들
        utils: {
            // 앱이 활성 상태인지 확인
            isActive: () => appState === 'active',
            // 백그라운드 시간 계산
            getBackgroundDuration: () => isBackground ? Date.now() - lastActive : 0,
            // 세션 만료 여부 확인
            isSessionExpired: () => resumeDuration > 30 * 60 * 1000,
            // 마지막 활성 시간 포맷팅
            getLastActiveFormatted: () => new Date(lastActive).toLocaleString()
        }
    };
};

export default useAppState;