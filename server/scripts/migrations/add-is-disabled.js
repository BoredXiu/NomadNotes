/**
 * 数据库迁移脚本：为 users 表添加 isDisabled 字段
 * 执行方式：node scripts/migrations/add-is-disabled.js
 */

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "3306", 10),
        dialect: "mysql",
        logging: console.log,
    },
);

async function migrate() {
    try {
        console.log("开始迁移：为 users 表添加 isDisabled 字段...");

        await sequelize.query(`
            ALTER TABLE users
            ADD COLUMN isDisabled TINYINT NOT NULL DEFAULT 0
            COMMENT '账号是否被禁用：0 正常，1 已禁用'
            AFTER role;
        `);

        console.log("迁移完成：isDisabled 字段已添加");
    } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
            console.log("isDisabled 字段已存在，跳过迁移");
        } else {
            console.error("迁移失败:", error.message);
            process.exit(1);
        }
    } finally {
        await sequelize.close();
    }
}

migrate();