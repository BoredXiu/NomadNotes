import React, { useState, useRef, useCallback, useMemo } from "react";
import { Input, Button, Grid } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// 搜索触发去抖延迟（ms），防止快速点击/回车引起重复导航
const SEARCH_DEBOUNCE_MS = 400;
// 跳转后 loading 重置延迟
const LOADING_RESET_MS = 600;

/**
 * 全局搜索栏组件
 * 用户主动触发搜索机制（点击搜索按钮或按下 Enter 键），无实时自动补全
 * 包含去抖处理、loading 状态反馈
 * @param inline 内联搜索模式：在页面内过滤数据而非跳转到搜索结果页
 * @param onSearch inline 模式下的搜索回调
 */
const SearchBar: React.FC<{
    style?: React.CSSProperties;
    inline?: boolean;
    onSearch?: (keyword: string) => void;
}> = ({ style, inline, onSearch }) => {
    const [keyword, setKeyword] = useState("");
    const [searching, setSearching] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = useMemo(() => !screens.md, [screens.md]);

    // 容器宽度（rem: 1rem = 16px）
    const containerWidth = useMemo(() => (isMobile ? '11.25rem' : '16.25rem'), [isMobile]);  // 180px, 260px

    /**
     * 触发搜索：去抖后跳转到搜索结果页
     * searching 状态防止重复触发，按钮展示 loading 图标
     */
    const handleSearch = useCallback(() => {
        const trimmed = keyword.trim();
        if (!trimmed || searching) return;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // 内联搜索模式：不跳转，由父组件消费搜索词过滤数据
        if (inline && onSearch) {
            onSearch(trimmed);
            return;
        }

        setSearching(true);
        debounceTimer.current = setTimeout(() => {
            navigate(`/search?q=${encodeURIComponent(trimmed)}`);
            // 路由跳转完成后重置 loading 状态
            setTimeout(() => {
                setSearching(false);
            }, LOADING_RESET_MS);
        }, SEARCH_DEBOUNCE_MS);
    }, [keyword, searching, inline, onSearch, navigate]);

    // Enter 键触发搜索
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
            }
        },
        [handleSearch],
    );

    // 输入变化
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
    }, []);

    // 清空输入时重置状态
    const handleClear = useCallback(() => {
        setKeyword("");
        setSearching(false);
        if (inline && onSearch) {
            onSearch("");
        }
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
    }, [inline, onSearch]);

    return (
        <div style={{ display: "flex", justifyContent: "flex-end", ...style }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: '0.5rem',    // 8px
                    overflow: "hidden",
                    border: "0.0625rem solid #d9d9d9",  // 1px
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    width: containerWidth,
                }}
            >
                <Input
                    value={keyword}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isMobile ? "搜索" : "搜索游记、账单..."}
                    prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    allowClear
                    onClear={handleClear}
                    variant="filled"
                    style={{
                        borderRadius: '0.5rem 0 0 0.5rem',  // 8px 0 0 8px
                        border: "none",
                        boxShadow: "none",
                        flex: 1,
                    }}
                />
                <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    loading={searching}
                    disabled={!keyword.trim()}
                    onClick={handleSearch}
                    style={{
                        borderRadius: '0 0.5rem 0.5rem 0',  // 0 8px 8px 0
                        border: "none",
                        height: '2rem',      // 32px
                        padding: isMobile ? '0 0.625rem' : '0 1rem',  // 10px, 16px
                        flexShrink: 0,
                    }}
                >
                    {!isMobile && "搜索"}
                </Button>
            </div>
        </div>
    );
};

export default SearchBar;