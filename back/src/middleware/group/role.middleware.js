const db = require('../config/mysql');

class RoleMiddleware {
    // 역할 검증 미들웨어
    checkRole(requiredRoles) {
        return async (req, res, next) => {
            try {
                const userId = req.user.id;

                // 사용자의 역할 조회
                const [userRole] = await db.execute(
                    'SELECT role FROM group_members WHERE user_id = ? AND group_id = ?',
                    [userId, req.params.groupId]
                );

                if (userRole.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: '그룹에 속하지 않은 사용자입니다.'
                    });
                }

                // 필요한 역할 중 하나라도 가지고 있는지 확인
                if (!requiredRoles.includes(userRole[0].role)) {
                    return res.status(403).json({
                        success: false,
                        message: '접근 권한이 없습니다.'
                    });
                }

                // 역할 정보를 요청 객체에 추가
                req.userRole = userRole[0].role;
                next();
            } catch (error) {
                console.error('역할 검증 오류:', error);
                res.status(500).json({
                    success: false,
                    message: '역할 검증에 실패했습니다.'
                });
            }
        };
    }

    // 그룹 관리자 검증 미들웨어
    isGroupAdmin() {
        return this.checkRole(['admin']);
    }

    // 그룹 매니저 이상 검증 미들웨어
    isManagerOrAdmin() {
        return this.checkRole(['admin', 'manager']);
    }

    // 일반 멤버 이상 검증 미들웨어
    isMember() {
        return this.checkRole(['admin', 'manager', 'member']);
    }

    // 특정 권한 검증 미들웨어
    hasPermission(permission) {
        return async (req, res, next) => {
            try {
                const userId = req.user.id;
                const groupId = req.params.groupId;

                // 사용자의 권한 조회
                const [permissions] = await db.execute(
                    'SELECT permissions FROM group_member_permissions WHERE user_id = ? AND group_id = ?',
                    [userId, groupId]
                );

                if (permissions.length === 0 || !permissions[0].permissions.includes(permission)) {
                    return res.status(403).json({
                        success: false,
                        message: '필요한 권한이 없습니다.'
                    });
                }

                next();
            } catch (error) {
                console.error('권한 검증 오류:', error);
                res.status(500).json({
                    success: false,
                    message: '권한 검증에 실패했습니다.'
                });
            }
        };
    }
}

module.exports = new RoleMiddleware();