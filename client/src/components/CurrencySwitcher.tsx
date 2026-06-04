import React, { useEffect, useState, useCallback } from "react";
import { Select, Button, Tooltip, Space, message } from "antd";
import { ReloadOutlined, DollarOutlined } from "@ant-design/icons";
import { getCurrencyRates, refreshCurrencyRates } from "../api/currency";
import { useCurrencyStore } from "../store/currencyStore";
import type { CurrencyInfo } from "../types";

/**
 * 货币切换组件
 * 集成在 Header 或价格显示区域，提供货币切换和汇率刷新
 */
const CurrencySwitcher: React.FC<{ showRefresh?: boolean; style?: React.CSSProperties }> = ({
	showRefresh = true,
	style,
}) => {
	const { currency, setCurrency, setRates, rates, loading, setLoading } = useCurrencyStore();
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
			// 静默失败，使用缓存或默认值
		} finally {
			setLoading(false);
		}
	}, [setLoading, setRates]);

	// 刷新汇率
	const handleRefresh = async () => {
		try {
			setLoading(true);
			const data = await refreshCurrencyRates();
			setRates(data.rates);
			setCurrencies(data.currencies);
			message.success("汇率已刷新");
		} catch {
			message.error("汇率刷新失败");
		} finally {
			setLoading(false);
		}
	};

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
			<DollarOutlined style={{ color: "#52c41a", fontSize: 14 }} />
			<Select
				value={currency}
				onChange={(val) => setCurrency(val)}
				options={options}
				loading={loading}
				size="small"
				style={{ minWidth: 130 }}
				popupMatchSelectWidth={false}
				variant="borderless"
			/>
			{showRefresh && (
				<Tooltip title="刷新汇率">
					<Button
						type="text"
						size="small"
						icon={<ReloadOutlined spin={loading} />}
						onClick={handleRefresh}
						loading={loading}
					/>
				</Tooltip>
			)}
		</Space>
	);
};

export default CurrencySwitcher;