import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Space, Empty, Spin, Pagination, Radio, Modal, Input, message } from 'antd';
import {
    FileTextOutlined,
    CheckOutlined,
    CloseOutlined,
    EnvironmentOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { getAuditList, approveAudit, rejectAudit, type AuditRecord } from '../api/admin';
import { useAuthStore } from '../store/authStore';

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function AdminAuditPage() {
    const { isAdmin } = useAuthStore();
    const navigate = useNavigate();

    // 数据状态
    const [list, setList] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // 筛选状态
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [pendingCount, setPendingCount] = useState(0);

    // 操作加载状态
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    // 驳回弹窗
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [currentRejectItem, setCurrentRejectItem] = useState<AuditRecord | null>(null);

    // 权限检查
    useEffect(() => {
        if (!isAdmin || !isAdmin()) {
            navigate('/', { replace: true });
        }
    }, [isAdmin, navigate]);

    // 获取审核列表
    const fetchAuditList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAuditList({
                status: statusFilter,
                page: currentPage,
                pageSize,
            });
            if (res.success) {
                setList(res.data.list);
                setTotal(res.data.total);
                if (res.pendingCount !== undefined) {
                    setPendingCount(res.pendingCount);
                }
            }
        } catch {
            message.error('获取审核列表失败');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, currentPage]);

    useEffect(() => {
        fetchAuditList();
    }, [fetchAuditList]);

    // 筛选切换
    const handleFilterChange = (value: 'pending' | 'approved' | 'rejected') => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    // 审批通过
    const handleApprove = async (item: AuditRecord) => {
        setApprovingId(item.id);
        try {
            const res = await approveAudit(item.id);
            if (res.success) {
                message.success('审核已通过，旅程已设为公开');
                fetchAuditList();
            }
        } catch {
            message.error('审核操作失败');
        } finally {
            setApprovingId(null);
        }
    };

    // 显示驳回弹窗
    const showRejectDialog = (item: AuditRecord) => {
        setCurrentRejectItem(item);
        setRejectReason('');
        setRejectModalVisible(true);
    };

    // 执行驳回
    const handleReject = async () => {
        if (!currentRejectItem) return;
        if (!rejectReason.trim()) {
            message.warning('请填写驳回理由');
            return;
        }

        setRejectingId(currentRejectItem.id);
        try {
            const res = await rejectAudit(currentRejectItem.id, rejectReason.trim());
            if (res.success) {
                message.success('审核已驳回');
                setRejectModalVisible(false);
                fetchAuditList();
            }
        } catch {
            message.error('驳回操作失败');
        } finally {
            setRejectingId(null);
        }
    };

    // 预览旅程
    const previewTrip = (item: AuditRecord) => {
        navigate(`/trip/${item.tripId}`);
    };

    // 状态标签
    const statusConfig: Record<string, { color: string; label: string }> = {
        pending: { color: 'orange', label: '待审核' },
        approved: { color: 'green', label: '已通过' },
        rejected: { color: 'red', label: '已驳回' },
    };

    // 格式化时间
    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>内容审核</Title>
                <Radio.Group
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                >
                    <Radio.Button value="pending">
                        待审核
                        {statusFilter !== 'pending' && pendingCount > 0 && (
                            <Tag color="red" style={{ marginLeft: 4 }}>{pendingCount}</Tag>
                        )}
                    </Radio.Button>
                    <Radio.Button value="approved">已通过</Radio.Button>
                    <Radio.Button value="rejected">已驳回</Radio.Button>
                </Radio.Group>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin tip="加载审核列表..." />
                </div>
            ) : list.length === 0 ? (
                <Empty description="暂无审核记录" />
            ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {list.map((item) => (
                        <Card key={item.id} size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <Space>
                                    <Tag color={statusConfig[item.status]?.color}>
                                        {statusConfig[item.status]?.label}
                                    </Tag>
                                    <Text strong>{item.Trip?.title || '未知旅程'}</Text>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <EnvironmentOutlined /> {item.Trip?.destination || '未知目的地'}
                                    </Text>
                                </Space>
                                <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                                    <div>申请人：{item.User?.username || '未知'}</div>
                                    <div style={{ marginTop: 4 }}>申请时间：{formatTime(item.createdAt)}</div>
                                </div>
                            </div>

                            {item.status !== 'pending' && (
                                <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                                    <Space size={18}>
                                        <span>审核人：{item.reviewedByName || '未知'}</span>
                                        <span>审核时间：{item.reviewedAt ? formatTime(item.reviewedAt) : '未知'}</span>
                                        {item.reason && (
                                            <span style={{ color: '#e6a23c' }}>驳回理由：{item.reason}</span>
                                        )}
                                    </Space>
                                </div>
                            )}

                            {item.status === 'pending' && (
                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckOutlined />}
                                        loading={approvingId === item.id}
                                        onClick={() => handleApprove(item)}
                                    >
                                        通过
                                    </Button>
                                    <Button
                                        danger
                                        size="small"
                                        icon={<CloseOutlined />}
                                        loading={rejectingId === item.id}
                                        onClick={() => showRejectDialog(item)}
                                    >
                                        驳回
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => previewTrip(item)}
                                    >
                                        预览旅程
                                    </Button>
                                </Space>
                            )}
                        </Card>
                    ))}

                    {total > pageSize && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={total}
                                onChange={(page) => setCurrentPage(page)}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </Space>
            )}

            {/* 驳回理由弹窗 */}
            <Modal
                title="驳回审核"
                open={rejectModalVisible}
                onCancel={() => setRejectModalVisible(false)}
                onOk={handleReject}
                okText="确认驳回"
                okButtonProps={{ danger: true, loading: rejectingId !== null }}
            >
                <TextArea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请填写驳回理由..."
                />
            </Modal>
        </div>
    );
}