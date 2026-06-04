import React, { useEffect, useState, useCallback } from "react";
import { Select, Space } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { getCurrencyRates } from "../api/currency";
import { useCurrencyStore } from "../store/currencyStore";
import type { CurrencyInfo } from "../types";

/**
 * 货币切换组件
 * 提供货币选择和自动转换显示
 */
const CurrencySwitcher: React.FC<{ style?: React.CSSProperties; size?: "small" | "middle" | "large" }> = ({
	style,
	size = "small",
}) => {
	const { currency, setCurrency, setRates, loading, setLoading } = useCurrencyStore();
	const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);

	// 加载汇率数据
	const loadRates = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getCurrencyRates();
			setRates(data.rates);
			setCurrencies(data.currencies);
		} catch (error: unknown) {
			console.error("获取汇率失败:", error);
		} finally {
			setLoading(false);
		}
	}, [setLoading, setRates]);

	useEffect(() => {
		loadRates();
	}, [loadRates]);

	// 构建下拉选项
	const options = currencies.map((c) => ({
		value: c.code,
		label: (
			<span>
				{c.symbol} {c.code} - {c.name}
			</span>
		),
	}));

	return (
		<Space size={4} style={style}>
			<DollarOutlined style={{ color: "#52c41a", fontSize: size === "large" ? 18 : 14 }} />
			<Select
				value={currency}
				onChange={(val) => setCurrency(val)}
				options={options}
				loading={loading}
				size={size}
				style={{ minWidth: 130 }}
				popupMatchSelectWidth={false}
				variant="borderless"
			/>
		</Space>
	);
};

export default CurrencySwitcher;