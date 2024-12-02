const { Material, MaterialShare, MaterialVersion } = require('../models');
const { dbUtils } = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

const materialService = {
    // 학습 자료 상세 조회
    async getMaterialDetail(materialId) {
        try {
            const query = `
                SELECT m.*, u.name as ownerName,
                       COUNT(DISTINCT ms.id) as shareCount,
                       COUNT(DISTINCT mv.id) as versionCount
                FROM materials m
                LEFT JOIN users u ON m.userId = u.id
                LEFT JOIN material_shares ms ON m.id = ms.materialId
                LEFT JOIN material_versions mv ON m.id = mv.materialId
                WHERE m.id = ? AND m.deletedAt IS NULL
                GROUP BY m.id
            `;
            const [material] = await dbUtils.query(query, [materialId]);

            if (!material) {
                throw new Error('학습 자료를 찾을 수 없습니다');
            }

            // 공유 정보 조회
            const shares = await dbUtils.query(`
                SELECT ms.*, u.name as recipientName
                FROM material_shares ms
                JOIN users u ON ms.recipientId = u.id
                WHERE ms.materialId = ?
            `, [materialId]);

            // 버전 정보 조회
            const versions = await dbUtils.query(`
                SELECT mv.*, u.name as editorName
                FROM material_versions mv
                JOIN users u ON mv.updatedBy = u.id
                WHERE mv.materialId = ?
                ORDER BY mv.version DESC
            `, [materialId]);

            return {
                ...material,
                shares,
                versions
            };
        } catch (error) {
            throw new Error('학습 자료 조회 실패: ' + error.message);
        }
    },

    // 학습 자료 수정
    async updateMaterial(materialId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 현재 버전 조회
                const [material] = await connection.query(
                    'SELECT version FROM materials WHERE id = ?',
                    [materialId]
                );

                if (!material) {
                    throw new Error('학습 자료를 찾을 수 없습니다');
                }

                // 새 버전 생성
                const newVersion = material.version + 1;

                // 이전 버전 저장
                await connection.query(`
                    INSERT INTO material_versions 
                    (materialId, version, content, changes, updatedBy)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    materialId,
                    newVersion,
                    data.content,
                    data.changes || '내용 업데이트',
                    data.userId
                ]);

                // 자료 업데이트
                await connection.query(`
                    UPDATE materials 
                    SET title = ?, description = ?, content = ?,
                        references = ?, version = ?,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [
                    data.title,
                    data.description,
                    data.content,
                    data.references,
                    newVersion,
                    materialId
                ]);

                return { success: true, version: newVersion };
            } catch (error) {
                throw new Error('학습 자료 수정 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 공유
    async shareMaterial(materialId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { shareType, recipients, expiresAt } = data;

                // 기존 공유 설정 삭제
                await connection.query(
                    'DELETE FROM material_shares WHERE materialId = ?',
                    [materialId]
                );

                // 새로운 공유 설정 추가
                for (const recipientId of recipients) {
                    await connection.query(`
                        INSERT INTO material_shares 
                        (materialId, recipientId, shareType, expiresAt)
                        VALUES (?, ?, ?, ?)
                    `, [materialId, recipientId, shareType, expiresAt]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('학습 자료 공유 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 다운로드 URL 생성
    async getMaterialDownloadUrl(materialId) {
        try {
            const [material] = await dbUtils.query(`
                SELECT m.*, ms.shareType 
                FROM materials m
                LEFT JOIN material_shares ms ON m.id = ms.materialId
                WHERE m.id = ? AND m.fileUrl IS NOT NULL
            `, [materialId]);

            if (!material) {
                throw new Error('다운로드할 파일이 없습니다');
            }

            if (material.shareType === 'view') {
                throw new Error('다운로드 권한이 없습니다');
            }

            // 다운로드 카운트 증가
            await dbUtils.query(`
                UPDATE materials 
                SET downloadCount = downloadCount + 1
                WHERE id = ?
            `, [materialId]);

            return {
                downloadUrl: material.fileUrl,
                fileName: path.basename(material.fileUrl),
                fileType: material.fileType,
                fileSize: material.fileSize
            };
        } catch (error) {
            throw new Error('다운로드 URL 생성 실패: ' + error.message);
        }
    }
};

module.exports = materialService;