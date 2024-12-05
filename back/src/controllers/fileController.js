const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    validateFileType(type) {
        const validTypes = ['document', 'image', 'video', 'audio', 'other'];
        return validTypes.includes(type);
    }
};

const fileController = {
    // 파일 목록 조회
    getFiles: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, sort = 'createdAt' } = req.query;
            const offset = (page - 1) * limit;

            const [files, [{total}]] = await Promise.all([
                utils.executeQuery(`
          SELECT f.*, u.username, u.name,
                 COUNT(fs.id) as shareCount
          FROM files f
          LEFT JOIN auth u ON f.memberId = u.id
          LEFT JOIN file_shares fs ON f.id = fs.fileId
          WHERE f.memberId = ? AND f.status = 'active'
          GROUP BY f.id
          ORDER BY f.${sort} DESC
          LIMIT ? OFFSET ?
        `, [userId, Number(limit), offset]),

                utils.executeQuery(
                    'SELECT COUNT(*) as total FROM files WHERE memberId = ? AND status = "active"',
                    [userId]
                )
            ]);

            res.status(200).json({
                success: true,
                message: '파일 목록을 성공적으로 조회했습니다.',
                data: { files, total }
            });
        } catch (error) {
            console.error('파일 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 목록 조회에 실패했습니다.'
            });
        }
    },

    // 파일 타입별 필터링
    filterFilesByType: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type } = req.params;

            if (!utils.validateFileType(type)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 파일 타입입니다.'
                });
            }

            const files = await utils.executeQuery(`
        SELECT f.*, u.username, u.name
        FROM files f
        LEFT JOIN auth u ON f.memberId = u.id
        WHERE f.memberId = ? AND f.type = ? AND f.status = 'active'
        ORDER BY f.createdAt DESC
      `, [userId, type]);

            res.status(200).json({
                success: true,
                message: '파일이 성공적으로 필터링되었습니다.',
                data: files
            });
        } catch (error) {
            console.error('파일 필터링 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 필터링에 실패했습니다.'
            });
        }
    },

    // 파일 검색
    searchFiles: async (req, res) => {
        try {
            const userId = req.user.id;
            const { query, type } = req.query;

            let sqlQuery = `
        SELECT f.*, u.username, u.name
        FROM files f
        LEFT JOIN auth u ON f.memberId = u.id
        WHERE f.memberId = ? 
        AND f.status = 'active'
        AND (f.name LIKE ? OR JSON_EXTRACT(f.metadata, '$.description') LIKE ?)
      `;
            const params = [userId, `%${query}%`, `%${query}%`];

            if (type && utils.validateFileType(type)) {
                sqlQuery += ' AND f.type = ?';
                params.push(type);
            }

            sqlQuery += ' ORDER BY f.createdAt DESC';

            const files = await utils.executeQuery(sqlQuery, params);

            res.status(200).json({
                success: true,
                message: '파일 검색이 완료되었습니다.',
                data: files
            });
        } catch (error) {
            console.error('파일 검색 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 검색에 실패했습니다.'
            });
        }
    },

    // 파일 공유 설정 업데이트
    updateFileSharing: async (req, res) => {
        try {
            const { fileId } = req.params;
            const { sharedWith, permissions } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [file] = await connection.execute(
                    'SELECT * FROM files WHERE id = ? AND memberId = ?',
                    [fileId, userId]
                );

                if (!file) {
                    throw new Error('파일을 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.execute(
                    'DELETE FROM file_shares WHERE fileId = ?',
                    [fileId]
                );

                if (sharedWith?.length) {
                    const shareValues = sharedWith.map(memberId => [
                        fileId,
                        memberId,
                        permissions[memberId] || 'view'
                    ]);

                    await connection.execute(`
            INSERT INTO file_shares (fileId, memberId, permission)
            VALUES ?
          `, [shareValues]);

                    await connection.execute(
                        'UPDATE files SET isShared = true WHERE id = ?',
                        [fileId]
                    );
                } else {
                    await connection.execute(
                        'UPDATE files SET isShared = false WHERE id = ?',
                        [fileId]
                    );
                }

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '파일 공유 설정이 업데이트되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('파일 공유 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 공유 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 파일 만료일 설정
    setFileExpiry: async (req, res) => {
        try {
            const { fileId } = req.params;
            const { expiryDate } = req.body;
            const userId = req.user.id;

            if (new Date(expiryDate) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: '만료일은 현재 날짜보다 이후여야 합니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE files 
        SET expiryDate = ?, 
            status = CASE 
                WHEN ? < NOW() THEN 'expired'
                ELSE status 
            END
        WHERE id = ? AND memberId = ?
      `, [expiryDate, expiryDate, fileId, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '파일을 찾을 수 없거나 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '파일 만료일이 설정되었습니다.'
            });
        } catch (error) {
            console.error('파일 만료일 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 만료일 설정에 실패했습니다.'
            });
        }
    },

    // 파일 미리보기
    getFilePreview: async (req, res) => {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            const [preview] = await utils.executeQuery(`
        SELECT f.thumbnailUrl, f.metadata, f.mimeType
        FROM files f
        LEFT JOIN file_shares fs ON f.id = fs.fileId AND fs.memberId = ?
        WHERE f.id = ? 
        AND (f.memberId = ? OR fs.id IS NOT NULL)
        AND f.status = 'active'
      `, [userId, fileId, userId]);

            if (!preview) {
                return res.status(404).json({
                    success: false,
                    message: '파일을 찾을 수 없거나 접근 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '파일 미리보기를 성공적으로 조회했습니다.',
                data: preview
            });
        } catch (error) {
            console.error('파일 미리보기 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 미리보기 조회에 실패했습니다.'
            });
        }
    },

    // 파일 삭제
    deleteFile: async (req, res) => {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const result = await connection.execute(`
          UPDATE files 
          SET status = 'deleted', deletedAt = NOW()
          WHERE id = ? AND memberId = ?
        `, [fileId, userId]);

                if (result.affectedRows === 0) {
                    throw new Error('파일을 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.execute(`
          UPDATE file_shares
          SET deletedAt = NOW()
          WHERE fileId = ?
        `, [fileId]);
            });

            res.status(200).json({
                success: true,
                message: '파일이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '파일 삭제에 실패했습니다.'
            });
        }
    }
};

module.exports = fileController;