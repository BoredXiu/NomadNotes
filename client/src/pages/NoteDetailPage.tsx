import React, { useEffect, useState } from 'react';
import {
  Typography,
  Spin,
  message,
  Button,
  Space,
  Image,
  Card,
  Breadcrumb,
  Empty,
  Segmented,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as notesApi from '../api/notes';
import * as tripsApi from '../api/trips';
import type { Note, Trip } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function NoteDetailPage() {
  const { id, noteId } = useParams<{ id: string; noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<string>('original');

  useEffect(() => {
    if (!id || !noteId) return;
    setLoading(true);
    Promise.all([
      notesApi.getTripNotes(id),
      tripsApi.getTripById(id),
    ])
      .then(([notes, tripData]) => {
        setTrip(tripData);
        const found = notes.find((n) => n.id === noteId);
        if (found) {
          setNote(found);
        } else {
          message.error('游记不存在');
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  }, [id, noteId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!note) {
    return <Empty description="游记不存在" />;
  }

  const hasVectors =
    note.vectorImages &&
    Array.isArray(note.vectorImages) &&
    note.vectorImages.length > 0;

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/">我的旅程</Link> },
          {
            title: <Link to={`/trip/${id}`}>{trip?.title || '旅程'}</Link>,
          },
          { title: dayjs(note.noteDate).format('YYYY/MM/DD') + ' 游记' },
        ]}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          type="text"
        />
      </Space>

      <Card>
        <Title level={4}>
          游记 - {dayjs(note.noteDate).format('YYYY/MM/DD')}
        </Title>
        <Text type="secondary">
          创建于 {dayjs(note.createdAt).format('YYYY/MM/DD HH:mm')}
        </Text>

        <div
          style={{
            margin: '24px 0',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            fontSize: 16,
          }}
        >
          {note.content}
        </div>

        {note.images && note.images.length > 0 && (
          <div>
            {hasVectors && (
              <Segmented
                options={[
                  { label: '原始图片', value: 'original' },
                  { label: '矢量图 (SVG)', value: 'vector' },
                ]}
                value={viewMode}
                onChange={(val) => setViewMode(val as string)}
                style={{ marginBottom: 16 }}
              />
            )}
            <Space wrap size={[12, 12]}>
              {viewMode === 'original'
                ? note.images.map((img, i) => (
                    <Image
                      key={i}
                      src={img}
                      width={200}
                      style={{ borderRadius: 8 }}
                    />
                  ))
                : note.vectorImages?.map(
                    (vec, i) =>
                      vec && (
                        <img
                          key={i}
                          src={vec}
                          alt={`vector-${i}`}
                          style={{
                            width: 200,
                            height: 200,
                            objectFit: 'contain',
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            background: '#fafafa',
                          }}
                        />
                      )
                  )}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
}