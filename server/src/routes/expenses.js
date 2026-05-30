import { Router } from "express";
import * as expenseController from "../controllers/expenseController.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const tripRouter = Router();
const resourceRouter = Router();

tripRouter.use(auth);

tripRouter.post("/:tripId/expenses", upload.single("receiptImage"), expenseController.createExpense);
tripRouter.get("/:tripId/expenses", expenseController.getTripExpenses);
tripRouter.get("/:tripId/expenses/stats", expenseController.getExpenseStats);

resourceRouter.use(auth);

resourceRouter.delete("/:id", expenseController.deleteExpense);

export { tripRouter, resourceRouter };
