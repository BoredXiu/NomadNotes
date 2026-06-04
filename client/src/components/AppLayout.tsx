import React from 'react';
import { Layout, Tabs, Button, Typography, Space, Avatar } from 'antd';
import {
  LogoutOutlined,
  PlusOutlined,
  UserOutlined,
  CompassOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { NomadLogoIcon, MyTripIcon } from './NomadIcons';
import SkateboardTabBar from './SkateboardTabBar';
import SearchBar from './SearchBar';
import CurrencySwitcher from './CurrencySwitcher';

const { Header, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeKey = (() => {
    if (location.pathname === '/') return '/';
    if (location.pathname.startsWith('/explore')) return '/explore';
    return '';
  })();

  const tabItems = [
    {
      key: '/',
      label: (
        <span>
          <MyTripIcon size={14} /> 我的旅程
        </span>
      ),
    },
    {
      key: '/explore',
      label: (
        <span>
          <CompassOutlined /> 微游记
        </span>
      ),
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
          <NomadLogoIcon size={22} color="#fff" />
          <Text strong style={{ color: '#fff', fontSize: 18 }}>
            NomadNotes
          </Text>
          <SearchBar style={{ marginLeft: 16 }} />
        </Space>

        <Space size="middle">
          <CurrencySwitcher />
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
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: '#fff' }}
          />
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

      <Tabs
        activeKey={activeKey}
        onChange={(key) => navigate(key)}
        renderTabBar={() => (
          <div style={{ padding: '0 24px' }}>
            <SkateboardTabBar
              activeKey={activeKey}
              onChange={(key: string) => navigate(key)}
              items={tabItems}
            />
          </div>
        )}
        items={tabItems}
        style={{ marginBottom: 0 }}
      />

      <Content
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children || <Outlet />}
      </Content>
    </Layout>
  );
}
