const db = require('../config/mysql');
const createError = require('http-errors');
const { uploadToStorage, deleteFile } = require('../utils/fileUpload');

const FileController = {
    // 파일 목록 조회
    getFiles: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [files] = await connection.query(
                `SELECT f.*, u.name as uploaded_by
                 FROM files f
                          JOIN users u ON f.user_id = u.id
                 WHERE f.user_id = ? AND f.deleted_at IS NULL
                 ORDER BY f.created_at DESC`,
                [req.user.id]
            );
            res.json({ files });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 타입별 필터링
    filterFilesByType: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { type } = req.params;
            let query = `
                SELECT f.*, u.name as uploaded_by
                FROM files f
                         JOIN users u ON f.user_id = u.id
                WHERE f.user_id = ? AND f.deleted_at IS NULL
            `;

            if (type !== 'All') {
                query += ' AND f.file_type = ?';
            }
            query += ' ORDER BY f.created_at DESC';

            const [files] = await connection.query(
                query,
                type === 'All' ? [req.user.id] : [req.user.id, type]
            );
            res.json({ files });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 검색
    searchFiles: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { query } = req.query;
            const [files] = await connection.query(
                `SELECT f.*, u.name as uploaded_by
                 FROM files f
                          JOIN users u ON f.user_id = u.id
                 WHERE f.user_id = ?
                   AND f.deleted_at IS NULL
                   AND (f.file_name LIKE ? OR f.description LIKE ?)
                 ORDER BY f.created_at DESC`,
                [req.user.id, `%${query}%`, `%${query}%`]
            );
            res.json({ files });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 공유 설정 업데이트
    updateFileSharing: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { fileId } = req.params;
            const { isShared } = req.body;

            const [result] = await connection.query(
                `UPDATE files
                 SET is_shared = ?, updated_at = NOW()
                 WHERE id = ? AND user_id = ?`,
                [isShared, fileId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '파일을 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 만료일 설정
    setFileExpiry: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { fileId } = req.params;
            const { expiryDate } = req.body;

            const [result] = await connection.query(
                `UPDATE files
                 SET expiry_date = ?, updated_at = NOW()
                 WHERE id = ? AND user_id = ?`,
                [expiryDate, fileId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(404, '파일을 찾을 수 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 미리보기
    getFilePreview: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { fileId } = req.params;

            const [file] = await connection.query(
                `SELECT * FROM files
                 WHERE id = ? AND (user_id = ? OR is_shared = true)
                   AND deleted_at IS NULL`,
                [fileId, req.user.id]
            );

            if (!file.length) {
                throw createError(404, '파일을 찾을 수 없습니다.');
            }

            // 파일 타입에 따른 미리보기 생성
            const preview = await generatePreview(file[0]);
            res.json({ preview });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 파일 삭제
    deleteFile: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { fileId } = req.params;

            const [file] = await connection.query(
                'SELECT * FROM files WHERE id = ? AND user_id = ?',
                [fileId, req.user.id]
            );

            if (!file.length) {
                throw createError(404, '파일을 찾을 수 없습니다.');
            }

            await connection.beginTransaction();

            // 스토리지에서 파일 삭제
            await deleteFile(file[0].storage_path);

            // DB에서 소프트 삭제
            await connection.query(
                'UPDATE files SET deleted_at = NOW() WHERE id = ?',
                [fileId]
            );

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    }
};

// 파일 미리보기 생성 함수
const generatePreview = async (file) => {
    switch (file.file_type) {
        case 'PDF':
            return generatePDFPreview(file);
        case 'Image':
            return generateImagePreview(file);
        case 'Video':
            return generateVideoPreview(file);
        default:
            return null;
    }
};

module.exports = FileController;