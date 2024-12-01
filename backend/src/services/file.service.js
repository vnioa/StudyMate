const { dbUtils } = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

const fileService = {
    // 파일 목록 조회
    async getFiles() {
        try {
            const query = `
                SELECT f.*, u.name as ownerName
                FROM files f
                         JOIN users u ON f.userId = u.id
                WHERE f.status = 'active'
                ORDER BY f.createdAt DESC
            `;

            const files = await dbUtils.query(query);
            return { files };
        } catch (error) {
            throw new Error('파일 목록 조회 실패: ' + error.message);
        }
    },

    // 파일 타입별 필터링
    async filterFilesByType(type) {
        try {
            const query = `
                SELECT f.*, u.name as ownerName
                FROM files f
                         JOIN users u ON f.userId = u.id
                WHERE f.type = ? AND f.status = 'active'
                ORDER BY f.createdAt DESC
            `;

            const files = await dbUtils.query(query, [type]);
            return { files };
        } catch (error) {
            throw new Error('파일 필터링 실패: ' + error.message);
        }
    },

    // 파일 검색
    async searchFiles(query) {
        try {
            const searchQuery = `
                SELECT f.*, u.name as ownerName
                FROM files f
                         JOIN users u ON f.userId = u.id
                WHERE f.status = 'active'
                  AND (f.name LIKE ? OR f.metadata->>'$.description' LIKE ?)
                ORDER BY f.createdAt DESC
            `;

            const files = await dbUtils.query(searchQuery, [
                `%${query}%`,
                `%${query}%`
            ]);
            return { files };
        } catch (error) {
            throw new Error('파일 검색 실패: ' + error.message);
        }
    },

    // 파일 공유 설정 업데이트
    async updateFileSharing(fileId, isShared) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(
                    'UPDATE files SET isShared = ? WHERE id = ?',
                    [isShared, fileId]
                );

                if (!isShared) {
                    // 공유 해제 시 기존 공유 정보 삭제
                    await connection.query(
                        'DELETE FROM file_shares WHERE fileId = ?',
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
    async setFileExpiry(fileId, expiryDate) {
        try {
            await dbUtils.query(
                'UPDATE files SET expiryDate = ? WHERE id = ?',
                [expiryDate, fileId]
            );
            return { success: true };
        } catch (error) {
            throw new Error('파일 만료일 설정 실패: ' + error.message);
        }
    },

    // 파일 미리보기
    async getFilePreview(fileId) {
        try {
            const [file] = await dbUtils.query(
                'SELECT * FROM files WHERE id = ? AND status = "active"',
                [fileId]
            );

            if (!file) {
                throw new Error('파일을 찾을 수 없습니다');
            }

            // 썸네일이 있는 경우 썸네일 반환
            if (file.thumbnailUrl) {
                return { preview: file.thumbnailUrl };
            }

            // 파일 타입별 미리보기 처리
            let preview;
            switch (file.type) {
                case 'Image':
                    preview = file.path;
                    break;
                case 'PDF':
                    preview = await generatePDFPreview(file.path);
                    break;
                case 'Video':
                    preview = await generateVideoThumbnail(file.path);
                    break;
                default:
                    preview = null;
            }

            return { preview };
        } catch (error) {
            throw new Error('파일 미리보기 생성 실패: ' + error.message);
        }
    },

    // 파일 삭제
    async deleteFile(fileId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [file] = await connection.query(
                    'SELECT * FROM files WHERE id = ?',
                    [fileId]
                );

                if (!file) {
                    throw new Error('파일을 찾을 수 없습니다');
                }

                // 실제 파일 삭제
                await fs.unlink(file.path);
                if (file.thumbnailUrl) {
                    await fs.unlink(file.thumbnailUrl);
                }

                // DB에서 파일 정보 삭제
                await connection.query(
                    'UPDATE files SET status = "deleted" WHERE id = ?',
                    [fileId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('파일 삭제 실패: ' + error.message);
            }
        });
    }
};

module.exports = fileService;