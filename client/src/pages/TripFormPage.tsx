import React, { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, AimOutlined, ImportOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as tripsApi from '../api/trips';
import * as expensesApi from '../api/expenses';
import { compressImage } from '../utils/compress';
import api from '../api/client';
import dayjs from 'dayjs';

const { Title } = Typography;

interface TempFile {
  fileId: string;
  ext: string;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const { data } = await api.get<{
      success: boolean;
      data: { displayName: string };
    }>('/geocode/reverse', { params: { lat, lon } });
    if (data.success && data.data.displayName) return data.data.displayName;
    throw new Error('empty');
  } catch {
    const resp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
    );
    if (!resp.ok) throw new Error('fallback failed');
    const json = await resp.json();
    if (json.principalSubdivision || json.city) {
      const parts = [];
      if (json.principalSubdivision) parts.push(json.principalSubdivision);
      if (json.city) parts.push(json.city);
      if (json.locality && json.locality !== json.city) parts.push(json.locality);
      return parts.join('');
    }
    throw new Error('no address');
  }
}

export default function TripFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tempFile, setTempFile] = useState<TempFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setExistingCoverImage(trip.coverImage || null);
      }).catch(() => {
        message.error('加载旅程信息失败');
      });
    }
  }, [id, isEditing, form]);

  const handleLocate = () => {
    setLocating(true);

    // 先尝试浏览器原生定位
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const address = await reverseGeocode(latitude, longitude);
            form.setFieldsValue({ destination: address });
            message.success(`已定位: ${address}`);
          } catch {
            form.setFieldsValue({ destination: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
            message.info('无法获取中文地址，已填入坐标');
          } finally {
            setLocating(false);
          }
        },
        async (err) => {
          // 权限被拒绝时降级到 IP 定位
          if (err.code === 1) {
            message.info('浏览器定位被拒绝，尝试通过IP定位...');
            await locateByIP();
          } else {
            const errorMessages: Record<number, string> = {
              2: '无法获取位置信息',
              3: '定位超时',
            };
            message.error(errorMessages[err.code] || '定位失败');
            setLocating(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      // 浏览器不支持定位，直接用 IP 定位
      message.info('当前浏览器不支持地理定位，尝试IP定位...');
      locateByIP();
    }
  };

  // 触发隐藏的文件选择器
  const handleImportNotes = () => {
    fileInputRef.current?.click();
  };

  // 读取并解析导入的 JSON 文件
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 从导入的数据中提取旅程信息填充表单
      const fields: Record<string, unknown> = {};
      if (data.title) fields.title = data.title;
      if (data.destination) fields.destination = data.destination;
      if (data.startDate) fields.startDate = dayjs(data.startDate);
      if (data.endDate) fields.endDate = dayjs(data.endDate);
      if (data.isPublic !== undefined) fields.isPublic = data.isPublic === 1;
      form.setFieldsValue(fields);

      message.success("游记数据导入成功");
    } catch {
      message.error("导入失败，请检查文件格式");
    } finally {
      setImporting(false);
      // 重置文件输入，以便重复选择同一文件
      event.target.value = "";
    }
  };

  // IP 定位兜底：使用国内 IP 定位服务获取精确到县级的地址
  const locateByIP = async () => {
    try {
      // 优先使用国内 IP 定位 API，提供省市县级精度
      const resp = await fetch('https://whois.pconline.com.cn/ipJson.jsp?json=true');
      if (resp.ok) {
        const text = await resp.text();
        // 处理 GBK 编码的响应（PCOnline 返回的是 GBK 编码）
        const json = JSON.parse(text);
        const parts: string[] = [];
        if (json.pro) parts.push(json.pro); // 省
        if (json.city && json.city !== json.pro) parts.push(json.city); // 市
        if (json.region && json.region !== json.city) parts.push(json.region); // 区/县
        const address = parts.join('');
        if (address) {
          form.setFieldsValue({ destination: address });
          message.success(`已IP定位: ${address}`);
          setLocating(false);
          return;
        }
      }
    } catch {
      // 主 API 失败，尝试备用 API
    }

    try {
      const resp = await fetch('https://ipapi.co/json/');
      if (resp.ok) {
        const json = await resp.json();
        const parts: string[] = [];
        if (json.region) parts.push(json.region);
        if (json.city) parts.push(json.city);
        const address = parts.join('') || `${json.latitude?.toFixed(4)}, ${json.longitude?.toFixed(4)}`;
        form.setFieldsValue({ destination: address });
        message.success(`已IP定位: ${address}`);
        setLocating(false);
        return;
      }
    } catch {
      // 所有方式均失败
    }

    message.error('IP定位失败，请手动输入目的地');
    setLocating(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 750, 0.8);
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      const result = await expensesApi.uploadFileToTemp(compressedFile);
      setTempFile({ fileId: result.fileId, ext: result.ext });
      setPreviewUrl(URL.createObjectURL(compressedFile));
      setExistingCoverImage(null);
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
    isPublic: boolean;
  }) => {
    setLoading(true);
    try {
      let coverImage: string | undefined = existingCoverImage || undefined;

      if (tempFile) {
        const result = await expensesApi.persistSingle(tempFile.fileId, tempFile.ext);
        coverImage = result.imageUrl;
      }

      const data = {
        title: values.title,
        destination: values.destination,
        startDate: values.startDate.format('YYYY-MM-DD HH:mm:ss'),
        endDate: values.endDate.format('YYYY-MM-DD HH:mm:ss'),
        coverImage,
        isPublic: values.isPublic ? 1 : 0,
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

  const displayImage = previewUrl || existingCoverImage;

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
        initialValues={{ isPublic: false }}
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="旅程名称"
          rules={[{ required: true, message: '请输入旅程名称' }]}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <Input placeholder="例如：京都红叶之旅" style={{ flex: 1 }} />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Button icon={<ImportOutlined />} onClick={() => fileInputRef.current?.click()} loading={importing}>
              导入游记
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          name="destination"
          label="目的地"
          rules={[{ required: true, message: '请输入目的地' }]}
        >
          <Input
            placeholder="例如：日本京都"
            suffix={
              <Button
                type="text"
                size="small"
                icon={<AimOutlined />}
                loading={locating}
                onClick={handleLocate}
                title="获取当前位置"
              />
            }
          />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="开始日期"
          rules={[{ required: true, message: '请选择开始日期' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="结束日期"
          rules={[{ required: true, message: '请选择结束日期' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="isPublic" label="公开旅程" valuePropName="checked">
          <Switch />
        </Form.Item>

        {displayImage ? (
          <Form.Item label="封面图片">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Image
                src={displayImage}
                alt="封面"
                style={{ maxHeight: 200, objectFit: 'contain' }}
              />
              <Upload
                maxCount={1}
                beforeUpload={handleUpload}
                accept="image/jpeg,image/png,image/webp"
                showUploadList={false}
              >
                <Button loading={uploading}>更换封面</Button>
              </Upload>
            </Space>
          </Form.Item>
        ) : (
          <Form.Item label="封面图片">
            <Upload
              maxCount={1}
              beforeUpload={handleUpload}
              accept="image/jpeg,image/png,image/webp"
              showUploadList={false}
              listType="picture-card"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传封面</div>
              </div>
            </Upload>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {isEditing ? '更新旅程' : '创建旅程'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}