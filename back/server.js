const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 설정
app.use('/api/achievement', require('./src/routes/achievement'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/backup', require('./src/routes/backup'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/file', require('./src/routes/file'));
app.use('/api/friends', require('./src/routes/friends'));
app.use('/api/goal', require('./src/routes/goal'));
app.use('/api/group', require('./src/routes/group'));
app.use('/api/invite', require('./src/routes/invite'));
app.use('/api/level', require('./src/routes/level'));
app.use('/api/material', require('./src/routes/material'));
app.use('/api/mentor', require('./src/routes/mentor'));
app.use('/api/notification', require('./src/routes/notification'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/storage', require('./src/routes/storage'));
app.use('/api/study', require('./src/routes/study'));
app.use('/api/user', require('./src/routes/user'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버 실행 중: port${PORT}`);
})