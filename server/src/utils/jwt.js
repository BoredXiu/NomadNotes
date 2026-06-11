import jwt from "jsonwebtoken";

function generateAccessToken(userId, role) {
	return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
	});
}

function generateRefreshToken(userId, role) {
	return jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
	});
}

function verifyAccessToken(token) {
	return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
	return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
