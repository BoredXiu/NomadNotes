import React, { useState } from 'react';
import {
  Card,
  Typography,
  Pagination,
  Tag,
  Avatar,
  Empty,
  Space,
} from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPublicTrips, getPublicTripById } from '../api/trips';
import { CardListSkeleton } from '../components/Skeletons';
import type { Trip } from '../types';

const { Title, Text } = Typography;

export default function ExplorePage() {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['publicTrips', page],
    queryFn: () => getPublicTrips({ page, pageSize }),
  });

  const handlePrefetch = (tripId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['publicTrip', tripId],
      queryFn: () => getPublicTripById(tripId),
      staleTime: 5 * 60 * 1000,
    });
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
                onClick={() => navigate(`/trip/${trip.id}`)}
                onMouseEnter={() => handlePrefetch(trip.id)}
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
                  title={trip.title}
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
                            {dayjs(trip.startDate).format('YYYY/MM/DD')} -{' '}
                            {dayjs(trip.endDate).format('YYYY/MM/DD')}
                          </Text>
                        </Space>
                        {trip.User && (
                          <Space style={{ marginTop: 8 }}>
                            {trip.User.avatarUrl ? (
                              <Avatar src={trip.User.avatarUrl} size={24} />
                            ) : (
                              <Avatar
                                size={24}
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#1890ff' }}
                              >
                                {trip.User.username?.charAt(0).toUpperCase()}
                              </Avatar>
                            )}
                            <Text type="secondary">{trip.User.username}</Text>
                          </Space>
                        )}
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