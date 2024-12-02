const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
require('winston-daily-rotate-file');

// Winston 로거 설정
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});

// 개발 환경에서는 콘솔 출력 추가
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// 민감 정보 필터링을 위한 필드 목록
const sensitiveFields = [
    'password',
    'token',
    'refreshToken',
    'authorization',
    'creditCard',
    'ssn',
    'accessToken',
    'secret'
];

// 데이터 정제 함수
const sanitizeData = (data) => {
    if (!data) return data;
    const sanitized = { ...data };

    sensitiveFields.forEach(field => {
        if (sanitized[field]) sanitized[field] = '***';
    });

    return sanitized;
};

// 메인 로거 미들웨어
const loggerMiddleware = (req, res, next) => {
    // 요청 고유 ID 생성
    req.requestId = uuidv4();
    const start = new Date();

    // 요청 정보 로깅
    const requestLog = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        headers: sanitizeData(req.headers),
        query: sanitizeData(req.query),
        body: sanitizeData(req.body),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || 'anonymous',
        timestamp: start.toISOString()
    };

    logger.info('Request', requestLog);

    // 응답 로깅을 위한 json 메서드 래핑
    const originalJson = res.json;
    res.json = function(body) {
        const duration = new Date() - start;

        // 응답 헤더에 성능 메트릭 추가
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Request-ID', req.requestId);

        // 응답 정보 로깅
        const responseLog = {
            requestId: req.requestId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            path: req.originalUrl,
            method: req.method,
            userId: req.user?.id || 'anonymous',
            timestamp: new Date().toISOString()
        };

        // 성능 모니터링
        if (duration > 1000) {
            logger.warn('Slow Request', {
                ...responseLog,
                type: 'SLOW_REQUEST'
            });
        }

        logger.info('Response', responseLog);
        return originalJson.call(this, body);
    };

    // 에러 로깅
    const logError = (err) => {
        logger.error('Error', {
            requestId: req.requestId,
            path: req.originalUrl,
            method: req.method,
            error: {
                name: err.name,
                message: err.message,
                code: err.code,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            },
            userId: req.user?.id || 'anonymous',
            timestamp: new Date().toISOString()
        });
    };

    // 에러 이벤트 리스너 등록
    res.on('error', logError);

    // 처리되지 않은 예외 처리
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
            reason,
            promise,
            timestamp: new Date().toISOString()
        });
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            error,
            timestamp: new Date().toISOString()
        });
    });

    next();
};

module.exports = loggerMiddleware;