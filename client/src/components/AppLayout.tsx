import React from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar } from 'antd';
import {
  LogoutOutlined,
  GlobalOutlined,
  PlusOutlined,
  UserOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <GlobalOutlined />,
      label: '我的旅程',
    },
    {
      key: '/explore',
      icon: <CompassOutlined />,
      label: '微游记',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <Space>
          <GlobalOutlined style={{ color: '#fff', fontSize: 20 }} />
          <Text strong style={{ color: '#fff', fontSize: 18 }}>
            NomadNotes
          </Text>
        </Space>

        <Space size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/trip/new')}
          >
            新建旅程
          </Button>
          <Space
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            {user?.avatarUrl ? (
              <Avatar src={user.avatarUrl} />
            ) : (
              <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Text style={{ color: '#fff' }}>{user?.username}</Text>
          </Space>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: '#fff' }}
          >
            退出
          </Button>
        </Space>
      </Header>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ padding: '0 24px' }}
      />

      <Content
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
}