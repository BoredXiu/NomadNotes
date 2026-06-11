import bgLogin from '../assets/bg-login.jpg';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Alert } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useAuthStore } from '../store/authStore';
import AppFooter from '../components/AppFooter';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [searchParams] = useSearchParams();
  const isDisabledNotice = searchParams.get("disabled") === "1";

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
    setErrorMessage(''); // 每次提交前清除之前的错误
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
      // 使用持久化错误提示，而非自动消失的 message 提示
      setErrorMessage(err?.response?.data?.message || '登录失败，请检查账号密码是否正确');
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
        flexDirection: 'column',
        background: `url(${bgLogin}) center/cover no-repeat`,
      }}
    >
      {/* 登录表单容器：flex-grow 撑开，内部 flex 居中 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 16px',
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

            {isDisabledNotice && (
              <Alert
                message="账号已被禁用"
                description="您的账号已被管理员禁用，无法继续使用。如有疑问请联系管理员。"
                type="error"
                showIcon
                closable
              />
            )}

            {errorMessage && (
              <Alert
                message="登录失败"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage('')}
              />
            )}

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

      {/* 页脚：ICP 备案信息 */}
      <AppFooter />
    </div>
  );
}