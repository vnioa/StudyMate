const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRouter = require('./routers/userRouter');
const myStudyRouter = require('./routers/myStudyRouter');
const chatRouter = require('./routers/chatRouter');
const communicationHubRouter = require('./routers/communicationHubRouter');
const friendManagementRouter = require('./routers/friendManagementRouter');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 라우터 설정
app.use('/api/users', userRouter);
app.use('/api/my-study', myStudyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/communication-hub', communicationHubRouter);
app.use('/api/friends', friendManagementRouter);

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
