const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const db = require('../config/mysql');

class ImageService {
    constructor() {
        this.uploadPath = {
            profile: 'uploads/profiles',
            background: 'uploads/backgrounds'
        };
    }

    // 이미지 업로드 및 최적화
    async uploadImage(file, type) {
        try {
            const filename = `${uuidv4()}${path.extname(file.originalname)}`;
            const uploadPath = path.join(this.uploadPath[type], filename);

            // 이미지 최적화 및 리사이징
            await sharp(file.buffer)
                .resize({
                    width: type === 'profile' ? 400 : 1200,
                    height: type === 'profile' ? 400 : 400,
                    fit: type === 'profile' ? 'cover' : 'inside'
                })
                .jpeg({ quality: 80 })
                .toFile(uploadPath);

            return filename;
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            throw new Error('이미지 업로드에 실패했습니다.');
        }
    }

    // 이미지 삭제
    async deleteImage(filename, type) {
        try {
            const filepath = path.join(this.uploadPath[type], filename);
            await fs.unlink(filepath);
            return true;
        } catch (error) {
            console.error('이미지 삭제 오류:', error);
            throw new Error('이미지 삭제에 실패했습니다.');
        }
    }

    // 프로필 이미지 업데이트
    async updateProfileImage(userId, file) {
        try {
            const filename = await this.uploadImage(file, 'profile');

            // 기존 이미지 조회
            const [currentImage] = await db.execute(
                'SELECT profile_image FROM users WHERE id = ?',
                [userId]
            );

            // 기존 이미지가 있다면 삭제
            if (currentImage[0]?.profile_image) {
                await this.deleteImage(currentImage[0].profile_image, 'profile');
            }

            // DB 업데이트
            await db.execute(
                'UPDATE users SET profile_image = ? WHERE id = ?',
                [filename, userId]
            );

            return filename;
        } catch (error) {
            console.error('프로필 이미지 업데이트 오류:', error);
            throw new Error('프로필 이미지 업데이트에 실패했습니다.');
        }
    }

    // 배경 이미지 업데이트
    async updateBackgroundImage(userId, file) {
        try {
            const filename = await this.uploadImage(file, 'background');

            // 기존 이미지 조회
            const [currentImage] = await db.execute(
                'SELECT background_image FROM users WHERE id = ?',
                [userId]
            );

            // 기존 이미지가 있다면 삭제
            if (currentImage[0]?.background_image) {
                await this.deleteImage(currentImage[0].background_image, 'background');
            }

            // DB 업데이트
            await db.execute(
                'UPDATE users SET background_image = ? WHERE id = ?',
                [filename, userId]
            );

            return filename;
        } catch (error) {
            console.error('배경 이미지 업데이트 오류:', error);
            throw new Error('배경 이미지 업데이트에 실패했습니다.');
        }
    }
}

module.exports = new ImageService();