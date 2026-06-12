import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Spin,
  Typography,
  Avatar,
  Cascader,
  Divider,
  Progress,
  Collapse,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  KeyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getProfile, updateProfile, changePassword } from '../api/profile';
import { uploadImage } from '../api/upload';
import areaData from 'china-area-data';

const { Title } = Typography;
const { TextArea } = Input;

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

function buildAreaOptions(parentCode = '86'): CascaderOption[] {
  const children = areaData[parentCode];
  if (!children || typeof children !== 'object') return [];

  return Object.entries(children as Record<string, string>).map(([code, name]) => {
    const option: CascaderOption = { value: code, label: name };
    const sub = buildAreaOptions(code);
    if (sub.length > 0) {
      option.children = sub;
    }
    return option;
  });
}

export default function ProfileEditPage() {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const areaOptions = useMemo(() => buildAreaOptions(), []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        form.setFieldsValue({
          username: profile.username,
          bio: profile.bio || '',
          address: profile.address ? profile.address.split(',') : undefined,
          gender: profile.gender || undefined,
        });
        setAvatarUrl(profile.avatarUrl);
      } catch {
        message.error('加载个人资料失败');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [form]);

  const handleUpload = async (file: File) => {
    try {
      const url = await uploadImage(file);
      setAvatarUrl(url);
      message.success('头像上传成功');
    } catch {
      message.error('头像上传失败');
    }
    return false;
  };

  const handleSave = async (values: {
    username: string;
    bio: string;
    address: string[];
    gender: string;
  }) => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        username: values.username,
        bio: values.bio,
        address: Array.isArray(values.address) ? values.address.join(',') : values.address,
        gender: values.gender,
        avatarUrl: avatarUrl || undefined,
      });
      setUser({ ...user!, ...updated });
      message.success('个人资料已更新');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /** 计算密码强度等级（0-100） */
  const calcPasswordStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 10) score += 20;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/\d/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    return Math.min(score, 100);
  };

  /** 检测新密码变化时更新强度 */
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordStrength(calcPasswordStrength(e.target.value));
  };

  /** 修改密码 */
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordSaving(true);
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
      setPasswordStrength(0);
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      }
      // Ant Design 表单校验失败时，error 为 void，无需额外提示
    } finally {
      setPasswordSaving(false);
    }
  };

  /** 密码强度文案与颜色 */
  const getStrengthInfo = (score: number) => {
    if (score === 0) return { text: '', color: '', percent: 0 };
    if (score < 40) return { text: '弱', color: '#ff4d4f', percent: 25 };
    if (score < 60) return { text: '中', color: '#faad14', percent: 50 };
    if (score < 80) return { text: '强', color: '#52c41a', percent: 75 };
    return { text: '非常强', color: '#52c41a', percent: 100 };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          编辑个人资料
        </Title>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {avatarUrl ? (
            <Avatar src={avatarUrl} size={100} />
          ) : (
            <Avatar size={100} icon={<UserOutlined />} />
          )}
          <div style={{ marginTop: 12 }}>
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleUpload(file);
                return false;
              }}
              accept="image/jpeg,image/png,image/webp"
            >
              <Button icon={<UploadOutlined />}>更换头像</Button>
            </Upload>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="username"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 2, max: 20, message: '昵称长度为2-20个字符' },
            ]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="个人介绍"
          >
            <TextArea
              rows={3}
              placeholder="介绍一下自己..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="所在地区"
          >
            <Cascader
              options={areaOptions}
              placeholder="请选择所在地区"
              changeOnSelect
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
          >
            <Select placeholder="请选择性别" allowClear>
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          {/* 分隔线 */}
          <Divider style={{ fontSize: '0.875rem', color: '#888' }}>密码修改</Divider>

          {/* 折叠面板：密码修改区域 */}
          <Collapse
            ghost
            expandIconPosition="end"
            items={[
              {
                key: 'password',
                label: (
                  <span style={{ color: '#666', fontSize: '0.875rem' }}>
                    <KeyOutlined style={{ marginRight: 8 }} />
                    修改密码
                  </span>
                ),
                children: (
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    name="passwordForm"
                  >
                    <Form.Item
                      name="currentPassword"
                      label="当前密码"
                      rules={[
                        { required: true, message: '请输入当前密码' },
                      ]}
                    >
                      <Input.Password
                        placeholder="请输入当前密码"
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码长度至少 6 位' },
                        {
                          pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
                          message: '密码必须包含字母和数字',
                        },
                      ]}
                    >
                      <Input.Password
                        placeholder="请输入新密码（至少 6 位，包含字母和数字）"
                        onChange={handleNewPasswordChange}
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                    </Form.Item>

                    {/* 密码强度指示条 */}
                    {passwordStrength > 0 && (
                      <div style={{ marginTop: '-0.75rem', marginBottom: '1.25rem' }}>
                        <Progress
                          percent={getStrengthInfo(passwordStrength).percent}
                          strokeColor={getStrengthInfo(passwordStrength).color}
                          showInfo={false}
                          size="small"
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: getStrengthInfo(passwordStrength).color,
                          }}
                        >
                          密码强度：{getStrengthInfo(passwordStrength).text}
                        </span>
                      </div>
                    )}

                    <Form.Item
                      name="confirmPassword"
                      label="确认新密码"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: '请再次输入新密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        placeholder="请再次输入新密码"
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        ghost
                        onClick={handleChangePassword}
                        loading={passwordSaving}
                        block
                      >
                        保存修改
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              block
            >
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}