const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    })
);

// 로그 레벨 정의
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// 로그 설정
const logger = winston.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: [
        // 에러 로그 파일
        new DailyRotateFile({
            level: 'error',
            filename: path.join('logs', 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        }),
        // 전체 로그 파일
        new DailyRotateFile({
            filename: path.join('logs', 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join('logs', 'exception-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join('logs', 'rejection-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
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

// 로그 유틸리티 함수들
const logUtil = {
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },

    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },

    info: (message, meta = {}) => {
        logger.info(message, meta);
    },

    http: (message, meta = {}) => {
        logger.http(message, meta);
    },

    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },

    // 요청 로그
    logRequest: (req, res, next) => {
        logger.info('Incoming Request', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            requestId: req.requestId,
            userId: req.user?.id || 'anonymous'
        });
        next();
    },

    // 응답 로그
    logResponse: (req, res, next) => {
        const oldSend = res.send;
        res.send = function(data) {
            logger.info('Outgoing Response', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                requestId: req.requestId,
                userId: req.user?.id || 'anonymous'
            });
            oldSend.apply(res, arguments);
        };
        next();
    },

    // 성능 로그
    logPerformance: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info('Request Performance', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                requestId: req.requestId
            });
        });
        next();
    }
};

module.exports = logUtil;