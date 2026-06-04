import { Router } from "express";
import * as captchaController from "../controllers/captchaController.js";

const router = Router();

router.get("/", captchaController.getCaptcha);

export default router;