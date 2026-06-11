/**
 * 创建管理员账号脚本
 * 执行方式：node scripts/create-admin.js
 * 默认账号：admin@nomadnotes.com / Admin@123456
 */

import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT || "3306", 10),
	dialect: "mysql",
	logging: false,
});

async function createAdmin() {
	try {
		const email = "admin@nomadnotes.com";
		const username = "admin";
		const password = "Admin@123456";

		// 检查是否已存在
		const existing = await User.findOne({ where: { email } });
		if (existing) {
			console.log(`管理员账号已存在：${email}`);
			console.log(`如需重置密码，请先删除该账号再重新创建`);
			await sequelize.close();
			return;
		}

		const passwordHash = await bcrypt.hash(password, 10);

		await User.create({
			username,
			email,
			passwordHash,
			role: "admin",
			isDisabled: 0,
		});

		console.log("管理员账号创建成功！");
		console.log(`邮箱：${email}`);
		console.log(`密码：${password}`);
		console.log("请使用该账号登录系统，即可访问管理界面。");
	} catch (error) {
		console.error("创建管理员账号失败:", error.message);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

createAdmin();
