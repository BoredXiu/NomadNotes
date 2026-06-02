import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Typography,
  message,
  Card,
  Upload,
  Space,
  Image,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as expensesApi from '../api/expenses';
import { compressImage } from '../utils/compress';
import { EXPENSE_CATEGORIES } from '../types';
import type { Expense } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

interface TempFile {
  fileId: string;
  ext: string;
}

export default function ExpenseFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [tempFile, setTempFile] = useState<TempFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existingExpense, setExistingExpense] = useState<Expense | null>(null);
  const navigate = useNavigate();
  const { id, tripId, expenseId } = useParams<{ id?: string; tripId?: string; expenseId?: string }>();

  const resolvedTripId = id || tripId;
  const isEditing = !!expenseId;

  useEffect(() => {
    if (isEditing && expenseId) {
      setFetching(true);
      expensesApi.getExpenseById(expenseId)
        .then((expense) => {
          setExistingExpense(expense);
          form.setFieldsValue({
            category: expense.category,
            amount: Number(expense.amount),
            expenseDate: dayjs(expense.expenseDate),
            note: expense.note || '',
          });
        })
        .catch(() => {
          message.error('加载账单数据失败');
          navigate(-1);
        })
        .finally(() => setFetching(false));
    }
  }, [isEditing, expenseId, form, navigate]);

  const handleBeforeUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 750, 0.8);
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      const result = await expensesApi.uploadFileToTemp(compressedFile);
      setTempFile({ fileId: result.fileId, ext: result.ext });
      setPreviewUrl(URL.createObjectURL(compressedFile));
      message.success('图片已暂存');
    } catch {
      message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemoveReceipt = () => {
    setTempFile(null);
    setPreviewUrl(null);
    setExistingExpense((prev) => prev ? { ...prev, receiptImage: null } : null);
  };

  const onFinish = async (values: {
    category: string;
    amount: number;
    expenseDate: dayjs.Dayjs;
    note?: string;
  }) => {
    if (!resolvedTripId) return;
    setLoading(true);
    try {
      let receiptImage: string | null = null;

      if (tempFile) {
        const result = await expensesApi.persistSingle(tempFile.fileId, tempFile.ext);
        receiptImage = result.imageUrl;
      }

      const data: Record<string, unknown> = {
        category: values.category,
        amount: String(values.amount),
        expenseDate: values.expenseDate.format('YYYY-MM-DD HH:mm:ss'),
      };
      if (values.note) data.note = values.note;
      if (receiptImage) data.receiptImage = receiptImage;

      if (isEditing && expenseId) {
        await expensesApi.updateExpense(expenseId, data);
        message.success('账单更新成功');
        navigate(`/trip/${resolvedTripId}`);
      } else {
        await expensesApi.createExpense(resolvedTripId, data);
        message.success('记账成功');
        navigate(`/trip/${resolvedTripId}`);
      }
    } catch {
      message.error(isEditing ? '更新账单失败' : '记账失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const displayImage = previewUrl || (isEditing && existingExpense?.receiptImage ? existingExpense.receiptImage : null);

  return (
    <Card style={{ maxWidth: 500, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={4} style={{ margin: 0 }}>
          {isEditing ? '编辑账单' : '记一笔'}
        </Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ category: '餐饮', expenseDate: dayjs() }}
      >
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select options={[...EXPENSE_CATEGORIES]} />
        </Form.Item>

        <Form.Item
          name="amount"
          label="金额"
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber
            min={0}
            precision={2}
            prefix="¥"
            style={{ width: '100%' }}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="expenseDate"
          label="消费日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="note" label="备注">
          <Input.TextArea rows={3} placeholder="可选备注" />
        </Form.Item>

        {displayImage && tempFile ? (
          <Form.Item label="小票照片">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Image
                src={displayImage}
                alt="小票"
                style={{ maxHeight: 200, objectFit: 'contain' }}
              />
              <Space>
                <Upload
                  maxCount={1}
                  beforeUpload={handleBeforeUpload}
                  accept="image/jpeg,image/png,image/webp"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} size="small" loading={uploading}>更换图片</Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={handleRemoveReceipt}
                >
                  删除图片
                </Button>
              </Space>
            </Space>
          </Form.Item>
        ) : displayImage ? (
          <Form.Item label="小票照片">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Image
                src={displayImage}
                alt="小票"
                style={{ maxHeight: 200, objectFit: 'contain' }}
              />
              <Space>
                <Upload
                  maxCount={1}
                  beforeUpload={handleBeforeUpload}
                  accept="image/jpeg,image/png,image/webp"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} size="small" loading={uploading}>更换图片</Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  onClick={handleRemoveReceipt}
                >
                  删除图片
                </Button>
              </Space>
            </Space>
          </Form.Item>
        ) : (
          <Form.Item label="小票照片">
            <Upload
              maxCount={1}
              beforeUpload={handleBeforeUpload}
              accept="image/jpeg,image/png,image/webp"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>上传小票</Button>
            </Upload>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {isEditing ? '更新账单' : '保存账单'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}