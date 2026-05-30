import * as tripService from "../services/tripService.js";

async function createTrip(req, res, next) {
	try {
		const trip = await tripService.createTrip({
			userId: req.userId,
			...req.body,
		});
		res.status(201).json({
			success: true,
			data: trip,
			message: "旅程创建成功",
		});
	} catch (error) {
		next(error);
	}
}

async function getUserTrips(req, res, next) {
	try {
		const result = await tripService.getUserTrips(req.userId, req.query);
		res.json({
			success: true,
			data: result,
			message: "success",
		});
	} catch (error) {
		next(error);
	}
}

async function getTripById(req, res, next) {
	try {
		const trip = await tripService.getTripById(req.params.id, req.userId);
		res.json({
			success: true,
			data: trip,
			message: "success",
		});
	} catch (error) {
		next(error);
	}
}

async function updateTrip(req, res, next) {
	try {
		const trip = await tripService.updateTrip(req.params.id, req.userId, req.body);
		res.json({
			success: true,
			data: trip,
			message: "旅程更新成功",
		});
	} catch (error) {
		next(error);
	}
}

async function deleteTrip(req, res, next) {
	try {
		const result = await tripService.deleteTrip(req.params.id, req.userId);
		res.json({
			success: true,
			data: result,
			message: "旅程已删除",
		});
	} catch (error) {
		next(error);
	}
}

async function getPublicTrips(req, res, next) {
	try {
		const result = await tripService.getPublicTrips(req.query);
		res.json({
			success: true,
			data: result,
			message: "success",
		});
	} catch (error) {
		next(error);
	}
}

async function getPublicTripById(req, res, next) {
	try {
		const trip = await tripService.getPublicTripById(req.params.id);
		res.json({
			success: true,
			data: trip,
			message: "success",
		});
	} catch (error) {
		next(error);
	}
}

export { createTrip, getUserTrips, getTripById, updateTrip, deleteTrip, getPublicTrips, getPublicTripById };
