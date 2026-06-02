import React, { useState } from 'react';
import {
  Card,
  Typography,
  Pagination,
  Tag,
  Empty,
  Space,
} from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPublicTrips } from '../api/trips';
import { useAuthStore } from '../store/authStore';
import { CardListSkeleton } from '../components/Skeletons';
import type { Trip } from '../types';

const { Title, Text } = Typography;

export default function ExplorePage() {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['publicTrips', page],
    queryFn: () => getPublicTrips({ page, pageSize }),
  });

  const handleCardClick = (tripId: string) => {
    navigate(`/public-trip/${tripId}`);
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        微游记
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        发现其他旅行者的精彩分享
      </Text>

      {isLoading ? (
        <CardListSkeleton count={6} />
      ) : data && data.list.length > 0 ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {data.list.map((trip: Trip) => (
              <Card
                key={trip.id}
                hoverable
                onClick={() => handleCardClick(trip.id)}
                cover={
                  trip.coverImage ? (
                    <div
                      style={{
                        height: 180,
                        overflow: 'hidden',
                        background: '#f0f2f5',
                      }}
                    >
                      <img
                        src={trip.coverImage}
                        alt={trip.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f0f2f5',
                      }}
                    >
                      <EnvironmentOutlined
                        style={{ fontSize: 48, color: '#bfbfbf' }}
                      />
                    </div>
                  )
                }
              >
                <Card.Meta
                  title={
                    <Space>
                      {trip.title}
                      {currentUserId && trip.userId === currentUserId && (
                        <Tag color="orange">我的</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: '100%' }}
                      >
                        <Space>
                          <EnvironmentOutlined />
                          <Text type="secondary">{trip.destination}</Text>
                        </Space>
                        <Space>
                          <CalendarOutlined />
                          <Text type="secondary">
                            {dayjs(trip.startDate).format('YYYY-MM-DD HH:mm:ss')} -{' '}
                            {dayjs(trip.endDate).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </Space>
                        <Space>
                          <Text type="secondary">
                            {trip.User?.username ? `@${trip.User.username}` : ''}
                          </Text>
                        </Space>
                        {trip.isEnded === 1 ? (
                          <Tag color="blue">已结束</Tag>
                        ) : (
                          <Tag color="green">进行中</Tag>
                        )}
                      </Space>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={pageSize}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="暂无公开游记" />
      )}
    </div>
  );
}