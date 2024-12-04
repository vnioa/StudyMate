const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./src/utils/error.utils');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 데이터베이스 연결
const { initializeDatabase } = require('./src/config/db');
initializeDatabase();

// 라우트 설정
app.use('/api/achievement', require('./src/routes/achievement.routes'));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/backup', require('./src/routes/backup.routes'));
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/community', require('./src/routes/community.routes'));
app.use('/api/feedback', require('./src/routes/feedback.routes'));
app.use('/api/file', require('./src/routes/file.routes'));
app.use('/api/friends', require('./src/routes/friends.routes'));
app.use('/api/goal', require('./src/routes/goal.routes'));
app.use('/api/group', require('./src/routes/group.routes'));
app.use('/api/invite', require('./src/routes/invite.routes'));
app.use('/api/level', require('./src/routes/level.routes'));
app.use('/api/material', require('./src/routes/material.routes'));
app.use('/api/mentor', require('./src/routes/mentor.routes'));
app.use('/api/notification', require('./src/routes/notification.routes'));
app.use('/api/profile', require('./src/routes/profile.routes'));
app.use('/api/settings', require('./src/routes/settings.routes'));
app.use('/api/storage', require('./src/routes/storage.routes'));
app.use('/api/study', require('./src/routes/study.routes'));
app.use('/api/user', require('./src/routes/user.routes'));

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

// 예기치 않은 에러 처리
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});