import React, { useEffect, useState } from 'react';
import { Table, Tag, Empty, Select, message } from 'antd';
import { getOperationLogs, type AdminOperationLog } from '../../api/admin';

export default function OperationLogTab() {
    const [list, setList] = useState<AdminOperationLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [operationTypeFilter, setOperationTypeFilter] = useState<string | undefined>(undefined);

    const fetchLogs = async (page = currentPage) => {
        setLoading(true);
        try {
            const res = await getOperationLogs({
                page,
                pageSize,
                operationType: operationTypeFilter,
            });
            if (res.success) {
                setList(res.data.list);
                setTotal(res.data.total);
            }
        } catch {
            message.error('获取操作日志失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [operationTypeFilter]);

    const logTypeConfig: Record<string, { color: string; label: string }> = {
        user_disable: { color: 'red', label: '禁用用户' },
        user_enable: { color: 'green', label: '启用用户' },
        trip_takedown: { color: 'orange', label: '下架旅程' },
        trip_restore: { color: 'green', label: '恢复旅程' },
        trip_delete: { color: 'red', label: '删除旅程' },
        note_delete: { color: 'red', label: '删除游记' },
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

    const columns = [
        {
            title: '操作人',
            dataIndex: 'adminName',
            key: 'adminName',
            width: 100,
        },
        {
            title: '操作类型',
            dataIndex: 'operationType',
            key: 'operationType',
            width: 100,
            render: (type: string) => {
                const config = logTypeConfig[type] || { color: 'default', label: type };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: '操作描述',
            dataIndex: 'description',
            key: 'description',
            minWidth: 300,
        },
        {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (val: string) => formatTime(val),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Select
                    placeholder="操作类型"
                    allowClear
                    style={{ width: 140 }}
                    value={operationTypeFilter}
                    onChange={(val) => setOperationTypeFilter(val)}
                    options={[
                        { label: '全部操作', value: undefined },
                        { label: '禁用用户', value: 'user_disable' },
                        { label: '启用用户', value: 'user_enable' },
                        { label: '下架旅程', value: 'trip_takedown' },
                        { label: '恢复旅程', value: 'trip_restore' },
                        { label: '删除旅程', value: 'trip_delete' },
                        { label: '删除游记', value: 'note_delete' },
                    ]}
                />
            </div>

            <Table
                dataSource={list}
                columns={columns}
                rowKey="id"
                loading={loading}
                size="small"
                pagination={{
                    current: currentPage,
                    pageSize,
                    total,
                    onChange: (page) => {
                        setCurrentPage(page);
                        fetchLogs(page);
                    },
                    showSizeChanger: false,
                }}
                locale={{ emptyText: <Empty description="暂无操作日志" /> }}
            />
        </div>
    );
}