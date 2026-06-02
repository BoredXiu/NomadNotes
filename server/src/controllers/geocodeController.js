async function reverseGeocode(req, res, next) {
	try {
		const { lat, lon } = req.query;

		if (!lat || !lon) {
			return res.status(400).json({ success: false, message: "缺少经纬度参数" });
		}

		let resp;
		try {
			resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh`, {
				headers: { "User-Agent": "NomadNotes/1.0" },
				signal: AbortSignal.timeout(8000),
			});
		} catch {
			return res.status(502).json({
				success: false,
				message: "无法连接地理编码服务，请检查服务器网络",
			});
		}

		if (!resp.ok) {
			return res.status(502).json({ success: false, message: "地理编码服务暂不可用" });
		}

		const data = await resp.json();

		if (data.error) {
			return res.status(502).json({ success: false, message: data.error });
		}

		const a = data.address;
		let displayName = "";

		if (a) {
			const parts = [];
			const province = a.state || a.province || "";
			const city = a.city || "";
			const county = a.county || a.district || "";
			const street = a.suburb || a.borough || a.town || "";
			if (province) parts.push(province);
			if (city && city !== province) parts.push(city);
			if (county && county !== city && county !== province) parts.push(county);
			if (street && street !== county && street !== city) parts.push(street);
			if (a.village && parts.length < 4) parts.push(a.village);
			displayName = parts.join("");
		}

		if (!displayName) {
			displayName = data.display_name || "";
		}

		res.json({
			success: true,
			data: {
				displayName,
				address: a || null,
			},
		});
	} catch (error) {
		next(error);
	}
}

export { reverseGeocode };
