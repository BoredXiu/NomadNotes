import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";

async function auth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("请先登录", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);
        if (!decoded || !decoded.userId) {
            throw new AppError("token 无效或已过期", 401);
        }

        // 检查用户是否已被管理员禁用（实时校验，确保禁用后立即生效）
        const user = await User.findByPk(decoded.userId, {
            attributes: ["isDisabled"],
        });
        if (user && user.isDisabled === 1) {
            throw new AppError("该账号已被管理员禁用，无法继续操作", 403);
        }

        req.userId = decoded.userId;
        req.userRole = decoded.role || "user";
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("token 已过期", 401));
        }
        if (error.name === "JsonWebTokenError") {
            return next(new AppError("无效的 token", 401));
        }
        if (error.name === "NotBeforeError") {
            return next(new AppError("token 尚未生效", 401));
        }
        next(error);
    }
}

/**
 * 可选认证中间件
 * 尝试解析 token 但不强制要求，用于公开/私有混合接口
 */
function optionalAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return next();
		}

		const token = authHeader.split(" ")[1];
		const decoded = verifyAccessToken(token);
		if (decoded && decoded.userId) {
			req.userId = decoded.userId;
		}
	} catch (_error) {
		// 不做任何处理，允许未认证访问
	}
	next();
}

/**
 * 管理员认证中间件
 * 在 auth 中间件之后使用，验证用户角色为 admin
 */
function adminAuth(req, res, next) {
	try {
		if (!req.userRole || req.userRole !== "admin") {
			throw new AppError("需要管理员权限", 403);
		}
		next();
	} catch (error) {
		next(error);
	}
}

export { auth, optionalAuth, adminAuth };
