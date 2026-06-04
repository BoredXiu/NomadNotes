import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input, AutoComplete, Grid } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "../api/search";

// 防抖延迟
const DEBOUNCE_MS = 300;

/**
 * 全局搜索栏组件
 * 提供搜索输入、自动补全建议功能
 */
const SearchBar: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
	const [keyword, setKeyword] = useState("");
	const [suggestions, setSuggestions] = useState<{ label: React.ReactNode; value: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const navigate = useNavigate();
	const screens = Grid.useBreakpoint();

	// 获取搜索建议
	const fetchSuggestions = useCallback(async (query: string) => {
		if (!query || query.trim().length < 1) {
			setSuggestions([]);
			return;
		}
		setLoading(true);
		try {
			const data = await getSearchSuggestions(query);
			setSuggestions(
				data.map((item) => ({
					value: item.text,
					label: (
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<span>{item.text}</span>
							<span
								style={{
									fontSize: 12,
									color: "#999",
									padding: "0 4px",
									background: "#f5f5f5",
									borderRadius: 2,
								}}
							>
								{item.type === "trip" ? "旅程" : "目的地"}
							</span>
						</div>
					),
				})),
			);
		} catch {
			setSuggestions([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// 防抖输入处理
	const handleInputChange = (value: string) => {
		setKeyword(value);
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}
		debounceTimer.current = setTimeout(() => {
			fetchSuggestions(value);
		}, DEBOUNCE_MS);
	};

	// 选择建议
	const handleSelect = (value: string) => {
		setKeyword(value);
		navigate(`/search?q=${encodeURIComponent(value)}`);
	};

	// 提交搜索
	const handleSearch = () => {
		const trimmed = keyword.trim();
		if (!trimmed) return;
		navigate(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	// 回车搜索
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// 清理定时器
	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}
		};
	}, []);

	const isMobile = !screens.md;

	return (
		<AutoComplete
			value={keyword}
			options={loading ? [{ value: "", label: "搜索中..." }] : suggestions}
			onChange={handleInputChange}
			onSelect={handleSelect}
			style={{ width: isMobile ? 120 : 200, ...style }}
			popupMatchSelectWidth={false}
		>
			<Input
				placeholder={isMobile ? "搜索" : "搜索游记、账单..."}
				prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
				onKeyDown={handleKeyDown}
				allowClear
				variant="filled"
			/>
		</AutoComplete>
	);
};

export default SearchBar;