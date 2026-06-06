import React, { useMemo, useState } from 'react';
import {
  Tabs,
  Typography,
  Spin,
  message,
  Descriptions,
  Tag,
  Empty,
  Timeline,
  Card,
  Breadcrumb,
  Avatar,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Image,
  Button,
} from 'antd';
import {
  ArrowLeftOutlined,
  PieChartOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicTripById } from '../api/trips';
import { useAuthStore } from '../store/authStore';
import { TripDetailSkeleton } from '../components/Skeletons';
import SkateboardTabBar from '../components/SkateboardTabBar';
import ExportModal from '../components/ExportModal';
import type { Trip, Expense, Note } from '../types';
import dayjs from 'dayjs';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const { Title, Text, Paragraph } = Typography;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#a18cd1', '#fccb90'];

const CATEGORY_COLORS: Record<string, string> = {
  '餐饮': '#f5576c',
  '交通': '#4facfe',
  '住宿': '#667eea',
  '购物': '#f093fb',
  '娱乐': '#43e97b',
  '景点': '#fa709a',
  '其他': '#a18cd1',
};

export default function PublicTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['publicTrip', id],
    queryFn: () => getPublicTripById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const tripData = trip as Trip & { expenses?: Expense[]; notes?: Note[] } | undefined;
  const expenses = (tripData?.expenses as Expense[]) || [];
  const notes = (tripData?.notes as Note[]) || [];

  const dailyExpenseData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const date = dayjs(e.expenseDate).format('YYYY-MM-DD');
      map[date] = (map[date] || 0) + Number(e.amount);
    }
    return Object.entries(map)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses]);

  const categoryStats = useMemo(() => {
    const categoryMap: Record<string, { total: number; count: number }> = {};
    let totalAmount = 0;
    for (const e of expenses) {
      const amount = Number(e.amount);
      totalAmount += amount;
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { total: 0, count: 0 };
      }
      categoryMap[e.category].total += amount;
      categoryMap[e.category].count += 1;
    }
    const categories = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));
    categories.sort((a, b) => b.total - a.total);
    return { total: Math.round(totalAmount * 100) / 100, categories };
  }, [expenses]);

  const statsSummary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (expenses.length === 0) return { total: 0, avgPerDay: 0, maxCategory: null, count: 0 };

    const categoryTotals: Record<string, number> = {};
    const dates = new Set<string>();
    for (const e of expenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      dates.add(dayjs(e.expenseDate).format('YYYY-MM-DD'));
    }

    let maxCategory = '';
    let maxAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxCategory = cat;
      }
    }

    return {
      total: Math.round(total * 100) / 100,
      avgPerDay: dates.size > 0 ? Math.round((total / dates.size) * 100) / 100 : 0,
      maxCategory: maxCategory ? `${maxCategory} (¥${Math.round(maxAmount * 100) / 100})` : null,
      count: expenses.length,
    };
  }, [expenses]);

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !tripData) {
    message.error('该游记不存在或已设为私密');
    navigate('/explore', { replace: true });
    return null;
  }

  const isOwner = tripData.userId === currentUserId;

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <EnvironmentOutlined /> 概览
        </span>
      ),
      children: (
        <div>
          {tripData.coverImage && (
            <div style={{ marginBottom: 24 }}>
              <Image
                src={tripData.coverImage}
                alt={tripData.title}
                style={{
                  width: '100%',
                  maxHeight: 500,
                  objectFit: 'cover',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
                preview={{
                  mask: '查看大图',
                }}
              />
            </div>
          )}

          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="目的地">{tripData.destination}</Descriptions.Item>
            <Descriptions.Item label="作者">
              <Space>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={tripData.User?.avatarUrl}
                />
                <Text>{tripData.User?.username || '匿名用户'}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {dayjs(tripData.startDate).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {dayjs(tripData.endDate).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={tripData.isEnded ? 'default' : 'green'}>
                {tripData.isEnded ? '已结束' : '进行中'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="消费笔数">
              {tripData.expenseCount || 0} 笔
            </Descriptions.Item>
            <Descriptions.Item label="游记篇数">
              {tripData.noteCount || 0} 篇
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(tripData.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          {isOwner && (
            <div style={{ marginTop: 16 }}>
              <Link to={`/trip/${tripData.id}`}>
                <Text type="secondary">
                  这是你的旅程，点击进入管理页面
                </Text>
              </Link>
            </div>
          )}
        </div>
      ),
    },
    ...(expenses.length > 0
      ? [
          {
            key: 'expenses',
            label: (
              <span>
                <DollarOutlined /> 账单 ({expenses.length})
              </span>
            ),
            children: (
              <div>
                <Table
                  dataSource={expenses as Expense[]}
                  rowKey="id"
                  pagination={{ pageSize: 10, size: 'small' }}
                  size="middle"
                  columns={[
                    {
                      title: '日期',
                      dataIndex: 'expenseDate',
                      width: 180,
                      align: 'center',
                      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
                    },
                    {
                      title: '分类',
                      dataIndex: 'category',
                      width: 100,
                      align: 'center',
                      render: (c: string) => (
                        <Tag color={CATEGORY_COLORS[c] || '#a18cd1'}>{c}</Tag>
                      ),
                    },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      width: 120,
                      align: 'center',
                      render: (a: number) => (
                        <Text strong style={{ color: '#ff4d4f' }}>
                          ¥{Number(a).toFixed(2)}
                        </Text>
                      ),
                    },
                    {
                      title: '备注',
                      dataIndex: 'note',
                      align: 'center',
                      ellipsis: true,
                      render: (n: string) => n || '-',
                    },
                  ]}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(notes.length > 0
      ? [
          {
            key: 'notes',
            label: (
              <span>
                <FileTextOutlined /> 游记 ({notes.length})
              </span>
            ),
            children: (
              <div>
                <Timeline
                  mode="left"
                  className="custom-timeline"
                  items={notes.map((note: Note) => ({
                    dot: (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                        }}
                      >
                        <ClockCircleOutlined
                          style={{ fontSize: 16, color: '#667eea', background: 'transparent' }}
                        />
                      </span>
                    ),
                    children: (
                      <Card
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={
                          <Text type="secondary">
                            {dayjs(note.noteDate).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        }
                      >
                        <Paragraph
                          style={{
                            whiteSpace: 'pre-wrap',
                            marginBottom: 12,
                          }}
                        >
                          {note.content}
                        </Paragraph>
                        {note.images && note.images.length > 0 && (
                          <Space wrap size={[12, 12]}>
                            {note.images.map((img: string, i: number) => (
                              <Image
                                key={i}
                                src={img}
                                width={200}
                                height={200}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  border: '1px solid #f0f0f0',
                                }}
                                preview={{
                                  mask: '查看大图',
                                }}
                              />
                            ))}
                          </Space>
                        )}
                      </Card>
                    ),
                  }))}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(expenses.length > 0
      ? [
          {
            key: 'stats',
            label: (
              <span>
                <PieChartOutlined /> 统计
              </span>
            ),
            children: (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="总支出"
                        value={statsSummary.total}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="日均支出"
                        value={statsSummary.avgPerDay}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="消费笔数"
                        value={statsSummary.count}
                        suffix="笔"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="最高消费类别"
                        value={statsSummary.maxCategory || '-'}
                        valueStyle={{ fontSize: 16, color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {categoryStats.categories.length > 0 && (
                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      <Card title="消费分类分布" style={{ marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={categoryStats.categories}
                              dataKey="total"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label={({ category, total }: { category: string; total: number }) =>
                                `${category} ¥${total.toFixed(2)}`
                              }
                            >
                              {categoryStats.categories.map((_, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="每日消费趋势" style={{ marginBottom: 16 }}>
                        {dailyExpenseData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={dailyExpenseData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value: number) => `¥${value.toFixed(2)}`} />
                              <Bar dataKey="amount" fill="#1890ff" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Empty description="暂无日消费数据" />
                        )}
                      </Card>
                    </Col>
                  </Row>
                )}

                {categoryStats.categories.length > 0 && (
                  <Card title="分类明细" size="small" style={{ marginTop: 16 }}>
                    <Table
                      dataSource={categoryStats.categories}
                      rowKey="category"
                      pagination={false}
                      columns={[
                        {
                          title: '分类',
                          dataIndex: 'category',
                          render: (c: string) => <Tag>{c}</Tag>,
                        },
                        {
                          title: '笔数',
                          dataIndex: 'count',
                          align: 'right',
                        },
                        {
                          title: '金额',
                          dataIndex: 'total',
                          align: 'right',
                          render: (v: number) => (
                            <Text strong style={{ color: '#ff4d4f' }}>
                              ¥{v.toFixed(2)}
                            </Text>
                          ),
                        },
                        {
                          title: '占比',
                          key: 'percent',
                          align: 'right',
                          render: (_: unknown, record: { total: number }) => {
                            const pct = categoryStats.total > 0
                              ? ((record.total / categoryStats.total) * 100).toFixed(1)
                              : '0.0';
                            return `${pct}%`;
                          },
                        },
                      ]}
                    />
                  </Card>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <Link to="/explore">
                微游记
              </Link>
            ),
          },
          {
            title: tripData.title,
          },
        ]}
      />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          {tripData.title}
        </Title>
        <Space>
          <Tag color="blue">{tripData.destination}</Tag>
          <Text type="secondary">
            <CalendarOutlined /> {dayjs(tripData.startDate).format('YYYY-MM-DD HH:mm:ss')} ~ {dayjs(tripData.endDate).format('YYYY-MM-DD HH:mm:ss')}
          </Text>
        </Space>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <SkateboardTabBar
          activeKey={activeTab}
          onChange={(key: string) => setActiveTab(key)}
          items={tabItems}
        />
        {(notes.length > 0 || expenses.length > 0) && (
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportModalOpen(true)}
            style={{ flexShrink: 0, marginBottom: 16 }}
          >
            导出游记
          </Button>
        )}
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={(key: string) => setActiveTab(key)}
        tabBarStyle={{ display: 'none' }}
        items={tabItems}
      />

      {/* 游记导出弹窗 */}
      {tripData && (
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          tripId={tripData.id}
          tripTitle={tripData.title}
          notes={notes}
          hasExpenses={expenses.length > 0}
        />
      )}
    </div>
  );
}