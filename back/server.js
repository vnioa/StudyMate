const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// 라우터 임포트
const apiRouter = require('./src/routes/api');
const userRouter = require('./src/routes/user/user.routes');

// 앱 초기화
const app = express();
const PORT = process.env.PORT || 3002; 

// 미들웨어 설정
app.use(helmet()); // 보안 헤더 설정
app.use(morgan('dev')); // 로깅
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 설정
app.use('/api', apiRouter);
app.use('/api/users', userRouter);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});



// 프로세스 에러 핸들링
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
    
});
app.listen(3002, () => {
    console.log('Server running on port 3002');
});