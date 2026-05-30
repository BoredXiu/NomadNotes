import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/register',
  [
    body('username').isLength({ min: 2, max: 50 }).withMessage('用户名长度需在 2-50 之间'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').isLength({ min: 6 }).withMessage('密码长度至少 6 位'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  authController.login
);

router.post('/refresh', authController.refresh);

export default router;