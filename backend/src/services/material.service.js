const { dbUtils } = require('../config/db');

const materialService = {
    // 학습 자료 상세 조회
    async getMaterialDetail(materialId, userId) {
        try {
            const query = `
                SELECT m.*, 
                       ms.shareType,
                       u.username as ownerName,
                       u.name as ownerFullName
                FROM materials m
                LEFT JOIN material_shares ms ON m.id = ms.materialId AND ms.memberId = ?
                LEFT JOIN auth u ON m.memberId = u.id
                WHERE m.id = ? AND (
                    m.memberId = ? 
                    OR m.isPublic = true 
                    OR ms.id IS NOT NULL
                )
            `;

            const [material] = await dbUtils.query(query, [userId, materialId, userId]);

            if (!material) {
                throw new Error('자료를 찾을 수 없거나 접근 권한이 없습니다.');
            }

            // 버전 히스토리 조회
            const versionsQuery = `
                SELECT mv.*, u.username as editorName
                FROM material_versions mv
                JOIN auth u ON mv.updatedBy = u.id
                WHERE mv.materialId = ?
                ORDER BY mv.version DESC
            `;

            const versions = await dbUtils.query(versionsQuery, [materialId]);
            material.versions = versions;

            return material;
        } catch (error) {
            throw new Error('학습 자료 조회 실패: ' + error.message);
        }
    },

    // 학습 자료 수정
    async updateMaterial(materialId, userId, updateData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 권한 확인
                const [material] = await connection.query(
                    'SELECT * FROM materials WHERE id = ? AND memberId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없거나 수정 권한이 없습니다.');
                }

                // 현재 버전 저장
                await connection.query(`
                    INSERT INTO material_versions (
                        materialId, version, content, updatedBy, 
                        changes, commitMessage, createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                `, [
                    materialId,
                    material.version,
                    material.content,
                    userId,
                    '자료 업데이트',
                    updateData.commitMessage || '내용 수정'
                ]);

                // 자료 업데이트
                await connection.query(`
                    UPDATE materials
                    SET title = ?,
                        description = ?,
                        content = ?,
                        references = ?,
                        version = version + 1,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [
                    updateData.title,
                    updateData.description,
                    updateData.content,
                    updateData.references,
                    materialId
                ]);

                return { ...material, ...updateData, version: material.version + 1 };
            } catch (error) {
                throw new Error('학습 자료 수정 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 공유
    async shareMaterial(materialId, userId, shareData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 자료 소유자 확인
                const [material] = await connection.query(
                    'SELECT * FROM materials WHERE id = ? AND memberId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없거나 공유 권한이 없습니다.');
                }

                // 기존 공유 설정 삭제
                await connection.query(
                    'DELETE FROM material_shares WHERE materialId = ? AND memberId IN (?)',
                    [materialId, shareData.recipients]
                );

                // 새로운 공유 설정 추가
                const shareValues = shareData.recipients.map(recipientId => [
                    materialId,
                    recipientId,
                    shareData.shareType,
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후 만료
                ]);

                await connection.query(`
                    INSERT INTO material_shares (
                        materialId, memberId, shareType, expiresAt
                    ) VALUES ?
                `, [shareValues]);

                return { success: true, sharedCount: shareData.recipients.length };
            } catch (error) {
                throw new Error('학습 자료 공유 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 다운로드 URL 생성
    async getMaterialDownloadUrl(materialId, userId) {
        try {
            const query = `
                SELECT m.*, ms.shareType
                FROM materials m
                LEFT JOIN material_shares ms ON m.id = ms.materialId 
                    AND ms.memberId = ?
                    AND (ms.expiresAt IS NULL OR ms.expiresAt > NOW())
                WHERE m.id = ? AND (
                    m.memberId = ?
                    OR m.isPublic = true
                    OR (ms.id IS NOT NULL AND ms.shareType IN ('download', 'full'))
                )
            `;

            const [material] = await dbUtils.query(query, [userId, materialId, userId]);

            if (!material) {
                throw new Error('자료를 찾을 수 없거나 다운로드 권한이 없습니다.');
            }

            // 다운로드 카운트 증가
            await dbUtils.query(
                'UPDATE materials SET downloadCount = downloadCount + 1 WHERE id = ?',
                [materialId]
            );

            // 실제 환경에서는 파일 스토리지 서비스의 서명된 URL을 생성하여 반환
            return material.fileUrl;
        } catch (error) {
            throw new Error('다운로드 URL 생성 실패: ' + error.message);
        }
    }
};

module.exports = materialService;