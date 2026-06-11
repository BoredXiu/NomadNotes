import api from "./client";

/**
 * 逆地理编码响应类型
 */
export interface ReverseGeocodeResponse {
	success: boolean;
	data: {
		displayName: string;
	};
}

/**
 * 逆地理编码（经纬度转地址）
 * 优先使用后端接口，失败时降级到第三方 API
 * @param lat - 纬度
 * @param lon - 经度
 * @returns 地址字符串
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
	try {
		const { data } = await api.get<ReverseGeocodeResponse>("/geocode/reverse", {
			params: { lat, lon },
		});
		if (data.success && data.data.displayName) {
			return data.data.displayName;
		}
	} catch {
		// 后端接口不可用，降级到第三方 API
	}

	try {
		const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
		if (resp.ok) {
			const json = await resp.json();
			const parts: string[] = [];
			if (json.principalSubdivision) parts.push(json.principalSubdivision);
			if (json.city) parts.push(json.city);
			if (json.locality && json.locality !== json.city) parts.push(json.locality);
			return parts.join("");
		}
	} catch {
		// 第三方 API 也失败
	}

	return null;
}
