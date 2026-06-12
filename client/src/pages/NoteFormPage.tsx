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
  Image,
  Spin,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import * as notesApi from '../api/notes';
import { compressImage } from '../utils/compress';
import dayjs from 'dayjs';
import type { Note } from '../types';
import type { UploadFile } from 'antd';

const { Title } = Typography;

interface TempFileInfo {
  uid: string;
  fileId: string;
  imageUrl: string;
  ext: string;
}

export default function NoteFormPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [tempFiles, setTempFiles] = useState<TempFileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [existingNote, setExistingNote] = useState<Note | null>(null);
  const [replacingImages, setReplacingImages] = useState(false);
  const navigate = useNavigate();
  const { id, tripId, noteId } = useParams<{ id?: string; tripId?: string; noteId?: string }>();

  const resolvedTripId = id || tripId;
  const isEditing = !!noteId;

  useEffect(() => {
    if (isEditing && noteId) {
      setFetching(true);
      notesApi.getNoteById(noteId)
        .then((note) => {
          setExistingNote(note);
          form.setFieldsValue({
            content: note.content,
            noteDate: dayjs(note.noteDate),
          });
        })
        .catch(() => {
          message.error('加载游记数据失败');
          navigate(-1);
        })
        .finally(() => setFetching(false));
    }
  }, [isEditing, noteId, form, navigate]);

  const handleBeforeUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 750, 0.8);
      const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      const results = await notesApi.uploadTmpImages([compressedFile]);
      const result = results[0];
      setTempFiles((prev) => [
        ...prev,
        {
          uid: result.fileId,
          fileId: result.fileId,
          imageUrl: result.imageUrl,
          ext: result.ext,
        },
      ]);
      setReplacingImages(true);
      message.success(`图片 "${file.name}" 已压缩并暂存`);
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
      if (tempFiles.length <= 1) {
        setReplacingImages(false);
      }
    }
  };

  const onFinish = async (values: {
    content: string;
    noteDate: dayjs.Dayjs;
  }) => {
    if (!resolvedTripId) return;
    setLoading(true);
    try {
      if (isEditing && noteId) {
        if (replacingImages && tempFiles.length > 0) {
          await notesApi.updateNote(noteId, {
            content: values.content,
            noteDate: values.noteDate.format('YYYY-MM-DD HH:mm:ss'),
            tempFiles: tempFiles.map((f) => ({
              fileId: f.fileId,
              ext: f.ext,
            })),
          });
        } else {
          await notesApi.updateNote(noteId, {
            content: values.content,
            noteDate: values.noteDate.format('YYYY-MM-DD HH:mm:ss'),
          });
        }
        message.success('游记更新成功');
        navigate(`/trip/${resolvedTripId}?tab=notes`);
      } else {
        await notesApi.createNoteWithTempFiles(resolvedTripId, {
          content: values.content,
          noteDate: values.noteDate.format('YYYY-MM-DD HH:mm:ss'),
          tempFiles: tempFiles.map((f) => ({
            fileId: f.fileId,
            ext: f.ext,
          })),
        });
        message.success('游记发布成功');
        navigate(`/trip/${resolvedTripId}?tab=notes`);
      }
    } catch {
      message.error(isEditing ? '更新游记失败' : '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReplace = () => {
    setReplacingImages(true);
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ maxWidth: 700, margin: '0 auto' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={4} style={{ margin: 0 }}>
          {isEditing ? '编辑游记' : '写游记'}
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
          <DatePicker
            showTime={{ format: 'HH:mm:ss' }}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="游记正文"
          rules={[{ required: true, message: '请输入游记内容' }]}
        >
          <Input.TextArea rows={6} placeholder="记录旅途中的精彩瞬间..." />
        </Form.Item>

        {isEditing && existingNote && existingNote.images && existingNote.images.length > 0 && !replacingImages ? (
          <Form.Item label="已有图片">
            <Row gutter={[8, 8]}>
              {existingNote.images.map((img, idx) => (
                <Col key={idx}>
                  <Image
                    src={img}
                    alt={`游记图片 ${idx + 1}`}
                    style={{ maxHeight: 150, objectFit: 'contain' }}
                  />
                </Col>
              ))}
            </Row>
            <Button
              type="dashed"
              icon={<UploadOutlined />}
              onClick={handleStartReplace}
              style={{ marginTop: 8 }}
            >
              替换图片
            </Button>
          </Form.Item>
        ) : (
          <Form.Item label="图片">
            <Upload
              multiple
              listType="picture-card"
              fileList={tempFiles.map((f) => ({
                uid: f.uid,
                name: f.uid,
                status: 'done' as const,
                url: f.imageUrl,
              }))}
              beforeUpload={handleBeforeUpload}
              onRemove={handleRemove}
              accept="image/jpeg,image/png,image/webp"
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
            >
              {tempFiles.length < 10 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {isEditing ? '更新游记' : '发布游记'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}