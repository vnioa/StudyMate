const { dbUtils } = require('../config/db');

const fileService = {
    // 파일 목록 조회
    async getFiles(userId, options = {}) {
        try {
            const { page = 1, limit = 10, sort = 'createdAt' } = options;
            const offset = (page - 1) * limit;

            const query = `
                SELECT f.*, u.username, u.name,
                       COUNT(fs.id) as shareCount
                FROM files f
                LEFT JOIN auth u ON f.memberId = u.id
                LEFT JOIN file_shares fs ON f.id = fs.fileId
                WHERE f.memberId = ? AND f.status = 'active'
                GROUP BY f.id
                ORDER BY f.${sort} DESC
                LIMIT ? OFFSET ?
            `;

            const files = await dbUtils.query(query, [userId, limit, offset]);
            const [{ total }] = await dbUtils.query(
                'SELECT COUNT(*) as total FROM files WHERE memberId = ? AND status = "active"',
                [userId]
            );

            return { files, total };
        } catch (error) {
            throw new Error('파일 목록 조회 실패: ' + error.message);
        }
    },

    // 파일 타입별 조회
    async getFilesByType(userId, type) {
        try {
            const query = `
                SELECT f.*, u.username, u.name
                FROM files f
                LEFT JOIN auth u ON f.memberId = u.id
                WHERE f.memberId = ? AND f.type = ? AND f.status = 'active'
                ORDER BY f.createdAt DESC
            `;

            return await dbUtils.query(query, [userId, type]);
        } catch (error) {
            throw new Error('파일 타입별 조회 실패: ' + error.message);
        }
    },

    // 파일 검색
    async searchFiles(userId, searchQuery, type) {
        try {
            let query = `
                SELECT f.*, u.username, u.name
                FROM files f
                LEFT JOIN auth u ON f.memberId = u.id
                WHERE f.memberId = ? 
                AND f.status = 'active'
                AND (f.name LIKE ? OR JSON_EXTRACT(f.metadata, '$.description') LIKE ?)
            `;

            const params = [userId, `%${searchQuery}%`, `%${searchQuery}%`];

            if (type) {
                query += ' AND f.type = ?';
                params.push(type);
            }

            query += ' ORDER BY f.createdAt DESC';

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('파일 검색 실패: ' + error.message);
        }
    },

    // 파일 공유 설정 업데이트
    async updateFileSharing(fileId, userId, shareData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [file] = await connection.query(
                    'SELECT * FROM files WHERE id = ? AND memberId = ?',
                    [fileId, userId]
                );

                if (!file) {
                    throw new Error('파일을 찾을 수 없거나 권한이 없습니다.');
                }

                // 기존 공유 설정 삭제
                await connection.query(
                    'DELETE FROM file_shares WHERE fileId = ?',
                    [fileId]
                );

                if (shareData.sharedWith?.length) {
                    const shareValues = shareData.sharedWith.map(memberId => [
                        fileId,
                        memberId,
                        shareData.permissions[memberId] || 'view'
                    ]);

                    await connection.query(`
                        INSERT INTO file_shares (fileId, memberId, permission)
                        VALUES ?
                    `, [shareValues]);

                    await connection.query(
                        'UPDATE files SET isShared = true WHERE id = ?',
                        [fileId]
                    );
                } else {
                    await connection.query(
                        'UPDATE files SET isShared = false WHERE id = ?',
                        [fileId]
                    );
                }

                return { success: true };
            } catch (error) {
                throw new Error('파일 공유 설정 업데이트 실패: ' + error.message);
            }
        });
    },

    // 파일 만료일 설정
    async setFileExpiry(fileId, userId, expiryDate) {
        try {
            const result = await dbUtils.query(`
                UPDATE files 
                SET expiryDate = ?, 
                    status = CASE 
                        WHEN ? < NOW() THEN 'expired'
                        ELSE status 
                    END
                WHERE id = ? AND memberId = ?
            `, [expiryDate, expiryDate, fileId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('파일을 찾을 수 없거나 권한이 없습니다.');
            }

            return { success: true };
        } catch (error) {
            throw new Error('파일 만료일 설정 실패: ' + error.message);
        }
    },

    // 파일 미리보기
    async getFilePreview(fileId, userId) {
        try {
            const query = `
                SELECT f.thumbnailUrl, f.metadata, f.mimeType
                FROM files f
                LEFT JOIN file_shares fs ON f.id = fs.fileId AND fs.memberId = ?
                WHERE f.id = ? 
                AND (f.memberId = ? OR fs.id IS NOT NULL)
                AND f.status = 'active'
            `;

            const [preview] = await dbUtils.query(query, [userId, fileId, userId]);

            if (!preview) {
                throw new Error('파일을 찾을 수 없거나 접근 권한이 없습니다.');
            }

            return preview;
        } catch (error) {
            throw new Error('파일 미리보기 조회 실패: ' + error.message);
        }
    },

    // 파일 삭제
    async deleteFile(fileId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const result = await connection.query(`
                    UPDATE files 
                    SET status = 'deleted', deletedAt = NOW()
                    WHERE id = ? AND memberId = ?
                `, [fileId, userId]);

                if (result.affectedRows === 0) {
                    throw new Error('파일을 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.query(`
                    UPDATE file_shares
                    SET deletedAt = NOW()
                    WHERE fileId = ?
                `, [fileId]);

                return { success: true };
            } catch (error) {
                throw new Error('파일 삭제 실패: ' + error.message);
            }
        });
    }
};

module.exports = fileService;