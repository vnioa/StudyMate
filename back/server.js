const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./src/utils/error.utils');
const { initializeDatabase, dbUtils } = require('./src/config/database.config');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 서버 시작 함수
const startServer = async () => {
    try {
        // 데이터베이스 초기화
        await initializeDatabase();

        // 미들웨어 설정
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // 라우트 설정
        app.use('/achievement', require('./src/routes/achievement.routes'));
        app.use('/auth', require('./src/routes/auth.routes'));
        app.use('/backup', require('./src/routes/backup.routes'));
        app.use('/chat', require('./src/routes/chat.routes'));
        app.use('/community', require('./src/routes/community.routes'));
        app.use('/feedback', require('./src/routes/feedback.routes'));
        app.use('/file', require('./src/routes/file.routes'));
        app.use('/friends', require('./src/routes/friends.routes'));
        app.use('/goal', require('./src/routes/goal.routes'));
        app.use('/group', require('./src/routes/group.routes'));
        app.use('/invite', require('./src/routes/invite.routes'));
        app.use('/level', require('./src/routes/level.routes'));
        app.use('/material', require('./src/routes/material.routes'));
        app.use('/mentor', require('./src/routes/mentor.routes'));
        app.use('/notification', require('./src/routes/notification.routes'));
        app.use('/profile', require('./src/routes/profile.routes'));
        app.use('/settings', require('./src/routes/settings.routes'));
        app.use('/storage', require('./src/routes/storage.routes'));
        app.use('/study', require('./src/routes/study.routes'));
        app.use('/user', require('./src/routes/user.routes'));

        // 404 에러 처리
        app.use((req, res, next) => {
            res.status(404).json({
                success: false,
                message: '요청한 리소스를 찾을 수 없습니다.'
            });
        });

        // 에러 핸들러 미들웨어
        app.use(errorHandler);

        // 서버 시작
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        // 프로세스 종료 처리
        process.on('SIGINT', async () => {
            await dbUtils.closePool();
            process.exit(0);
        });

        process.on('unhandledRejection', (err) => {
            console.error('Unhandled Promise Rejection:', err);
            // 치명적이지 않은 에러는 프로세스를 종료하지 않음
        });

    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

// 서버 시작
startServer();