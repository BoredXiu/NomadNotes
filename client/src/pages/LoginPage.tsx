import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const fetchCaptcha = useCallback(async () => {
    try {
      const data = await authApi.getCaptcha();
      setCaptchaSvg(data.svg);
      setCaptchaId(data.captchaId);
    } catch {
      message.error('获取验证码失败');
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const onFinish = async (values: { account: string; password: string; captchaText: string }) => {
    setLoading(true);
    try {
      const result = await authApi.login({
        account: values.account,
        password: values.password,
        captchaId,
        captchaText: values.captchaText,
      });
      login(result.user, result.accessToken, result.refreshToken);
      message.success('登录成功');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || '登录失败');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 4 }}>
              NomadNotes
            </Title>
            <Text type="secondary">游迹 - 记录每一段旅程</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="account"
              rules={[
                { required: true, message: '请输入邮箱或用户名' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱或用户名" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="captchaText"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Space style={{ width: '100%' }}>
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="验证码"
                  size="large"
                  style={{ width: '60%' }}
                />
                <div
                  style={{ width: '38%', cursor: 'pointer', height: 40 }}
                  onClick={fetchCaptcha}
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                />
              </Space>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text>
              还没有账号？ <Link to="/register">立即注册</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}