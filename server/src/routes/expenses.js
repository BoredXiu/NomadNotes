import { Router } from "express";
import * as expenseController from "../controllers/expenseController.js";
import { auth } from "../middleware/auth.js";

const tripRouter = Router();
const resourceRouter = Router();

tripRouter.use(auth);

tripRouter.post("/:tripId/expenses", expenseController.createExpense);
tripRouter.get("/:tripId/expenses", expenseController.getTripExpenses);
tripRouter.get("/:tripId/expenses/stats", expenseController.getExpenseStats);

resourceRouter.use(auth);

resourceRouter.get("/:id", expenseController.getExpenseById);
resourceRouter.delete("/:id", expenseController.deleteExpense);
resourceRouter.patch("/:id", expenseController.updateExpense);

export { tripRouter, resourceRouter };