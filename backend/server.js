const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRouter = require('./routers/userRouter');
const authRouter = require('./routers/authRouter');
const studyRouter = require('./routers/studyRouter');
const settingsRouter = require('./routers/settingsRouter');
const notificationRouter = require('./routers/notificationRouter');
const materialRouter = require('./routers/materialRouter');
const groupRouter = require('./routers/groupRouter');
const feedbackRouter = require('./routers/feedbackRouter');
const storageRouter = require('./routers/storageRouter');
const levelRouter = require('./routers/levelRouter');
const inviteRouter = require('./routers/inviteRouter');
const achievementRouter = require('./routers/achievementRouter');
const backupRouter = require('./routers/backupRouter');
const chatRouter = require('./routers/chatRouter');
const communityRouter = require('./routers/communityRouter');
const mentorRouter = require('./routers/mentorRouter');
const profileRouter = require('./routers/profileRouter');
const fileRouter = require('./routers/fileRouter');
const friendsRouter = require('./routers/friendsRouter');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 라우터 설정
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/study', studyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/materials', materialRouter);
app.use('/api/groups', groupRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/storage', storageRouter);
app.use('/api/levels', levelRouter);
app.use('/api/invite', inviteRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/backup', backupRouter);
app.use('/api/chat', chatRouter);
app.use('/api/community', communityRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/profile', profileRouter);
app.use('/api/files', fileRouter);
app.use('/api/friends', friendsRouter);

// 404 에러 핸들링
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청하신 리소스를 찾을 수 없습니다.'
    });
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;