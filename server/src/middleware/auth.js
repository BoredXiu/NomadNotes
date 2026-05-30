import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

function auth(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new AppError("请先登录", 401);
		}

		const token = authHeader.split(" ")[1];
		const decoded = verifyAccessToken(token);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return next(new AppError("token 已过期", 401));
		}
		if (error.name === "JsonWebTokenError") {
			return next(new AppError("无效的 token", 401));
		}
		next(error);
	}
}

export { auth };
