import React, { useState } from 'react';
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
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as expensesApi from '../api/expenses';
import { EXPENSE_CATEGORIES } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ExpenseFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const onFinish = async (values: {
    category: string;
    amount: number;
    expenseDate: dayjs.Dayjs;
    note?: string;
  }) => {
    if (!id) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', values.category);
      formData.append('amount', String(values.amount));
      formData.append('expenseDate', values.expenseDate.format('YYYY-MM-DD'));
      if (values.note) formData.append('note', values.note);
      if (receiptFile) formData.append('receiptImage', receiptFile);

      await expensesApi.createExpense(id, formData);
      message.success('记账成功');
      navigate(`/trip/${id}`);
    } catch {
      message.error('记账失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={4} style={{ margin: 0 }}>
          记一笔
        </Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ category: '餐饮' }}
      >
        <Form.Item
          name="category"
          label="分类"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select options={EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c }))} />
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
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="note" label="备注">
          <Input.TextArea rows={3} placeholder="可选备注" />
        </Form.Item>

        <Form.Item label="小票照片（可选）">
          <Upload
            maxCount={1}
            beforeUpload={(file) => {
              setReceiptFile(file);
              return false;
            }}
            onRemove={() => setReceiptFile(null)}
            accept="image/jpeg,image/png,image/webp"
          >
            <Button icon={<UploadOutlined />}>选择图片</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存账单
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}