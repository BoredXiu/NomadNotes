import svgCaptcha from "svg-captcha";

const captchaStore = new Map();

const CAPTCHA_EXPIRY = 5 * 60 * 1000;

function generateCaptcha() {
	const captcha = svgCaptcha.create({
		size: 4,
		ignoreChars: "0o1il",
		noise: 3,
		color: true,
		background: "#f0f2f5",
		width: 120,
		height: 44,
		fontSize: 40,
	});

	const captchaId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

	captchaStore.set(captchaId, {
		text: captcha.text.toLowerCase(),
		expiresAt: Date.now() + CAPTCHA_EXPIRY,
	});

	return {
		captchaId,
		svg: captcha.data,
	};
}

function verifyCaptcha(captchaId, text) {
	const record = captchaStore.get(captchaId);
	if (!record) {
		return { valid: false, message: "验证码已过期，请刷新后重试" };
	}

	captchaStore.delete(captchaId);

	if (Date.now() > record.expiresAt) {
		return { valid: false, message: "验证码已过期，请刷新后重试" };
	}

	if (record.text !== text.toLowerCase().trim()) {
		return { valid: false, message: "验证码错误" };
	}

	return { valid: true };
}

function cleanupExpiredCaptchas() {
	const now = Date.now();
	for (const [id, record] of captchaStore) {
		if (now > record.expiresAt) {
			captchaStore.delete(id);
		}
	}
}

setInterval(cleanupExpiredCaptchas, 10 * 60 * 1000);

export { generateCaptcha, verifyCaptcha };