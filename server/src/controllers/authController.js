import * as authService from '../services/authService.js';
import { validationResult } from 'express-validator';

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: errors.array().map((e) => e.msg).join('; '),
      });
    }

    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功',
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: errors.array().map((e) => e.msg).join('; '),
      });
    }

    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
      message: '登录成功',
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '请提供 refreshToken',
      });
    }

    const result = await authService.refreshToken(refreshToken);
    res.json({
      success: true,
      data: result,
      message: 'token 已刷新',
    });
  } catch (error) {
    next(error);
  }
}

export { register, login, refresh };