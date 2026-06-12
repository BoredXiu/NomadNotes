import React, { useState, useEffect, useRef, useCallback } from "react";
import { Badge, Button, List, Popover, Typography, Space, Tag, Empty } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "../../api/notifications";
import type { NotificationItem } from "../../api/notifications";
import NotificationDetailModal from "../NotificationDetailModal";

const { Text, Paragraph } = Typography;

/**
 * 通知铃铛组件
 * 显示在顶部导航栏主题切换按钮左侧
 * 点击后弹出消息中心弹窗，展示通知列表
 */
export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    /** 加载未读数量 */
    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnreadCount(data.count);
        } catch {
            // 静默失败
        }
    }, []);

    /** 加载通知列表 */
    const fetchNotifications = useCallback(async (p: number, append = false) => {
        setLoading(true);
        try {
            const data = await getNotifications(p, 10);
            if (append) {
                setNotifications((prev) => [...prev, ...data.list]);
            } else {
                setNotifications(data.list);
            }
            setHasMore(p * 10 < data.total);
            setPage(p);
        } catch {
            // 静默失败
        } finally {
            setLoading(false);
        }
    }, []);

    /** 打开弹窗时加载通知 */
    const handleOpenChange = async (open: boolean) => {
        setPopoverOpen(open);
        if (open) {
            setPage(1);
            setNotifications([]);
            await fetchNotifications(1, false);
            // 加载后将未读数量重置为 0（UI 层面）
            setUnreadCount(0);
        }
    };

    /** 点击通知项，打开详情模态框 */
    const handleClickItem = async (item: NotificationItem) => {
        setSelectedNotification(item);
        setDetailVisible(true);
        // 标记已读
        if (!item.isRead) {
            try {
                await markAsRead(item.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: 1 } : n)),
                );
            } catch {
                // 静默失败
            }
        }
    };

    /** 标记全部已读 */
    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
            setUnreadCount(0);
        } catch {
            // 静默失败
        }
    };

    /** 加载更多（滚动到底部触发） */
    const handleLoadMore = async () => {
        if (!loading && hasMore) {
            await fetchNotifications(page + 1, true);
        }
    };

    /** 格式化时间 */
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "刚刚";
        if (diffMin < 60) return `${diffMin} 分钟前`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour} 小时前`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay < 7) return `${diffDay} 天前`;
        return date.toLocaleDateString("zh-CN");
    };

    /** 获取通知类型标签 */
    const getTypeTag = (type: string) => {
        if (type === "audit_approved") {
            return <Tag color="success" style={{ margin: 0 }}>已通过</Tag>;
        }
        if (type === "audit_rejected") {
            return <Tag color="error" style={{ margin: 0 }}>已驳回</Tag>;
        }
        return null;
    };

    // 加载未读数量
    useEffect(() => {
        fetchUnreadCount();
        // 每 60 秒轮询未读数
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const content = (
        <div style={{ width: 360, maxHeight: 480 }} ref={listRef}>
            {/* 顶部：标题 + 全部已读 */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderBottom: "0.0625rem solid #f0f0f0",
                }}
            >
                <Text strong style={{ fontSize: "1rem" }}>消息中心</Text>
                {notifications.some((n) => !n.isRead) && (
                    <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={handleMarkAllRead}
                    >
                        全部已读
                    </Button>
                )}
            </div>

            {/* 通知列表 */}
            <div
                style={{
                    overflowY: "auto",
                    maxHeight: 400,
                }}
                onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    // 滚动到底部时加载更多
                    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
                        handleLoadMore();
                    }
                }}
            >
                {notifications.length === 0 && !loading ? (
                    <Empty
                        description="暂无通知"
                        style={{ padding: "2rem 0", margin: 0 }}
                    />
                ) : (
                    <List
                        dataSource={notifications}
                        loading={loading}
                        renderItem={(item) => (
                            <List.Item
                                onClick={() => handleClickItem(item)}
                                style={{
                                    cursor: "pointer",
                                    padding: "0.75rem 1rem",
                                    background: item.isRead ? "transparent" : "#e6f7ff",
                                    borderBottom: "0.0625rem solid #f5f5f5",
                                    transition: "background 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#f0f5ff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = item.isRead
                                        ? "transparent"
                                        : "#e6f7ff";
                                }}
                            >
                                <List.Item.Meta
                                    avatar={getTypeTag(item.type)}
                                    title={
                                        <Space size={4}>
                                            <Text
                                                strong={!item.isRead}
                                                style={{ fontSize: "0.875rem" }}
                                                ellipsis
                                            >
                                                {item.title}
                                            </Text>
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <Paragraph
                                                ellipsis={{ rows: 1 }}
                                                style={{
                                                    margin: 0,
                                                    fontSize: "0.75rem",
                                                    color: "#666",
                                                }}
                                            >
                                                {item.content || "无详细内容"}
                                            </Paragraph>
                                            <Text
                                                style={{
                                                    fontSize: "0.6875rem",
                                                    color: "#999",
                                                }}
                                            >
                                                {formatTime(item.createdAt)}
                                            </Text>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );

    return (
        <>
            <Popover
                content={content}
                trigger="click"
                open={popoverOpen}
                onOpenChange={handleOpenChange}
                placement="bottomRight"
                overlayStyle={{ paddingTop: 8 }}
            >
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <Button
                        type="text"
                        icon={<BellOutlined style={{ fontSize: "1.125rem" }} />}
                        style={{ color: "#fff", display: "flex", alignItems: "center" }}
                    />
                </Badge>
            </Popover>

            {/* 通知详情模态框 */}
            <NotificationDetailModal
                visible={detailVisible}
                notification={selectedNotification}
                onClose={() => {
                    setDetailVisible(false);
                    setSelectedNotification(null);
                }}
            />
        </>
    );
}