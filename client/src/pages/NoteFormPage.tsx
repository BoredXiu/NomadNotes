import React, { useState } from 'react';
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
  Image,
  Spin,
  Row,
  Col,
  Tag,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as notesApi from '../api/notes';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

const { Title } = Typography;

interface TempFileInfo {
  uid: string;
  fileId: string;
  imageUrl: string;
  vectorUrl: string | null;
  ext: string;
}

export default function NoteFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tempFiles, setTempFiles] = useState<TempFileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleBeforeUpload = async (file: File) => {
    setUploading(true);
    try {
      const results = await notesApi.uploadTmpImages([file]);
      const ext = file.name.substring(file.name.lastIndexOf('.'));
      const result = results[0];
      setTempFiles((prev) => [
        ...prev,
        {
          uid: result.fileId,
          fileId: result.fileId,
          imageUrl: result.imageUrl,
          vectorUrl: result.vectorUrl,
          ext,
        },
      ]);
      message.success(`图片 "${file.name}" 已上传并矢量化`);
    } catch {
      message.error(`图片 "${file.name}" 上传失败`);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemove = (file: UploadFile) => {
    const target = tempFiles.find((f) => f.uid === file.uid);
    if (target) {
      setTempFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    }
  };

  const onFinish = async (values: {
    content: string;
    noteDate: dayjs.Dayjs;
  }) => {
    if (!id) return;
    if (tempFiles.length === 0) {
      message.warning('请先上传图片');
      return;
    }
    setLoading(true);
    try {
      await notesApi.createNoteWithTempFiles(id, {
        content: values.content,
        noteDate: values.noteDate.format('YYYY-MM-DD'),
        tempFiles: tempFiles.map((f) => ({
          fileId: f.fileId,
          ext: f.ext,
        })),
      });

      message.success('游记发布成功，图片已自动矢量化');
      navigate(`/trip/${id}`);
    } catch {
      message.error('发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 700, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={4} style={{ margin: 0 }}>
          写游记
        </Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ noteDate: dayjs() }}
      >
        <Form.Item
          name="noteDate"
          label="记录日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="content"
          label="游记正文"
          rules={[{ required: true, message: '请输入游记内容' }]}
        >
          <Input.TextArea
            rows={8}
            placeholder="记录今天的旅行见闻..."
          />
        </Form.Item>

        <Form.Item label="配图（选择后自动上传并矢量化为 SVG）">
          <Spin spinning={uploading} tip="上传并矢量化中...">
            <Upload
              listType="picture-card"
              beforeUpload={(file) => {
                handleBeforeUpload(file as unknown as File);
                return false;
              }}
              onRemove={handleRemove}
              fileList={tempFiles.map((f) => ({
                uid: f.uid,
                name: f.fileId + f.ext,
                status: 'done',
                url: f.imageUrl,
              }))}
              accept="image/jpeg,image/png,image/webp"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            </Upload>
          </Spin>
        </Form.Item>

        {tempFiles.length > 0 && (
          <Form.Item label="上传文件预览">
            <Row gutter={[12, 12]}>
              {tempFiles.map((file) => (
                <Col span={12} key={file.uid}>
                  <Card size="small" title={`图片 ${file.fileId.substring(0, 8)}...`}>
                    <Image src={file.imageUrl} alt="原始图片" style={{ maxHeight: 120, objectFit: 'cover' }} />
                    <div style={{ marginTop: 8 }}>
                      {file.vectorUrl ? (
                        <Tag color="green">SVG 矢量图已转换</Tag>
                      ) : (
                        <Tag color="orange">矢量化失败</Tag>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block disabled={uploading}>
            {uploading ? '等待上传完成...' : '发布游记'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}