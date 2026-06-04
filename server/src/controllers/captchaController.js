import * as captchaService from "../services/captchaService.js";

async function getCaptcha(_req, res, next) {
	try {
		const result = captchaService.generateCaptcha();
		res.json({
			success: true,
			data: result,
			message: "验证码生成成功",
		});
	} catch (error) {
		next(error);
	}
}

export { getCaptcha };