import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

/**
 * 通用导航组件，提供返回按钮和页面标题
 */
const SkateboardNav: React.FC<{
  title?: string;
  showBack?: boolean;
  backTo?: string;
  extra?: React.ReactNode;
}> = ({ title, showBack = true, backTo, extra }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Space>
        {showBack && (
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="text">
            返回
          </Button>
        )}
        {title && <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>}
      </Space>
      {extra}
    </div>
  );
};

export default SkateboardNav;
