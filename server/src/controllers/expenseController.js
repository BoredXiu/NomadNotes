import * as expenseService from '../services/expenseService.js';

async function createExpense(req, res, next) {
  try {
    const expenseData = {
      category: req.body.category,
      amount: req.body.amount,
      expenseDate: req.body.expenseDate,
      note: req.body.note || null,
      receiptImage: req.file ? '/uploads/images/' + req.file.filename : null,
    };

    const expense = await expenseService.createExpense(
      req.params.tripId,
      req.userId,
      expenseData
    );
    res.status(201).json({
      success: true,
      data: expense,
      message: '账单创建成功',
    });
  } catch (error) {
    next(error);
  }
}

async function getTripExpenses(req, res, next) {
  try {
    const result = await expenseService.getTripExpenses(
      req.params.tripId,
      req.userId,
      req.query
    );
    res.json({
      success: true,
      data: result,
      message: 'success',
    });
  } catch (error) {
    next(error);
  }
}

async function getExpenseStats(req, res, next) {
  try {
    const result = await expenseService.getExpenseStats(
      req.params.tripId,
      req.userId
    );
    res.json({
      success: true,
      data: result,
      message: 'success',
    });
  } catch (error) {
    next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.userId);
    res.json({
      success: true,
      data: result,
      message: '账单已删除',
    });
  } catch (error) {
    next(error);
  }
}

export { createExpense, getTripExpenses, getExpenseStats, deleteExpense };