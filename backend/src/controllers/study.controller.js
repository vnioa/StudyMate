const studyService = require('../services/study.service');

const studyController = {
    // 대시보드 데이터 조회
    getDashboardData: async (req, res) => {
        try {
            const result = await studyService.getDashboardData();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 세션 시작
    startStudySession: async (req, res) => {
        try {
            const result = await studyService.startStudySession();
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 세션 종료
    endStudySession: async (req, res) => {
        try {
            const result = await studyService.endStudySession(req.params.sessionId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 통계 조회
    getStatistics: async (req, res) => {
        try {
            const result = await studyService.getStatistics(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 추천 콘텐츠 조회
    getRecommendations: async (req, res) => {
        try {
            const result = await studyService.getRecommendations();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 분석 데이터 조회
    getAnalytics: async (req, res) => {
        try {
            const result = await studyService.getAnalytics(req.params.timeRange);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 과목별 분석 데이터 조회
    getSubjectAnalytics: async (req, res) => {
        try {
            const result = await studyService.getSubjectAnalytics(
                req.params.subjectId,
                req.query.timeRange
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일정 조회
    getSchedules: async (req, res) => {
        try {
            const result = await studyService.getSchedules(req.query.date);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일정 생성
    createSchedule: async (req, res) => {
        try {
            const result = await studyService.createSchedule(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일정 수정
    updateSchedule: async (req, res) => {
        try {
            const result = await studyService.updateSchedule(req.params.scheduleId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일정 삭제
    deleteSchedule: async (req, res) => {
        try {
            const result = await studyService.deleteSchedule(req.params.scheduleId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res) => {
        try {
            const result = await studyService.saveJournal(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 피드백 정보 조회
    getFeedback: async (req, res) => {
        try {
            const result = await studyService.getFeedback();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res) => {
        try {
            const result = await studyService.saveSelfEvaluation(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 자료 관련 컨트롤러
    getMaterials: async (req, res) => {
        try {
            const result = await studyService.getMaterials();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    uploadMaterial: async (req, res) => {
        try {
            const result = await studyService.uploadMaterial(req.file);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteMaterial: async (req, res) => {
        try {
            const result = await studyService.deleteMaterial(req.params.materialId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    shareMaterial: async (req, res) => {
        try {
            const result = await studyService.shareMaterial(req.params.materialId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateVersion: async (req, res) => {
        try {
            const result = await studyService.updateVersion(req.params.materialId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 세션 관련 컨트롤러
    getSessionStats: async (req, res) => {
        try {
            const result = await studyService.getSessionStats();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    endSession: async (req, res) => {
        try {
            const result = await studyService.endSession(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateCycles: async (req, res) => {
        try {
            const result = await studyService.updateCycles(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    saveNotes: async (req, res) => {
        try {
            const result = await studyService.saveNotes(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = studyController;