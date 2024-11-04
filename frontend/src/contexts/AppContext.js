// src/contexts/AppContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// 초기 상태
const initialState = {
    // 인증 상태
    auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: true,
    },
    // 학습 상태
    study: {
        currentSession: null,
        timer: {
            isRunning: false,
            timeLeft: 0,
            mode: 'study', // 'study' | 'break'
        },
        statistics: {
            todayStudyTime: 0,
            weeklyStudyTime: 0,
            totalStudyTime: 0,
        },
        materials: [],
        recentQuizzes: [],
    },
    // 그룹 상태
    group: {
        myGroups: [],
        currentGroup: null,
        groupInvites: [],
    },
    // 채팅 상태
    chat: {
        conversations: [],
        currentChat: null,
        unreadCount: 0,
    },
    // 친구 상태
    friends: {
        friendList: [],
        pendingRequests: [],
        onlineFriends: [],
    },
    // 앱 상태
    app: {
        isLoading: false,
        error: null,
        notification: null,
        theme: 'light',
        language: 'ko',
    }
};

// 액션 타입
const ActionTypes = {
    // 인증 관련
    SET_AUTH: 'SET_AUTH',
    LOGOUT: 'LOGOUT',
    // 학습 관련
    UPDATE_STUDY_SESSION: 'UPDATE_STUDY_SESSION',
    UPDATE_TIMER: 'UPDATE_TIMER',
    UPDATE_STATISTICS: 'UPDATE_STATISTICS',
    // 그룹 관련
    UPDATE_GROUPS: 'UPDATE_GROUPS',
    SET_CURRENT_GROUP: 'SET_CURRENT_GROUP',
    // 채팅 관련
    UPDATE_CONVERSATIONS: 'UPDATE_CONVERSATIONS',
    SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
    // 친구 관련
    UPDATE_FRIENDS: 'UPDATE_FRIENDS',
    UPDATE_FRIEND_REQUESTS: 'UPDATE_FRIEND_REQUESTS',
    // 앱 상태 관련
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_NOTIFICATION: 'SET_NOTIFICATION',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

// 리듀서
function appReducer(state, action) {
    switch (action.type) {
        // 인증 관련
        case ActionTypes.SET_AUTH:
            return {
                ...state,
                auth: {
                    ...state.auth,
                    ...action.payload,
                },
            };
        case ActionTypes.LOGOUT:
            return {
                ...initialState,
                app: state.app,
            };

        // 학습 관련
        case ActionTypes.UPDATE_STUDY_SESSION:
            return {
                ...state,
                study: {
                    ...state.study,
                    currentSession: action.payload,
                },
            };
        case ActionTypes.UPDATE_TIMER:
            return {
                ...state,
                study: {
                    ...state.study,
                    timer: {
                        ...state.study.timer,
                        ...action.payload,
                    },
                },
            };
        case ActionTypes.UPDATE_STATISTICS:
            return {
                ...state,
                study: {
                    ...state.study,
                    statistics: {
                        ...state.study.statistics,
                        ...action.payload,
                    },
                },
            };

        // 그룹 관련
        case ActionTypes.UPDATE_GROUPS:
            return {
                ...state,
                group: {
                    ...state.group,
                    myGroups: action.payload,
                },
            };
        case ActionTypes.SET_CURRENT_GROUP:
            return {
                ...state,
                group: {
                    ...state.group,
                    currentGroup: action.payload,
                },
            };

        // 채팅 관련
        case ActionTypes.UPDATE_CONVERSATIONS:
            return {
                ...state,
                chat: {
                    ...state.chat,
                    conversations: action.payload,
                },
            };
        case ActionTypes.SET_CURRENT_CHAT:
            return {
                ...state,
                chat: {
                    ...state.chat,
                    currentChat: action.payload,
                },
            };

        // 친구 관련
        case ActionTypes.UPDATE_FRIENDS:
            return {
                ...state,
                friends: {
                    ...state.friends,
                    friendList: action.payload,
                },
            };
        case ActionTypes.UPDATE_FRIEND_REQUESTS:
            return {
                ...state,
                friends: {
                    ...state.friends,
                    pendingRequests: action.payload,
                },
            };

        // 앱 상태 관련
        case ActionTypes.SET_LOADING:
            return {
                ...state,
                app: {
                    ...state.app,
                    isLoading: action.payload,
                },
            };
        case ActionTypes.SET_ERROR:
            return {
                ...state,
                app: {
                    ...state.app,
                    error: action.payload,
                },
            };
        case ActionTypes.SET_NOTIFICATION:
            return {
                ...state,
                app: {
                    ...state.app,
                    notification: action.payload,
                },
            };
        case ActionTypes.UPDATE_SETTINGS:
            return {
                ...state,
                app: {
                    ...state.app,
                    ...action.payload,
                },
            };

        default:
            return state;
    }
}

// Context 생성
const AppContext = createContext();

// Context Provider
export function AppContextProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 앱 초기화
    useEffect(() => {
        initializeApp();
    }, []);

    // 앱 초기화 함수
    const initializeApp = async () => {
        try {
            dispatch({ type: ActionTypes.SET_LOADING, payload: true });

            // 저장된 토큰 확인
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // 토큰으로 사용자 정보 가져오기
                // API 호출 필요
                dispatch({
                    type: ActionTypes.SET_AUTH,
                    payload: {
                        isAuthenticated: true,
                        token,
                        loading: false,
                    },
                });
            }

            // 설정 불러오기
            const settings = await AsyncStorage.getItem('settings');
            if (settings) {
                dispatch({
                    type: ActionTypes.UPDATE_SETTINGS,
                    payload: JSON.parse(settings),
                });
            }
        } catch (error) {
            dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
    };

    // 유용한 함수들
    const actions = {
        // 인증 관련
        login: async (credentials) => {
            try {
                dispatch({ type: ActionTypes.SET_LOADING, payload: true });
                // API 호출 필요
                // const response = await loginAPI(credentials);
                await AsyncStorage.setItem('token', 'dummy-token');
                dispatch({
                    type: ActionTypes.SET_AUTH,
                    payload: {
                        isAuthenticated: true,
                        token: 'dummy-token',
                        user: { id: 1, name: 'Test User' },
                    },
                });
            } catch (error) {
                dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
                Alert.alert('로그인 실패', error.message);
            } finally {
                dispatch({ type: ActionTypes.SET_LOADING, payload: false });
            }
        },

        logout: async () => {
            try {
                await AsyncStorage.removeItem('token');
                dispatch({ type: ActionTypes.LOGOUT });
            } catch (error) {
                dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
            }
        },

        // 학습 관련
        startStudySession: (sessionData) => {
            dispatch({ type: ActionTypes.UPDATE_STUDY_SESSION, payload: sessionData });
        },

        updateTimer: (timerData) => {
            dispatch({ type: ActionTypes.UPDATE_TIMER, payload: timerData });
        },

        // 그룹 관련
        updateGroups: (groups) => {
            dispatch({ type: ActionTypes.UPDATE_GROUPS, payload: groups });
        },

        // 채팅 관련
        updateConversations: (conversations) => {
            dispatch({ type: ActionTypes.UPDATE_CONVERSATIONS, payload: conversations });
        },

        // 친구 관련
        updateFriends: (friends) => {
            dispatch({ type: ActionTypes.UPDATE_FRIENDS, payload: friends });
        },

        // 앱 설정 관련
        updateSettings: async (settings) => {
            try {
                await AsyncStorage.setItem('settings', JSON.stringify(settings));
                dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
            } catch (error) {
                dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
            }
        },

        // 에러 처리
        clearError: () => {
            dispatch({ type: ActionTypes.SET_ERROR, payload: null });
        },

        // 알림 처리
        showNotification: (message, type = 'info') => {
            dispatch({
                type: ActionTypes.SET_NOTIFICATION,
                payload: { message, type },
            });
            setTimeout(() => {
                dispatch({ type: ActionTypes.SET_NOTIFICATION, payload: null });
            }, 3000);
        },
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// Context 사용을 위한 커스텀 훅
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppContextProvider');
    }
    return context;
}

export default AppContext;