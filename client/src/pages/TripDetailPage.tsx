import React, { useEffect, useState } from 'react';
import {
  Tabs,
  Typography,
  Spin,
  message,
  Button,
  Space,
  Switch,
  Descriptions,
  Tag,
  Table,
  Popconfirm,
  Empty,
  Timeline,
  Image,
  Card,
  Breadcrumb,
  Segmented,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  PieChartOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as tripsApi from '../api/trips';
import * as expensesApi from '../api/expenses';
import * as notesApi from '../api/notes';
import { useAuthStore } from '../store/authStore';
import { TripDetailSkeleton } from '../components/Skeletons';
import type { Trip, Expense, Note, ExpenseStats } from '../types';
import dayjs from 'dayjs';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title, Text } = Typography;

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [viewMode, setViewMode] = useState<string>('original');
  const user = useAuthStore((s) => s.user);

  const isOwner = trip?.isOwner !== false;

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tripData = await tripsApi.getTripById(id);
      setTrip(tripData);

      if (tripData.isOwner !== false) {
        const [expensesData, notesData, statsData] = await Promise.all([
          expensesApi.getTripExpenses(id, { pageSize: 100 }),
          notesApi.getTripNotes(id),
          expensesApi.getExpenseStats(id),
        ]);
        setExpenses(expensesData.list);
        setNotes(notesData);
        setStats(statsData);
      }
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expensesApi.deleteExpense(expenseId);
      message.success('账单已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesApi.deleteNote(noteId);
      message.success('游记已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleEndTrip = async () => {
    if (!trip) return;
    try {
      await tripsApi.updateTrip(trip.id, { isEnded: 1 });
      message.success('旅程已标记为结束');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    if (!trip) return;
    try {
      await tripsApi.updateTrip(trip.id, { isPublic: checked ? 1 : 0 });
      message.success(checked ? '已设为公开' : '已设为私密');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  if (loading) {
    return <TripDetailSkeleton />;
  }

  if (!trip) {
    return <Empty description="旅程不存在" />;
  }

  const expenseColumns = [
    {
      title: '日期',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (d: string) => dayjs(d).format('YYYY/MM/DD'),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (a: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          ¥{Number(a).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Expense) => (
        <Popconfirm
          title="确定删除这条账单吗？"
          onConfirm={() => handleDeleteExpense(record.id)}
        >
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    ...(isOwner ? [
      {
        key: 'expenses',
        label: (
          <span>
            <DollarOutlined /> 账单
          </span>
        ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/trip/${id}/expense/new`)}
            >
              记一笔
            </Button>
          </Space>
          <Table
            columns={expenseColumns}
            dataSource={expenses}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无账单记录' }}
            summary={() => {
              const total = expenses.reduce(
                (sum, e) => sum + Number(e.amount),
                0
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>合计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      ¥{total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={2} />
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      ),
    },
    {
      key: 'notes',
      label: (
        <span>
          <EditOutlined /> 游记
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/trip/${id}/note/new`)}
            >
              写游记
            </Button>
          </Space>
          {notes.length === 0 ? (
            <Empty description="暂无游记" />
          ) : (
            <Timeline
              items={notes.map((note) => ({
                children: (
                  <Card
                    key={note.id}
                    size="small"
                    title={
                      <Space>
                        <Text type="secondary">
                          {dayjs(note.noteDate).format('YYYY/MM/DD')}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Popconfirm
                        title="确定删除这篇游记吗？"
                        onConfirm={() => handleDeleteNote(note.id)}
                      >
                        <Button type="link" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    }
                  >
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        marginBottom: 12,
                      }}
                    >
                      {note.content}
                    </div>
                    {note.images && note.images.length > 0 && (
                      <Space wrap>
                        {note.images.map((img, i) => (
                          <Image
                            key={i}
                            src={img}
                            width={120}
                            height={120}
                            style={{ objectFit: 'cover', borderRadius: 8 }}
                          />
                        ))}
                      </Space>
                    )}
                  </Card>
                ),
              }))}
            />
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      label: (
        <span>
          <PieChartOutlined /> 统计
        </span>
      ),
      children: (
        <div>
          {stats && stats.categories.length > 0 ? (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>
                总支出：¥{stats.total.toFixed(2)}
              </Title>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stats.categories}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ category, total }) =>
                      `${category} ¥${total.toFixed(0)}`
                    }
                  >
                    {stats.categories.map((_, index) => (
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
            </div>
          ) : (
            <Empty description="暂无消费数据" />
          )}
        </div>
      ),
    }] : []),
    {
      key: 'overview',
      label: (
        <span>
          <EnvironmentOutlined /> 概览
        </span>
      ),
      children: (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="目的地">{trip.destination}</Descriptions.Item>
          <Descriptions.Item label="开始日期">
            {dayjs(trip.startDate).format('YYYY年MM月DD日')}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期">
            {dayjs(trip.endDate).format('YYYY年MM月DD日')}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {trip.isEnded === 1 ? <Tag color="blue">已结束</Tag> : <Tag color="green">进行中</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="公开状态">
            {trip.isPublic === 1 ? <Tag color="green">公开</Tag> : <Tag color="default">私密</Tag>}
          </Descriptions.Item>
          {trip.expenseCount !== undefined && (
            <Descriptions.Item label="账单数">{trip.expenseCount} 条</Descriptions.Item>
          )}
          {trip.noteCount !== undefined && (
            <Descriptions.Item label="游记数">{trip.noteCount} 篇</Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to={isOwner ? "/" : "/explore"}>{isOwner ? '我的旅程' : '微游记'}</Link> },
          { title: trip.title },
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(isOwner ? '/' : '/explore')}
              type="text"
            />
            <Title level={4} style={{ margin: 0 }}>
              {trip.title}
              {trip.isEnded === 1 ? (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  已结束
                </Tag>
              ) : (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  进行中
                </Tag>
              )}
            </Title>
          </Space>
          {isOwner ? (
            <Space>
              {trip.isEnded === 0 && (
                <Popconfirm
                  title="确定要结束这次旅程吗？结束后将无法再添加账单和游记。"
                  onConfirm={handleEndTrip}
                >
                  <Button>结束旅程</Button>
                </Popconfirm>
              )}
              <Switch
                checked={trip.isPublic === 1}
                onChange={handleTogglePublic}
                checkedChildren="公开"
                unCheckedChildren="私密"
              />
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/trip/${trip.id}/edit`)}
              >
                编辑
              </Button>
            </Space>
          ) : (
            trip.User && (
              <Space>
                {trip.User.avatarUrl ? (
                  <Avatar src={trip.User.avatarUrl} size="small" />
                ) : (
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                    {trip.User.username?.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Text>{trip.User.username}</Text>
              </Space>
            )
          )}
        </Space>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
}