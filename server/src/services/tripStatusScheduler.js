import { Trip } from "../models/index.js";
import { Op } from "sequelize";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

let intervalId = null;

async function checkAndEndTrips() {
	const now = new Date();
	const logPrefix = `[${now.toISOString()}] 游记状态检查:`;

	try {
		const [affectedRows, affectedTrips] = await Trip.update(
			{ isEnded: 1 },
			{
				where: {
					isEnded: 0,
					endDate: { [Op.lt]: now },
				},
				individualHooks: false,
			}
		);

		if (affectedRows > 0) {
			const endedTrips = await Trip.findAll({
				where: {
					isEnded: 1,
					endDate: { [Op.lt]: now },
				},
				order: [["updatedAt", "DESC"]],
				limit: affectedRows,
				attributes: ["id", "title", "endDate", "updatedAt"],
			});

			for (const trip of endedTrips) {
				console.log(
					`${logPrefix} 游记 [${trip.title}] (ID: ${trip.id}) 结束日期 ${trip.endDate.toISOString().split("T")[0]} 已过，自动标记为已结束`
				);
			}
		}

		console.log(`${logPrefix} 本次更新了 ${affectedRows} 条游记状态`);
	} catch (error) {
		console.error(`${logPrefix} 执行失败:`, error.message);
	}
}

function startTripStatusScheduler() {
	console.log(
		`[游记状态调度器] 已启动，每 ${CHECK_INTERVAL_MS / 60000} 分钟检查一次游记结束状态`
	);

	checkAndEndTrips();

	intervalId = setInterval(() => {
		checkAndEndTrips();
	}, CHECK_INTERVAL_MS);
}

function stopTripStatusScheduler() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
		console.log("[游记状态调度器] 已停止");
	}
}

export { startTripStatusScheduler, stopTripStatusScheduler };