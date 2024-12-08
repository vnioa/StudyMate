const studyService = require('../services/study.service');
const { CustomError } = require('../utils/error.utils');
const { SESSION_STATUS, MATERIAL_TYPES, MOOD_TYPES } = require('../models/study.model');

const studyController = {
    // 대시보드 데이터 조회
    getDashboardData: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const dashboardData = await studyService.getDashboardData(userId);

            return res.status(200).json({
                success: true,
                data: dashboardData
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 세션 시작
    startStudySession: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const session = await studyService.startStudySession(userId);

            return res.status(201).json({
                success: true,
                message: '학습 세션이 시작되었습니다.',
                data: session
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 세션 종료
    endStudySession: async (req, res, next) => {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const endedSession = await studyService.endStudySession(sessionId, userId);

            return res.status(200).json({
                success: true,
                message: '학습 세션이 종료되었습니다.',
                data: endedSession
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 세션 통계 조회
    getSessionStats: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const stats = await studyService.getSessionStats(userId);

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 세션 종료 처리
    endSession: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { cycles, notes, totalTime, focusMode, endTime } = req.body;

            const session = await studyService.endSession(userId, {
                cycles,
                notes,
                totalTime,
                focusMode,
                endTime
            });

            return res.status(200).json({
                success: true,
                message: '세션이 성공적으로 종료되었습니다.',
                data: session
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 사이클 업데이트
    updateCycles: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { cycles, timestamp } = req.body;

            const updated = await studyService.updateCycles(userId, cycles, timestamp);

            return res.status(200).json({
                success: true,
                message: '사이클이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 노트 저장
    saveNotes: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { notes, sessionId } = req.body;

            const savedNotes = await studyService.saveNotes(userId, sessionId, notes);

            return res.status(200).json({
                success: true,
                message: '노트가 저장되었습니다.',
                data: savedNotes
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 통계 조회
    getStatistics: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const statistics = await studyService.getStatistics(userId);

            return res.status(200).json({
                success: true,
                data: statistics
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 추천 정보 조회
    getRecommendations: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const recommendations = await studyService.getRecommendations(userId);

            return res.status(200).json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 분석 데이터 조회
    getAnalytics: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { timeRange } = req.params;

            const analytics = await studyService.getAnalytics(userId, timeRange);

            return res.status(200).json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 과목별 분석 데이터 조회
    getSubjectAnalytics: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { subjectId } = req.params;
            const { timeRange } = req.body;

            const analytics = await studyService.getSubjectAnalytics(userId, subjectId, timeRange);

            return res.status(200).json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 일정 목록 조회
    getSchedules: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const schedules = await studyService.getSchedules(userId);

            return res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 일정 생성
    createSchedule: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const scheduleData = req.body;

            const schedule = await studyService.createSchedule(userId, scheduleData);

            return res.status(201).json({
                success: true,
                message: '일정이 생성되었습니다.',
                data: schedule
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 일정 수정
    updateSchedule: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { scheduleId } = req.params;
            const updateData = req.body;

            const updated = await studyService.updateSchedule(userId, scheduleId, updateData);

            return res.status(200).json({
                success: true,
                message: '일정이 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 일정 삭제
    deleteSchedule: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { scheduleId } = req.params;

            await studyService.deleteSchedule(userId, scheduleId);

            return res.status(200).json({
                success: true,
                message: '일정이 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const journalData = req.body;

            const journal = await studyService.saveJournal(userId, journalData);

            return res.status(201).json({
                success: true,
                message: '학습 일지가 저장되었습니다.',
                data: journal
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 피드백 조회
    getFeedback: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const feedback = await studyService.getFeedback(userId);

            return res.status(200).json({
                success: true,
                data: feedback
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const evaluationData = req.body;

            const evaluation = await studyService.saveSelfEvaluation(userId, evaluationData);

            return res.status(201).json({
                success: true,
                message: '자기 평가가 저장되었습니다.',
                data: evaluation
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 목록 조회
    getMaterials: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const materials = await studyService.getMaterials(userId);

            return res.status(200).json({
                success: true,
                data: materials
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 업로드
    uploadMaterial: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const file = req.processedFile;
            const materialData = req.body;

            if (!file) {
                throw new CustomError('파일이 필요합니다.', 400);
            }

            const material = await studyService.uploadMaterial(userId, file, materialData);

            return res.status(201).json({
                success: true,
                message: '학습 자료가 업로드되었습니다.',
                data: material
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 삭제
    deleteMaterial: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { materialId } = req.params;

            await studyService.deleteMaterial(userId, materialId);

            return res.status(200).json({
                success: true,
                message: '학습 자료가 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 공유
    shareMaterial: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { materialId } = req.params;
            const shareData = req.body;

            const result = await studyService.shareMaterial(userId, materialId, shareData);

            return res.status(200).json({
                success: true,
                message: '학습 자료가 공유되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 버전 업데이트
    updateVersion: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { materialId } = req.params;
            const versionData = req.body;

            const updated = await studyService.updateMaterialVersion(userId, materialId, versionData);

            return res.status(200).json({
                success: true,
                message: '학습 자료 버전이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = studyController;