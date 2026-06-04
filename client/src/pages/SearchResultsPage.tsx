import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
	Card,
	List,
	Tag,
	Select,
	Pagination,
	Empty,
	Spin,
	Space,
	Typography,
} from "antd";
import {
	FileTextOutlined,
	EnvironmentOutlined,
	DollarOutlined,
	ClockCircleOutlined,
} from "@ant-design/icons";
import { search } from "../api/search";
import type { SearchResultItem } from "../types";

const { Text, Paragraph } = Typography;
const PAGE_SIZE = 10;

// 范围选项
const SCOPE_OPTIONS = [
	{ value: "all", label: "全部" },
	{ value: "trips", label: "旅程" },
	{ value: "notes", label: "游记" },
	{ value: "expenses", label: "账单" },
];

// 排序选项
const SORT_OPTIONS = [
	{ value: "relevance", label: "按相关性" },
	{ value: "date", label: "按时间" },
	{ value: "popularity", label: "按热度" },
];

// 关键词高亮组件
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
	if (!keyword || !text) return <span>{text}</span>;

	const lowerText = text.toLowerCase();
	const lowerKw = keyword.toLowerCase();
	const parts: { text: string; highlight: boolean }[] = [];
	let lastIndex = 0;

	while (lastIndex < text.length) {
		const index = lowerText.indexOf(lowerKw, lastIndex);
		if (index === -1) {
			parts.push({ text: text.slice(lastIndex), highlight: false });
			break;
		}
		if (index > lastIndex) {
			parts.push({ text: text.slice(lastIndex, index), highlight: false });
		}
		parts.push({
			text: text.slice(index, index + keyword.length),
			highlight: true,
		});
		lastIndex = index + keyword.length;
	}

	return (
		<span>
			{parts.map((part, i) =>
				part.highlight ? (
					<mark
						key={i}
						style={{
							background: "#fff3b0",
							padding: "0 2px",
							borderRadius: 2,
						}}
					>
						{part.text}
					</mark>
				) : (
					<span key={i}>{part.text}</span>
				),
			)}
		</span>
	);
}

/**
 * 搜索结果页面
 * 展示分类的搜索结果，支持排序和分页
 */
const SearchResultsPage: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const query = searchParams.get("q") || "";
	const [scope, setScope] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("relevance");
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [loading, setLoading] = useState(false);

	// 执行搜索
	const doSearch = useCallback(async () => {
		if (!query.trim()) {
			setResults([]);
			setTotal(0);
			return;
		}
		setLoading(true);
		try {
			const data = await search({
				q: query,
				scope: scope as "all" | "trips" | "notes" | "expenses",
				sortBy: sortBy as "relevance" | "date" | "popularity",
				page,
				pageSize: PAGE_SIZE,
			});
			setResults(data.list as SearchResultItem[]);
			setTotal(data.total);
		} catch {
			setResults([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [query, scope, sortBy, page]);

	useEffect(() => {
		doSearch();
	}, [doSearch]);

	// 范围切换
	const handleScopeChange = (value: string) => {
		setScope(value);
		setPage(1);
	};

	// 排序切换
	const handleSortChange = (value: string) => {
		setSortBy(value);
		setPage(1);
	};

	// 跳转到详情
	const handleItemClick = (item: SearchResultItem) => {
		if (item.type === "trip") {
			navigate(`/trip/${item.id}`);
		} else if (item.type === "note" && item.tripId) {
			navigate(`/trip/${item.tripId}?tab=notes`);
		} else if (item.type === "expense" && item.tripId) {
			navigate(`/trip/${item.tripId}?tab=expenses`);
		}
	};

	// 渲染结果图标
	const renderTypeIcon = (type: string) => {
		switch (type) {
			case "trip":
				return <EnvironmentOutlined style={{ color: "#1890ff" }} />;
			case "note":
				return <FileTextOutlined style={{ color: "#722ed1" }} />;
			case "expense":
				return <DollarOutlined style={{ color: "#52c41a" }} />;
			default:
				return null;
		}
	};

	// 渲染类型标签
	const renderTypeTag = (type: string) => {
		const config: Record<string, { color: string; label: string }> = {
			trip: { color: "blue", label: "旅程" },
			note: { color: "purple", label: "游记" },
			expense: { color: "green", label: "账单" },
		};
		const c = config[type] || { color: "default", label: type };
		return (
			<Tag color={c.color} style={{ fontSize: 11 }}>
				{c.label}
			</Tag>
		);
	};

	// 渲染搜索结果项
	const renderItem = (item: SearchResultItem) => {
		switch (item.type) {
			case "trip":
				return (
					<List.Item
						onClick={() => handleItemClick(item)}
						style={{ cursor: "pointer", padding: "12px 0" }}
					>
						<List.Item.Meta
							avatar={renderTypeIcon(item.type)}
							title={
								<Space>
									{renderTypeTag(item.type)}
									<HighlightText text={item.title || ""} keyword={query} />
								</Space>
							}
							description={
								<Space direction="vertical" size={2}>
									<Text type="secondary">
										<EnvironmentOutlined />{" "}
										<HighlightText
											text={item.destination || ""}
											keyword={query}
										/>
									</Text>
									{item.username && (
										<Text type="secondary" style={{ fontSize: 12 }}>
											作者: {item.username}
										</Text>
									)}
								</Space>
							}
						/>
					</List.Item>
				);

			case "note":
				return (
					<List.Item
						onClick={() => handleItemClick(item)}
						style={{ cursor: "pointer", padding: "12px 0" }}
					>
						<List.Item.Meta
							avatar={renderTypeIcon(item.type)}
							title={
								<Space>
									{renderTypeTag(item.type)}
									<Text strong>{item.tripTitle}</Text>
								</Space>
							}
							description={
								<Space direction="vertical" size={2}>
									<Paragraph
										ellipsis={{ rows: 2 }}
										style={{ marginBottom: 0, color: "#666" }}
									>
										<HighlightText text={item.content || ""} keyword={query} />
									</Paragraph>
									<Text type="secondary" style={{ fontSize: 12 }}>
										<ClockCircleOutlined />{" "}
										{item.noteDate
											? new Date(item.noteDate).toLocaleDateString("zh-CN")
											: ""}
									</Text>
								</Space>
							}
						/>
					</List.Item>
				);

			case "expense":
				return (
					<List.Item
						onClick={() => handleItemClick(item)}
						style={{ cursor: "pointer", padding: "12px 0" }}
					>
						<List.Item.Meta
							avatar={renderTypeIcon(item.type)}
							title={
								<Space>
									{renderTypeTag(item.type)}
									<Text strong>{item.tripTitle}</Text>
								</Space>
							}
							description={
								<Space direction="vertical" size={2}>
									<Space>
										<Tag color="orange">{item.category}</Tag>
										<Text strong style={{ color: "#f5222d" }}>
											¥{item.amount}
										</Text>
									</Space>
									{item.note && (
										<Text type="secondary" style={{ fontSize: 12 }}>
											<HighlightText text={item.note} keyword={query} />
										</Text>
									)}
								</Space>
							}
						/>
					</List.Item>
				);

			default:
				return null;
		}
	};

	return (
		<div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>
			{/* 搜索标题 */}
			<div style={{ marginBottom: 24 }}>
				<Text
					strong
					style={{ fontSize: 20, display: "block", marginBottom: 4 }}
				>
					搜索结果: "{query}"
				</Text>
				<Text type="secondary">共找到 {total} 条结果</Text>
			</div>

			{/* 筛选和排序 */}
			<Card size="small" style={{ marginBottom: 16 }}>
				<Space wrap>
					<Text type="secondary">范围:</Text>
					<Select
						value={scope}
						onChange={handleScopeChange}
						options={SCOPE_OPTIONS}
						size="small"
						style={{ width: 100 }}
					/>
					<Text type="secondary">排序:</Text>
					<Select
						value={sortBy}
						onChange={handleSortChange}
						options={SORT_OPTIONS}
						size="small"
						style={{ width: 120 }}
					/>
				</Space>
			</Card>

			{/* 搜索结果列表 */}
			<Spin spinning={loading}>
				{results.length > 0 ? (
					<List
						dataSource={results}
						renderItem={renderItem}
						split
						locale={{ emptyText: <Empty description="未找到匹配结果" /> }}
					/>
				) : query && !loading ? (
					<Empty description="未找到匹配结果" style={{ marginTop: 60 }} />
				) : !query ? (
					<Empty description="请输入搜索关键词" style={{ marginTop: 60 }} />
				) : null}
			</Spin>

			{/* 分页 */}
			{total > PAGE_SIZE && (
				<div style={{ textAlign: "center", marginTop: 24 }}>
					<Pagination
						current={page}
						total={total}
						pageSize={PAGE_SIZE}
						onChange={setPage}
						showSizeChanger={false}
						showTotal={(t) => `共 ${t} 条`}
					/>
				</div>
			)}
		</div>
	);
};

export default SearchResultsPage;