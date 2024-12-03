const { StudySession, StudySchedule, StudyJournal, SelfEvaluation, StudyMaterial, SESSION_STATUS, MOOD_TYPES, MATERIAL_TYPES } = require('../models').Study;
const { CustomError } = require('../utils/error.utils');

const studyController = {
    // 대시보드 데이터 조회
    async getDashboardData(req, res, next) {
        try {
            const sessions = await StudySession.findAll({
                where: { memberId: req.user.id },
                order: [['startTime', 'DESC']],
                limit: 5,
                include: [{
                    model: SelfEvaluation,
                    as: 'evaluation'
                }]
            });

            res.status(200).json({
                success: true,
                data: sessions
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 세션 관련 컨트롤러
    async startStudySession(req, res, next) {
        try {
            const session = await StudySession.create({
                memberId: req.user.id,
                startTime: new Date(),
                status: SESSION_STATUS.ACTIVE
            });

            res.status(201).json({
                success: true,
                message: '학습 세션이 시작되었습니다.',
                data: session
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async endStudySession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const [updated] = await StudySession.update({
                status: SESSION_STATUS.COMPLETED,
                endTime: new Date()
            }, {
                where: {
                    id: sessionId,
                    memberId: req.user.id
                }
            });

            if (!updated) {
                throw new CustomError('세션을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '학습 세션이 종료되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async getSessionStats(req, res, next) {
        try {
            const stats = await StudySession.findAll({
                where: { memberId: req.user.id },
                attributes: [
                    'status',
                    'totalTime',
                    'cycles',
                    'startTime',
                    'endTime'
                ]
            });

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async endSession(req, res, next) {
        try {
            const { cycles, notes, totalTime, focusMode, endTime } = req.body;
            const [updated] = await StudySession.update({
                cycles,
                notes,
                totalTime,
                focusMode,
                endTime,
                status: SESSION_STATUS.COMPLETED
            }, {
                where: {
                    memberId: req.user.id,
                    status: SESSION_STATUS.ACTIVE
                }
            });

            if (!updated) {
                throw new CustomError('진행 중인 세션을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '세션이 성공적으로 종료되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async updateCycles(req, res, next) {
        try {
            const { cycles, timestamp } = req.body;
            const [updated] = await StudySession.update({
                cycles
            }, {
                where: {
                    memberId: req.user.id,
                    status: SESSION_STATUS.ACTIVE
                }
            });

            if (!updated) {
                throw new CustomError('진행 중인 세션을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '학습 사이클이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async saveNotes(req, res, next) {
        try {
            const { notes, sessionId } = req.body;
            const [updated] = await StudySession.update({
                notes
            }, {
                where: {
                    id: sessionId,
                    memberId: req.user.id
                }
            });

            if (!updated) {
                throw new CustomError('세션을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '학습 노트가 저장되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 통계 및 분석 관련 컨트롤러
    async getStatistics(req, res, next) {
        try {
            const stats = await StudySession.findAll({
                where: { memberId: req.user.id },
                include: [{
                    model: SelfEvaluation,
                    as: 'evaluation'
                }],
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async getAnalytics(req, res, next) {
        try {
            const { timeRange } = req.params;
            const analytics = await StudySession.findAll({
                where: {
                    memberId: req.user.id,
                    startTime: {
                        [Op.gte]: timeRange
                    }
                },
                include: [{
                    model: SelfEvaluation,
                    as: 'evaluation'
                }]
            });

            res.status(200).json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async getSubjectAnalytics(req, res, next) {
        try {
            const { subjectId } = req.params;
            const { timeRange } = req.query;

            const analytics = await StudySession.findAll({
                where: {
                    memberId: req.user.id,
                    subjectId,
                    startTime: {
                        [Op.gte]: timeRange
                    }
                },
                include: [{
                    model: SelfEvaluation,
                    as: 'evaluation'
                }]
            });

            res.status(200).json({
                success: true,
                data: analytics
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async getRecommendations(req, res, next) {
        try {
            const recommendations = await StudyMaterial.findAll({
                where: {
                    isShared: true
                },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.status(200).json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 일정 관련 컨트롤러
    async getSchedules(req, res, next) {
        try {
            const schedules = await StudySchedule.findAll({
                where: { memberId: req.user.id },
                order: [['startTime', 'ASC']]
            });

            res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async createSchedule(req, res, next) {
        try {
            const { title, startTime, endTime, repeat, notification, shared } = req.body;

            if (new Date(endTime) <= new Date(startTime)) {
                throw new CustomError('종료 시간은 시작 시간 이후여야 합니다.', 400);
            }

            const schedule = await StudySchedule.create({
                memberId: req.user.id,
                title,
                startTime,
                endTime,
                repeat,
                notification,
                shared
            });

            res.status(201).json({
                success: true,
                message: '학습 일정이 생성되었습니다.',
                data: schedule
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async updateSchedule(req, res, next) {
        try {
            const { scheduleId } = req.params;
            const [updated] = await StudySchedule.update(req.body, {
                where: {
                    id: scheduleId,
                    memberId: req.user.id
                }
            });

            if (!updated) {
                throw new CustomError('일정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '일정이 업데이트되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async deleteSchedule(req, res, next) {
        try {
            const { scheduleId } = req.params;
            const deleted = await StudySchedule.destroy({
                where: {
                    id: scheduleId,
                    memberId: req.user.id
                }
            });

            if (!deleted) {
                throw new CustomError('일정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '일정이 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 피드백 관련 컨트롤러
    async saveJournal(req, res, next) {
        try {
            const { content, achievements, difficulties, improvements, nextGoals } = req.body;
            const journal = await StudyJournal.create({
                memberId: req.user.id,
                content,
                achievements,
                difficulties,
                improvements,
                nextGoals
            });

            res.status(201).json({
                success: true,
                message: '학습 일지가 저장되었습니다.',
                data: journal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async getFeedback(req, res, next) {
        try {
            const feedback = await StudyJournal.findAll({
                where: { memberId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.status(200).json({
                success: true,
                data: feedback
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async saveSelfEvaluation(req, res, next) {
        try {
            const { understanding, effort, efficiency, notes } = req.body;
            const evaluation = await SelfEvaluation.create({
                sessionId: req.body.sessionId,
                understanding,
                effort,
                efficiency,
                notes
            });

            res.status(201).json({
                success: true,
                message: '자기 평가가 저장되었습니다.',
                data: evaluation
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 학습 자료 관련 컨트롤러
    async getMaterials(req, res, next) {
        try {
            const materials = await StudyMaterial.findAll({
                where: { memberId: req.user.id },
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: materials
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    async uploadMaterial(req, res, next) {
        try {
            if (!req.file) {
                throw new CustomError('파일이 제공되지 않았습니다.', 400);
            }

            const material = await StudyMaterial.create({
                memberId: req.user.id,
                title: req.file.originalname,
                type: req.file.mimetype.split('/')[0].toUpperCase(),
                url: req.file.path,
                size: req.file.size,
                mimeType: req.file.mimetype,
                version: 1
            });

            res.status(201).json({
                success: true,
                message: '자료가 업로드되었습니다.',
                data: material
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async deleteMaterial(req, res, next) {
        try {
            const { materialId } = req.params;
            const deleted = await StudyMaterial.destroy({
                where: {
                    id: materialId,
                    memberId: req.user.id
                }
            });

            if (!deleted) {
                throw new CustomError('자료를 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '자료가 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async shareMaterial(req, res, next) {
        try {
            const { materialId } = req.params;
            const [updated] = await StudyMaterial.update({
                isShared: true
            }, {
                where: {
                    id: materialId,
                    memberId: req.user.id
                }
            });

            if (!updated) {
                throw new CustomError('자료를 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                message: '자료가 공유되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    async updateVersion(req, res, next) {
        try {
            const { materialId } = req.params;
            const material = await StudyMaterial.findOne({
                where: {
                    id: materialId,
                    memberId: req.user.id
                }
            });

            if (!material) {
                throw new CustomError('자료를 찾을 수 없습니다.', 404);
            }

            await StudyMaterial.update({
                version: material.version + 1
            }, {
                where: { id: materialId }
            });

            res.status(200).json({
                success: true,
                message: '자료 버전이 업데이트되었습니다.',
                data: { version: material.version + 1 }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    }
};

module.exports = studyController;