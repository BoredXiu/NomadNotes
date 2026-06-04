import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

async function register({ username, email, password }) {
	const existingUser = await User.findOne({
		where: { email },
	});
	if (existingUser) {
		throw new AppError("该邮箱已被注册", 409);
	}

	const existingUsername = await User.findOne({
		where: { username },
	});
	if (existingUsername) {
		throw new AppError("用户名已被占用", 409);
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({
		username,
		email,
		passwordHash,
	});

	const accessToken = generateAccessToken(user.id);
	const refreshToken = generateRefreshToken(user.id);

	return {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
			address: user.address,
			gender: user.gender,
		},
		accessToken,
		refreshToken,
	};
}

async function login({ account, password }) {
	const user = await User.findOne({
		where: {
			[Op.or]: [{ email: account }, { username: account }],
		},
	});
	if (!user) {
		throw new AppError("邮箱或用户名或密码错误", 401);
	}

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	if (!isPasswordValid) {
		throw new AppError("邮箱或用户名或密码错误", 401);
	}

	const accessToken = generateAccessToken(user.id);
	const refreshToken = generateRefreshToken(user.id);

	return {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
			address: user.address,
			gender: user.gender,
		},
		accessToken,
		refreshToken,
	};
}

async function refreshToken(token) {
	let decoded;
	try {
		decoded = verifyRefreshToken(token);
	} catch (error) {
		throw new AppError("无效的 refresh token", 401);
	}

	const user = await User.findByPk(decoded.userId);
	if (!user) {
		throw new AppError("用户不存在", 404);
	}

	const accessToken = generateAccessToken(user.id);
	const newRefreshToken = generateRefreshToken(user.id);

	return {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
			address: user.address,
			gender: user.gender,
		},
		accessToken,
		refreshToken: newRefreshToken,
	};
}

export { register, login, refreshToken };
