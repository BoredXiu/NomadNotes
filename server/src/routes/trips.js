import { Router } from "express";
import * as tripController from "../controllers/tripController.js";
import { auth } from "../middleware/auth.js";
import * as adminController from "../controllers/adminController.js";
import * as dataExportController from "../controllers/dataExportController.js";
import { validateEndAfterStart } from "../middleware/validateTimeRange.js";

const router = Router();

router.get("/public", tripController.getPublicTrips);
router.get("/public/:id", tripController.getPublicTripById);

router.use(auth);

router.post("/", validateEndAfterStart("startDate", "endDate"), tripController.createTrip);
router.get("/", tripController.getUserTrips);
router.get("/:id", tripController.getTripById);
router.patch("/:id", validateEndAfterStart("startDate", "endDate"), tripController.updateTrip);
router.delete("/:id", tripController.deleteTrip);

// 数据导出（JSON 格式，导出账单和游记）
router.get("/:tripId/export", dataExportController.exportTripDataJson);
router.get("/:tripId/export/count", dataExportController.getExportDataCount);

// 提交旅程公开审核申请（用户点击"公开"按钮时调用）
router.post("/:id/submit-audit", adminController.submitAuditByTripParam);

export default router;
