import { Router } from "express";
import * as tripController from "../controllers/tripController.js";
import { auth } from "../middleware/auth.js";
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

export default router;
