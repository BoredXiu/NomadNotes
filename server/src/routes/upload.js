import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as uploadController from "../controllers/uploadController.js";

const router = Router();

router.use(auth);

router.post("/", upload.single("file"), (req, res) => {
	if (!req.file) {
		return res.status(400).json({
			success: false,
			data: null,
			message: "请选择文件",
		});
	}
	const url = "/uploads/images/" + req.file.filename;
	res.json({
		success: true,
		data: { url },
		message: "上传成功",
	});
});

router.post("/tmp", upload.array("images", 10), uploadController.uploadTmp);
router.post("/persist", uploadController.moveToPermanent);

export default router;
