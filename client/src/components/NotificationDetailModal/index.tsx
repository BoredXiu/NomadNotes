import React from "react";
import { Modal, Descriptions, Tag, Typography, Space } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import type { NotificationItem } from "../../api/notifications";

const { Text, Paragraph } = Typography;

/**
 * 通知详情模态框
 * 展示单个通知的完整内容
 */
interface Props {
    visible: boolean;
    notification: NotificationItem | null;
    onClose: () => void;
}

export default function NotificationDetailModal({
    visible,
    notification,
    onClose,
}: Props) {
    if (!notification) return null;

    const isApproved = notification.type === "audit_approved";

    const statusTag = isApproved ? (
        <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ fontSize: "0.875rem", padding: "0.125rem 0.75rem" }}
        >
            审核通过
        </Tag>
    ) : (
        <Tag
            icon={<CloseCircleOutlined />}
            color="error"
            style={{ fontSize: "0.875rem", padding: "0.125rem 0.75rem" }}
        >
            审核驳回
        </Tag>
    );

    return (
        <Modal
            title={
                <Space>
                    {statusTag}
                    <span style={{ fontSize: "1rem" }}>{notification.title}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={520}
            destroyOnClose
        >
            <div style={{ padding: "0.5rem 0" }}>
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="通知类型">
                        {isApproved ? "审核通过通知" : "审核驳回通知"}
                    </Descriptions.Item>
                    <Descriptions.Item label="通知时间">
                        {new Date(notification.createdAt).toLocaleString("zh-CN")}
                    </Descriptions.Item>
                    <Descriptions.Item label="已读状态">
                        {notification.isRead ? (
                            <Text type="secondary">已读</Text>
                        ) : (
                            <Text type="warning">未读</Text>
                        )}
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: "1rem" }}>
                    <Text strong style={{ fontSize: "0.875rem" }}>
                        详细内容
                    </Text>
                    <Paragraph
                        style={{
                            marginTop: "0.5rem",
                            padding: "0.75rem",
                            background: "#fafafa",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {notification.content || "无详细内容"}
                    </Paragraph>
                </div>
            </div>
        </Modal>
    );
}