import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Typography,
  message,
  Card,
  Upload,
  Space,
  Switch,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as tripsApi from '../api/trips';
import * as expensesApi from '../api/expenses';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

const { Title } = Typography;

export default function TripFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && id) {
      tripsApi.getTripById(id).then((trip) => {
        form.setFieldsValue({
          title: trip.title,
          destination: trip.destination,
          startDate: dayjs(trip.startDate),
          endDate: dayjs(trip.endDate),
          isPublic: trip.isPublic === 1,
        });
        setCoverImage(trip.coverImage);
      }).catch(() => {
        message.error('加载旅程信息失败');
      });
    }
  }, [id, isEditing, form]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await expensesApi.uploadFile(file);
      setCoverImage(url);
      message.success('封面上传成功');
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onFinish = async (values: {
    title: string;
    destination: string;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
  }) => {
    setLoading(true);
    try {
      const data = {
        title: values.title,
        destination: values.destination,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        coverImage: coverImage || undefined,
        isPublic: (values as any).isPublic ? 1 : 0,
      };

      if (isEditing && id) {
        await tripsApi.updateTrip(id, data);
        message.success('旅程更新成功');
      } else {
        await tripsApi.createTrip(data);
        message.success('旅程创建成功');
      }
      navigate('/');
    } catch {
      message.error(isEditing ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={4} style={{ margin: 0 }}>
          {isEditing ? '编辑旅程' : '新建旅程'}
        </Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="旅程名称"
          rules={[{ required: true, message: '请输入旅程名称' }]}
        >
          <Input placeholder="例如：京都红叶之旅" />
        </Form.Item>

        <Form.Item
          name="destination"
          label="目的地"
          rules={[{ required: true, message: '请输入目的地' }]}
        >
          <Input placeholder="例如：日本京都" />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="开始日期"
          rules={[{ required: true, message: '请选择开始日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="结束日期"
          rules={[
            { required: true, message: '请选择结束日期' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const start = getFieldValue('startDate');
                if (!value || !start) {
                  return Promise.resolve();
                }
                if (value.isBefore(start, 'day')) {
                  return Promise.reject(new Error('结束日期不能早于开始日期'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="isPublic"
          label="公开旅程"
          valuePropName="checked"
        >
          <Switch />
          <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
            开启后，其他用户可在"微游记"中查看你的旅程
          </span>
        </Form.Item>

        <Form.Item label="封面图片">
          <Upload
            listType="picture-card"
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
            accept="image/jpeg,image/png,image/webp"
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>{uploading ? '上传中...' : '上传封面'}</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {isEditing ? '保存修改' : '创建旅程'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}