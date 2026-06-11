import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Tabs, Button, Typography, Space, Avatar, Badge } from 'antd';
import {
  LogoutOutlined,
  PlusOutlined,
  UserOutlined,
  CompassOutlined,
  SunOutlined,
  MoonOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useThemeRipple } from '../hooks/useThemeRipple';
import { getPendingCount } from '../api/admin';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { NomadLogoIcon, MyTripIcon } from './NomadIcons';
import SkateboardTabBar from './SkateboardTabBar';
import SearchBar from './SearchBar';
import AppFooter from './AppFooter';

const { Header, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isAdmin } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { triggerRipple } = useThemeRipple(toggleTheme);
  const { canInstall, install } = usePWAInstall();
  const [pendingCount, setPendingCount] = useState(0);
  // 内联搜索关键词：仅"我的旅程"页面使用，在该页面内过滤数据
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 内联搜索回调
  const handleInlineSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
  }, []);

  // 管理员登录时获取待审核数量
  useEffect(() => {
    if (isAdmin && isAdmin()) {
      getPendingCount()
        .then((res) => {
          if (res.success) {
            setPendingCount(res.data.count);
          }
        })
        .catch(() => {
          // 静默失败
        });
    }
  }, [isAdmin]);

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
          padding: '0 1.5rem',   // 24px
        }}
      >
        <Space>
          <NomadLogoIcon size={22} color="#fff" />
          <Text strong style={{ color: '#fff', fontSize: '1.125rem' }}>
            NomadNotes
          </Text>
        </Space>

        <Space size="middle">
          {/* 管理按钮：仅管理员可见 */}
          {isAdmin && isAdmin() && (
            <Badge count={pendingCount} size="small" offset={[-4, 4]}>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => navigate('/admin')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '0.0625rem solid rgba(255,255,255,0.3)',
                  color: '#fff',
                }}
              >
                管理
              </Button>
            </Badge>
          )}
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
            onClick={triggerRipple}
            style={{ color: '#fff' }}
          />
          {canInstall && (
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={install}
            title="添加到桌面"
            style={{ color: "#fff" }}
          />
          )}
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
          <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SkateboardTabBar
              activeKey={activeKey}
              onChange={(key: string) => navigate(key)}
              items={tabItems}
            />
            {/* 搜索：仅在"我的旅程"页面显示，搜索范围为当前页面数据 */}
            {location.pathname === '/' && (
              <SearchBar
                style={{ flexShrink: 0 }}
                inline
                onSearch={handleInlineSearch}
              />
            )}
          </div>
        )}
        items={tabItems}
        style={{ marginBottom: 0 }}
      />

      <Content
        style={{
          padding: '1.5rem',    // 24px
          maxWidth: '75rem',    // 1200px
          margin: '0 auto',
          width: '100%',
        }}
      >
        {children || <Outlet context={{ searchKeyword }} />}
      </Content>

      {/* 页脚：ICP 备案信息，flex-shrink: 0 确保不被挤压 */}
      <AppFooter />
    </Layout>
  );
}