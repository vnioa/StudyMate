// 표준화된 응답 형식을 위한 유틸리티

/**
 * 기본 응답 객체 생성
 */
const createResponse = (success, message, data = null, meta = null) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return response;
};

/**
 * 성공 응답
 */
const successResponse = (message = '요청이 성공적으로 처리되었습니다.', data = null, meta = null) => {
    return createResponse(true, message, data, meta);
};

/**
 * 에러 응답
 */
const errorResponse = (message = '요청 처리 중 오류가 발생했습니다.', error = null) => {
    const response = createResponse(false, message);

    if (process.env.NODE_ENV === 'development' && error) {
        response.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }

    return response;
};

/**
 * 페이지네이션 메타데이터
 */
const paginationMeta = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);

    return {
        pagination: {
            currentPage: page,
            pageSize: limit,
            totalItems: total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

/**
 * 생성 성공 응답
 */
const createdResponse = (message = '리소스가 성공적으로 생성되었습니다.', data = null) => {
    return successResponse(message, data);
};

/**
 * 수정 성공 응답
 */
const updatedResponse = (message = '리소스가 성공적으로 수정되었습니다.', data = null) => {
    return successResponse(message, data);
};

/**
 * 삭제 성공 응답
 */
const deletedResponse = (message = '리소스가 성공적으로 삭제되었습니다.') => {
    return successResponse(message);
};

/**
 * 목록 조회 응답
 */
const listResponse = (data, page, limit, total) => {
    return successResponse(
        '목록을 성공적으로 조회했습니다.',
        data,
        paginationMeta(page, limit, total)
    );
};

/**
 * 단일 항목 조회 응답
 */
const itemResponse = (data) => {
    return successResponse('항목을 성공적으로 조회했습니다.', data);
};

/**
 * 빈 응답 (204 No Content)
 */
const noContentResponse = () => {
    return successResponse('컨텐츠가 없습니다.');
};

module.exports = {
    successResponse,
    errorResponse,
    createdResponse,
    updatedResponse,
    deletedResponse,
    listResponse,
    itemResponse,
    noContentResponse,
    paginationMeta
};