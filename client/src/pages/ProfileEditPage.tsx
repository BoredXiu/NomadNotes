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
} from 'antd';
import { UserOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getProfile, updateProfile } from '../api/profile';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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