import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Button, Space, Empty, Spin, Pagination, Select, Modal, message } from 'antd';
import { EnvironmentOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAdminTripList, takedownTrip, forceDeleteTrip, type AdminTrip } from '../../api/admin';

const { Text } = Typography;

export default function TripTab() {
    const navigate = useNavigate();

    const [list, setList] = useState<AdminTrip[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const [isPublicFilter, setIsPublicFilter] = useState<number | undefined>(undefined);

    const [takedownId, setTakedownId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTripItem, setDeleteTripItem] = useState<AdminTrip | null>(null);

    const fetchTripList = async (page = currentPage) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, pageSize };
            if (isPublicFilter !== undefined) params.isPublic = isPublicFilter;

            const res = await getAdminTripList(params);
            if (res.success) {
                setList(res.data.list);
                setTotal(res.data.total);
            }
        } catch {
            message.error('获取旅程列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTripList(1);
    }, [isPublicFilter]);

    const handleTakedown = async (item: AdminTrip) => {
        setTakedownId(item.id);
        // 乐观更新：立即切换 UI 状态，提升响应速度
        const newStatus = item.isPublic === 1 ? 0 : 1;
        setList((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, isPublic: newStatus } : t))
        );
        try {
            const res = await takedownTrip(item.id);
            if (res.success) {
                message.success(res.message);
            }
            // 仍重新加载列表以确保数据一致性
            fetchTripList(currentPage);
        } catch {
            // 失败时恢复原始状态
            setList((prev) =>
                prev.map((t) => (t.id === item.id ? { ...t, isPublic: item.isPublic } : t))
            );
            message.error('操作失败');
        } finally {
            setTakedownId(null);
        }
    };

    const confirmDeleteTrip = (item: AdminTrip) => {
        setDeleteTripItem(item);
        setDeleteModalVisible(true);
    };

    const handleDeleteTrip = async () => {
        if (!deleteTripItem) return;

        setDeleteId(deleteTripItem.id);
        try {
            const res = await forceDeleteTrip(deleteTripItem.id);
            if (res.success) {
                message.success('旅程已彻底删除');
                setDeleteModalVisible(false);
                fetchTripList(currentPage);
            }
        } catch {
            message.error('删除失败');
        } finally {
            setDeleteId(null);
        }
    };

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Select
                    placeholder="公开状态"
                    allowClear
                    style={{ width: 120 }}
                    value={isPublicFilter}
                    onChange={(val) => setIsPublicFilter(val)}
                    options={[
                        { label: '已公开', value: 1 },
                        { label: '未公开', value: 0 },
                    ]}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin tip="加载旅程列表..." />
                </div>
            ) : list.length === 0 ? (
                <Empty description="暂无旅程记录" />
            ) : (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {list.map((item) => (
                        <Card key={item.id} size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <Space>
                                    <Tag color={item.isPublic === 1 ? 'green' : 'default'}>
                                        {item.isPublic === 1 ? '已公开' : '未公开'}
                                    </Tag>
                                    <Text strong>{item.title}</Text>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <EnvironmentOutlined /> {item.destination}
                                    </Text>
                                </Space>
                                <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                                    <div>作者：{item.User?.username || '未知'}</div>
                                    <div style={{ marginTop: 4 }}>创建时间：{formatTime(item.createdAt)}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                                {item.startDate?.slice(0, 10)} ~ {item.endDate?.slice(0, 10)}
                            </div>

                            <Space>
                                <Button
                                    type={item.isPublic === 1 ? 'default' : 'primary'}
                                    size="small"
                                    loading={takedownId === item.id}
                                    onClick={() => handleTakedown(item)}
                                >
                                    {item.isPublic === 1 ? '下架' : '恢复'}
                                </Button>
                                <Button
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    loading={deleteId === item.id}
                                    onClick={() => confirmDeleteTrip(item)}
                                >
                                    删除
                                </Button>
                                <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => navigate(`/trip/${item.id}`)}
                                >
                                    预览
                                </Button>
                            </Space>
                        </Card>
                    ))}

                    {total > pageSize && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={total}
                                onChange={(page) => {
                                    setCurrentPage(page);
                                    fetchTripList(page);
                                }}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </Space>
            )}

            <Modal
                title="确认删除旅程"
                open={deleteModalVisible}
                onCancel={() => setDeleteModalVisible(false)}
                onOk={handleDeleteTrip}
                okText="确认删除"
                okButtonProps={{ danger: true, loading: deleteId !== null }}
            >
                <p>
                    确认删除旅程"<Text strong>{deleteTripItem?.title}</Text>"及其所有关联数据（游记、账单、审核记录）？此操作不可撤销。
                </p>
            </Modal>
        </div>
    );
}