import { Router } from "express";
import * as noteController from "../controllers/noteController.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const tripRouter = Router();
const resourceRouter = Router();

tripRouter.use(auth);

tripRouter.post(
	"/:tripId/notes",
	(req, res, next) => {
		if (req.is("multipart/form-data")) {
			upload.array("images", 10)(req, res, next);
		} else {
			next();
		}
	},
	noteController.createNote,
);
tripRouter.get("/:tripId/notes", noteController.getTripNotes);

resourceRouter.use(auth);

resourceRouter.delete("/:id", noteController.deleteNote);

export { tripRouter, resourceRouter };
