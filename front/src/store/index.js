import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';
import friendReducer from './slices/friendSlice';

const store = configureStore({
    reducer: {
        chat: chatReducer,
        auth: authReducer,
        friend: friendReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // 소켓 객체나 파일 객체 등 직렬화 불가능한 데이터 무시
                ignoredActions: ['socket/connect', 'socket/disconnect'],
                ignoredPaths: ['socket.instance']
            }
        }),
    devTools: process.env.NODE_ENV !== 'production'
});

export default store;