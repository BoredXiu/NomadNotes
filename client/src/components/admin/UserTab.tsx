import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Input, Modal, message, Typography, Empty } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getAdminUserList, toggleUserStatus, type AdminUser } from '../../api/admin';

const { Text } = Typography;

export default function UserTab() {
    const [list, setList] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [keyword, setKeyword] = useState('');
    const [operatingId, setOperatingId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

    const fetchUserList = async (page = currentPage) => {
        setLoading(true);
        try {
            const res = await getAdminUserList({
                page,
                pageSize,
                keyword: keyword || undefined,
            });
            if (res.success) {
                setList(res.data.list);
                setTotal(res.data.total);
            }
        } catch {
            message.error('获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserList(1);
    }, []);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchUserList(1);
    };

    const confirmToggleStatus = (user: AdminUser) => {
        setCurrentUser(user);
        setModalVisible(true);
    };

    const handleToggleStatus = async () => {
        if (!currentUser) return;

        setOperatingId(currentUser.id);
        try {
            const res = await toggleUserStatus(currentUser.id);
            if (res.success) {
                message.success(res.message);
                setModalVisible(false);
                fetchUserList(currentPage);
            }
        } catch {
            message.error('操作失败');
        } finally {
            setOperatingId(null);
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

    const columns = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 120,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 180,
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 80,
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role === 'admin' ? '管理员' : '用户'}
                </Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'isDisabled',
            key: 'isDisabled',
            width: 80,
            render: (isDisabled: number) => (
                <Tag color={isDisabled === 1 ? 'red' : 'green'}>
                    {isDisabled === 1 ? '已禁用' : '正常'}
                </Tag>
            ),
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (val: string) => formatTime(val),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: any, record: AdminUser) => {
                if (record.role === 'admin') {
                    return <Tag>不可操作</Tag>;
                }
                return (
                    <Button
                        type={record.isDisabled === 1 ? 'primary' : 'dashed'}
                        size="small"
                        danger={record.isDisabled !== 1}
                        loading={operatingId === record.id}
                        onClick={() => confirmToggleStatus(record)}
                    >
                        {record.isDisabled === 1 ? '启用' : '禁用'}
                    </Button>
                );
            },
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Input.Search
                    placeholder="搜索用户名或邮箱..."
                    allowClear
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 240 }}
                    prefix={<SearchOutlined />}
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
                        fetchUserList(page);
                    },
                    showSizeChanger: false,
                }}
                locale={{ emptyText: <Empty description="暂无用户数据" /> }}
            />

            <Modal
                title={currentUser?.isDisabled === 1 ? `启用用户"${currentUser?.username}"` : `禁用用户"${currentUser?.username}"`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleToggleStatus}
                okText={`确认${currentUser?.isDisabled === 1 ? '启用' : '禁用'}`}
                okButtonProps={{
                    danger: currentUser?.isDisabled !== 1,
                    loading: operatingId !== null,
                }}
            >
                <p>
                    <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {currentUser?.isDisabled === 1
                        ? `确认启用用户"${currentUser?.username}"？启用后该用户可以正常登录和发布内容。`
                        : `确认禁用用户"${currentUser?.username}"？禁用后该用户无法登录，其公开内容也将不再展示。`
                    }
                </p>
            </Modal>
        </div>
    );
}