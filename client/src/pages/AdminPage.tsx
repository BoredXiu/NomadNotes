import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuditTab from '../components/admin/AuditTab';
import UserTab from '../components/admin/UserTab';
import TripTab from '../components/admin/TripTab';
import OperationLogTab from '../components/admin/OperationLogTab';
import SkateboardTabBar from '../components/SkateboardTabBar';

export default function AdminPage() {
    const { isAdmin } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('audit');

    // 权限检查：仅管理员可访问
    useEffect(() => {
        if (!isAdmin || !isAdmin()) {
            navigate('/', { replace: true });
        }
    }, [isAdmin, navigate]);

    const tabItems = [
        { key: 'audit', label: '内容审核' },
        { key: 'users', label: '用户管理' },
        { key: 'trips', label: '旅程管理' },
        { key: 'logs', label: '操作日志' },
    ];

    // 根据当前激活的标签页渲染对应的子组件
    const renderTabContent = () => {
        switch (activeTab) {
            case 'audit':
                return <AuditTab />;
            case 'users':
                return <UserTab />;
            case 'trips':
                return <TripTab />;
            case 'logs':
                return <OperationLogTab />;
            default:
                return <AuditTab />;
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
            <SkateboardTabBar
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
            />
            <div style={{ marginTop: 16 }}>
                {renderTabContent()}
            </div>
        </div>
    );
}