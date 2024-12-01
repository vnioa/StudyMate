const logger = (req, res, next) => {
    // 요청 시작 시간 기록
    const start = new Date();

    // 요청 로깅
    console.log(`[${start.toISOString()}] ${req.method} ${req.originalUrl}`);

    // 요청 바디가 있는 경우 로깅 (민감 정보 제외)
    if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        // 민감 정보 필터링
        ['password', 'token', 'refreshToken'].forEach(field => {
            if (sanitizedBody[field]) sanitizedBody[field] = '***';
        });
        console.log('Request Body:', sanitizedBody);
    }

    // 응답 로깅을 위해 res.json 메서드 래핑
    const originalJson = res.json;
    res.json = function(body) {
        // 응답 완료 시간 계산
        const duration = new Date() - start;

        console.log(`[${new Date().toISOString()}] Response:`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            path: req.originalUrl,
            method: req.method
        });

        // 원래의 json 메서드 호출
        return originalJson.call(this, body);
    };

    // 에러 로깅
    const logError = (err) => {
        console.error(`[${new Date().toISOString()}] Error:`, {
            path: req.originalUrl,
            method: req.method,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    };

    // 에러 발생 시 로깅
    res.on('error', logError);

    next();
};

module.exports = logger;