import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as uploadController from "../controllers/uploadController.js";

const router = Router();

router.use(auth);

router.post("/", upload.single("file"), uploadController.uploadTmpSingle);

router.post("/tmp", upload.array("images", 10), uploadController.uploadTmp);
router.post("/persist", uploadController.moveToPermanent);
router.post("/persist-single", uploadController.moveToPermanentSingle);

export default router;