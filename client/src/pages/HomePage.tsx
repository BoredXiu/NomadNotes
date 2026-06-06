import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Empty,
  Space,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as tripsApi from '../api/trips';
import { CardListSkeleton } from '../components/Skeletons';
import type { Trip } from '../types';
import dayjs from 'dayjs';
import { usePageEnter, useStaggerList } from '../hooks/useGsapAnimations';

const { Title, Text } = Typography;

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // GSAP 动画
  const pageRef = usePageEnter(0);
  const { containerRef: listRef } = useStaggerList(0.06, 0.2);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const result = await tripsApi.getTrips({ page: 1, pageSize: 50 });
      setTrips(result.list);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
      } else if (error.response?.status === 500) {
        message.error('服务器错误，请检查后端是否正常运行');
      } else if (error.message?.includes('Network Error')) {
        message.error('无法连接服务器，请确认后端已启动 (端口 3434)');
      } else {
        message.error(`加载旅程列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await tripsApi.deleteTrip(id);
      message.success('旅程已删除');
      fetchTrips();
    } catch {
      message.error('删除失败');
    }
  };

  if (loading) {
    return <CardListSkeleton count={8} />;
  }

  return (
    <div ref={pageRef}>
      <Title level={3} style={{ marginBottom: 24 }}>
        我的旅程
      </Title>

      {trips.length === 0 ? (
        <Empty description="还没有旅程，点击上方按钮开始记录吧" />
      ) : (
        <Row gutter={[16, 16]} ref={listRef}>
          {trips.map((trip) => (
            <Col key={trip.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(`/trip/${trip.id}`)}
                cover={
                  trip.coverImage ? (
                    <img
                      alt={trip.title}
                      src={trip.coverImage}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 160,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EnvironmentOutlined
                        style={{ fontSize: 48, color: 'rgba(255,255,255,0.6)' }}
                      />
                    </div>
                  )
                }
                actions={[
                  <EditOutlined
                    key="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/trip/${trip.id}/edit`);
                    }}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个旅程吗？所有账单和游记也会被删除。"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(trip.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <DeleteOutlined
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ff7875'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                    />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      {trip.isPublic === 1 && <Tag color="green">公开</Tag>}
                      {trip.title}
                      {trip.isEnded === 1 && <Tag color="blue">已结束</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>
                        <EnvironmentOutlined /> {trip.destination}
                      </Text>
                      <Text type="secondary">
                        <CalendarOutlined /> {dayjs(trip.startDate).format('YYYY-MM-DD HH:mm:ss')}{' '}
                        - {dayjs(trip.endDate).format('YYYY-MM-DD HH:mm:ss')}
                      </Text>
                      <Space>
                        <Text type="secondary">
                          <DollarOutlined /> {trip.expenseCount} 笔账单
                        </Text>
                        <Text type="secondary">
                          <FileTextOutlined /> {trip.noteCount} 篇游记
                        </Text>
                      </Space>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}