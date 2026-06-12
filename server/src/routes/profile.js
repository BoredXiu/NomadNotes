import { Router } from 'express';
import * as profileController from '../controllers/profileController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.patch('/password', profileController.changePassword);

export default router;