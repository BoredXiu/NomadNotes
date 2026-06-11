import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { sequelize } from "./config/database.js";
import "./models/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startCleanupScheduler } from "./services/cleanupScheduler.js";
import { startTripStatusScheduler } from "./services/tripStatusScheduler.js";
import authRoutes from "./routes/auth.js";
import captchaRoutes from "./routes/captcha.js";
import tripRoutes from "./routes/trips.js";
import { tripRouter as expenseTripRouter, resourceRouter as expenseResourceRouter } from "./routes/expenses.js";
import { tripRouter as noteTripRouter, resourceRouter as noteResourceRouter } from "./routes/notes.js";
import uploadRoutes from "./routes/upload.js";
import profileRoutes from "./routes/profile.js";
import geocodeRoutes from "./routes/geocode.js";
import currencyRoutes from "./routes/currency.js";
import searchRoutes from "./routes/search.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const app = express();

process.on("uncaughtException", (error) => {
	console.error("[UNCAUGHT EXCEPTION]", new Date().toISOString(), error);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	console.error("[UNHANDLED REJECTION]", new Date().toISOString(), reason);
});

const memoryMonitor = setInterval(() => {
	const usage = process.memoryUsage();
	const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
	const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
	if (heapUsedMB > 500) {
		console.warn(`[MEMORY WARNING] 堆内存使用: ${heapUsedMB}MB / ${heapTotalMB}MB`);
	}
}, 300000);

const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "请求过于频繁，请稍后再试" },
});

app.use(helmet());
app.use(compression());

app.use((req, _res, next) => {
	const start = Date.now();
	const originalEnd = _res.end;
	const originalJson = _res.json;

	_res.json = function (body) {
		_res.locals.responseBody = body;
		return originalJson.call(this, body);
	};

	_res.end = function (...args) {
		const duration = Date.now() - start;
		const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`;
		if (_res.statusCode >= 400) {
			console.error(logLine);
		} else {
			console.log(logLine);
		}
		return originalEnd.apply(this, args);
	};
	next();
});

app.use(generalLimiter);

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
	"/uploads",
	express.static(join(__dirname, "..", "uploads"), {
		maxAge: "7d",
		etag: true,
		lastModified: true,
	}),
);

app.use("/api/auth", authRoutes);
app.use("/api/captcha", captchaRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trips", expenseTripRouter);
app.use("/api/trips", noteTripRouter);
app.use("/api/expenses", expenseResourceRouter);
app.use("/api/notes", noteResourceRouter);
app.use("/api/upload", uploadRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", async (_req, res) => {
	try {
		await sequelize.authenticate();
		const memoryUsage = process.memoryUsage();
		res.json({
			success: true,
			message: "NomadNotes API is running",
			data: {
				uptime: Math.floor(process.uptime()),
				memory: {
					heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
					heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
				},
				database: "connected",
				nodeVersion: process.version,
			},
		});
	} catch {
		res.status(503).json({
			success: false,
			message: "服务不可用：数据库连接失败",
			data: {
				uptime: Math.floor(process.uptime()),
				database: "disconnected",
			},
		});
	}
});

app.use(errorHandler);

const PORT = process.env.PORT || 3434;

async function start() {
	try {
		await sequelize.authenticate();
		console.log("数据库连接成功");

		await sequelize.sync();
		console.log("数据库模型同步成功");

		app.listen(PORT, () => {
			console.log(`服务器运行在 http://localhost:${PORT}`);
			startCleanupScheduler();
			startTripStatusScheduler();
		});
	} catch (error) {
		console.error("启动失败:", error);
		process.exit(1);
	}
}

start();

export { app };
