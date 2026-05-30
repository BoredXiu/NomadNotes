import * as uploadService from "../services/uploadService.js";

async function uploadTmp(req, res, next) {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				data: null,
				message: "请选择文件",
			});
		}

		const results = [];
		for (const file of req.files) {
			const result = await uploadService.vectorizeAndSaveTemp(file.path, file.originalname);
			results.push(result);
		}

		res.json({
			success: true,
			data: results,
			message: "临时上传成功",
		});
	} catch (error) {
		next(error);
	}
}

async function moveToPermanent(req, res, next) {
	try {
		const { files } = req.body;
		if (!files || !Array.isArray(files)) {
			return res.status(400).json({
				success: false,
				data: null,
				message: "请提供文件信息",
			});
		}

		const results = [];
		for (const file of files) {
			const result = await uploadService.moveFromTmpToPermanent(file.fileId, file.ext);
			results.push(result);
		}

		res.json({
			success: true,
			data: results,
			message: "文件已持久化",
		});
	} catch (error) {
		next(error);
	}
}

export { uploadTmp, moveToPermanent };
