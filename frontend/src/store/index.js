// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/slices/authSlice';
import chatReducer from '../features/social/store/slices/chatSlice';
import friendReducer from '../features/social/store/slices/friendSlice';
import messageReducer from '../features/social/store/slices/messageSlice';
import achievementReducer from '../features/home/store/slices/achievementSlice';
import goalReducer from '../features/home/store/slices/goalSlice';
import learningReducer from '../features/home/store/slices/learningSlice';
import studyGroupReducer from '../features/home/store/slices/studyGroupSlice';
import welcomeReducer from '../features/home/store/slices/welcomeSlice';

const rootReducer = {
    auth: authReducer,
    chat: chatReducer,
    friend: friendReducer,
    message: messageReducer,
    achievement: achievementReducer,
    goal: goalReducer,
    learning: learningReducer,
    studyGroup: studyGroupReducer,
    welcome: welcomeReducer
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['socket/connect', 'socket/disconnect'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.file'],
                // Ignore these paths in the state
                ignoredPaths: ['socket.instance']
            }
        }),
    devTools: process.env.NODE_ENV !== 'production'
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;