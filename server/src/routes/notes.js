import { Router } from "express";
import * as noteController from "../controllers/noteController.js";
import * as exportController from "../controllers/exportController.js";
import { auth } from "../middleware/auth.js";

const tripRouter = Router();
const resourceRouter = Router();

tripRouter.use(auth);

tripRouter.post("/:tripId/notes", noteController.createNote);
tripRouter.get("/:tripId/notes", noteController.getTripNotes);
// 游记导出路由
tripRouter.get("/:tripId/notes/export", exportController.exportTripNotes);

resourceRouter.use(auth);

resourceRouter.get("/:id", noteController.getNoteById);
resourceRouter.delete("/:id", noteController.deleteNote);
resourceRouter.patch("/:id", noteController.updateNote);

export { tripRouter, resourceRouter };