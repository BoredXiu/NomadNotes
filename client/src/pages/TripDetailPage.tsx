import { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  message,
  Button,
  Space,
  Switch,
  Descriptions,
  Tag,
  Table,
  Popconfirm,
  Empty,
  Image,
  Card,
  Breadcrumb,
  Avatar,
  Row,
  Col,
  Statistic,
  Tabs,
  Input,
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
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import * as tripsApi from '../api/trips';
import * as expensesApi from '../api/expenses';
import * as notesApi from '../api/notes';
import { submitAudit } from '../api/admin';
import { TripDetailSkeleton } from '../components/Skeletons';
import SkateboardNav from '../components/SkateboardNav';
import SkateboardTabBar from '../components/SkateboardTabBar';
import type { Trip, Expense, Note, ExpenseStats } from '../types';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import ExportModal from '../components/ExportModal';
import CurrencySwitcher from '../components/CurrencySwitcher';
import { useCurrencyStore } from '../store/currencyStore';
import { usePageEnter } from '../hooks/useGsapAnimations';
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

const { Title, Text } = Typography;

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const NOTE_COLORS = ['#52c41a', '#1890ff', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2'];

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'expenses');

  // GSAP 页面入场动画
  const pageRef = usePageEnter(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // 多币种支持
  const { currency, getCurrencySymbol, convertAmount } = useCurrencyStore();
  const currencySymbol = getCurrencySymbol();

  // 格式化金额（带货币符号和转换）
  const formatAmount = (amount: number) => {
    const converted = convertAmount(amount);
    return `${currencySymbol}${converted.toFixed(currency === 'JPY' ? 0 : 2)}`;
  };


  const isOwner = trip?.isOwner === true;
  const isAdmin = trip?.isAdmin === true;
  // 管理员可以查看任何旅程的详细数据（账单/游记/统计）
  const canViewDetails = isOwner || isAdmin;

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

  const statsSummary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (expenses.length === 0) return { total: 0, avgPerDay: 0, maxCategory: null, count: 0, noteCount: 0, totalImages: 0 };

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

    let totalImages = 0;
    for (const n of notes) {
      totalImages += (n.images?.length || 0);
    }

    return {
      total: Math.round(total * 100) / 100,
      avgPerDay: dates.size > 0 ? Math.round((total / dates.size) * 100) / 100 : 0,
      maxCategory: `${maxCategory} (${currencySymbol}${convertAmount(Math.round(maxAmount * 100) / 100).toFixed(currency === 'JPY' ? 0 : 2)})`,
      count: expenses.length,
      noteCount: notes.length,
      totalImages,
    };
  }, [expenses, notes]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tripData = await tripsApi.getTripById(id);
      setTrip(tripData);

      if (tripData.isOwner || tripData.isAdmin) {
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
    // 保存切换前的状态，用于失败回滚
    const prevIsPublic = trip.isPublic;
    try {
      if (checked) {
        // 提交公开审核申请（不直接设为公开）
        await submitAudit(trip.id);
        message.success("已提交到管理员审核");
      } else {
        // 乐观更新：立即更新本地状态，避免界面延迟
        setTrip((prev) => prev ? { ...prev, isPublic: 0 } : null);
        await tripsApi.updateTrip(trip.id, { isPublic: 0 });
        message.success("已设为私密");
        fetchData();
      }
    } catch (error: any) {
      // 失败时恢复原始状态
      setTrip((prev) => prev ? { ...prev, isPublic: prevIsPublic } : null);
      message.error(error?.response?.data?.message || "操作失败");
    }
  };

  if (loading) {
    return <TripDetailSkeleton />;
  }

  if (!trip) {
    return <Empty description="旅程不存在" />;
  }

  const expenseColumns: any = [
    {
      title: '日期',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      align: 'center',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      render: (c: string) => <Tag>{c}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'center',
      render: (a: number) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          {formatAmount(Number(a))}
        </Text>
      ),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      align: 'center',
      ellipsis: true,
      render: (note: string) => note ? <span>{note}</span> : <Text type="secondary">-</Text>,
    },
    {
      title: '小票',
      dataIndex: 'receiptImages',
      key: 'receiptImages',
      align: 'center',
      render: (imgs: string[] | null) =>
        imgs && imgs.length > 0 ? (
          <Space size={4}>
            {imgs.map((img, idx) => (
              <Image
                key={idx}
                src={img}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                preview={{
                  mask: '查看',
                }}
              />
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      render: (_: unknown, record: Expense) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/trip/${id}/expense/${record.id}/edit`)}
          />
          <Popconfirm
            title="确定删除这条账单吗？"
            onConfirm={() => handleDeleteExpense(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    ...(canViewDetails ? [
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
                  <Table.Summary.Cell index={1} colSpan={4}>
                    <Text strong style={{ color: '#ff4d4f',display:'block', textAlign:'right' }}>
                      {formatAmount(total)}
                    </Text>
                  </Table.Summary.Cell>

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
            <Table
              dataSource={notes}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'noteDate',
                  key: 'noteDate',
                  align: 'center',
                  width: 180,
                  render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm:ss'),
                },
                {
                  title: '内容',
                  dataIndex: 'content',
                  key: 'content',
                  align: 'center',
                  ellipsis: true,
                  render: (text: string) => (
                    <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>{text}</div>
                  ),
                },
                {
                  title: '图片',
                  dataIndex: 'images',
                  key: 'images',
                  align: 'center',
                  width: 160,
                  render: (imgs: string[] | null) =>
                    imgs && imgs.length > 0 ? (
                      <Space size={4}>
                        {imgs.map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                            preview={{ mask: '查看' }}
                          />
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">-</Text>
                    ),
                },
                {
                  title: '操作',
                  key: 'action',
                  align: 'center',
                  width: 160,
                  render: (_: unknown, record: Note) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/trip/${id}/note/${record.id}/edit`)}
                      />
                      <Popconfirm
                        title="确定删除这篇游记吗？"
                        onConfirm={() => handleDeleteNote(record.id)}
                      >
                        <Button type="link" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <CurrencySwitcher />
          </div>
          {expenses.length > 0 || notes.length > 0 ? (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="总支出"
                      value={convertAmount(statsSummary.total)}
                      precision={currency === 'JPY' ? 0 : 2}
                      prefix={currencySymbol}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="日均支出"
                      value={convertAmount(statsSummary.avgPerDay)}
                      precision={currency === 'JPY' ? 0 : 2}
                      prefix={currencySymbol}
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
                      value={statsSummary.maxCategory || '暂无'}
                      valueStyle={{ fontSize: 16, color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="游记篇数"
                      value={statsSummary.noteCount}
                      suffix="篇"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="游记图片数"
                      value={statsSummary.totalImages}
                      suffix="张"
                      valueStyle={{ color: '#13c2c2' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="游记配图率"
                      value={statsSummary.noteCount > 0
                        ? ((statsSummary.totalImages / statsSummary.noteCount)).toFixed(1)
                        : '0.0'}
                      suffix="张/篇"
                      valueStyle={{ color: '#eb2f96' }}
                    />
                  </Card>
                </Col>
              </Row>

              {stats && stats.categories.length > 0 && (
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Card title="消费分类分布" style={{ marginBottom: 16 }}>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={stats.categories}
                            dataKey="total"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={0}
                            paddingAngle={0}
                            labelLine={false}
                            label={({ category, total }) =>
                              `${category} ${formatAmount(total)}`
                            }
                          >
                            {stats.categories.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatAmount(value)} />
                          <Legend formatter={(value, entry) => {
                            const data = entry.payload;
                            if (data && typeof data.value === 'number') {
                              return `${value} ${formatAmount(data.value)}`;
                            }
                            return value;
                          }} />
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
                            <Tooltip
                              formatter={(value: number) => [formatAmount(value), '金额']}
                              labelFormatter={(label) => `日期: ${label}`}
                            />
                            <Bar dataKey="amount" fill="#1890ff" radius={[4, 4, 0, 0]} name="金额" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty description="暂无日消费数据" />
                      )}
                    </Card>
                  </Col>
                </Row>
              )}

              {stats && stats.categories.length > 0 && (
                <Card title="分类明细" size="small" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={stats.categories}
                    rowKey="category"
                    pagination={false}
                    columns={[
                      {
                        title: '分类',
                        dataIndex: 'category',
                        align: 'center',
                        render: (c: string) => <Tag>{c}</Tag>,
                      },
                      {
                        title: '笔数',
                        dataIndex: 'count',
                        align: 'center',
                      },
                      {
                        title: '金额',
                        dataIndex: 'total',
                        align: 'center',
                        render: (v: number) => (
                          <Text strong style={{ color: '#ff4d4f' }}>
                            {formatAmount(v)}
                          </Text>
                        ),
                      },
                      {
                        title: '占比',
                        key: 'percent',
                        align: 'right',
                        render: (_: unknown, record: { total: number }) => {
                          const pct = stats.total > 0
                            ? ((record.total / stats.total) * 100).toFixed(1)
                            : '0.0';
                          return `${pct}%`;
                        },
                      },
                    ]}
                  />
                </Card>
              )}
            </>
          ) : expenses.length === 0 && notes.length === 0 ? (
            <Empty description="暂无消费数据与游记数据" />
          ) : expenses.length === 0 ? (
            <Empty description="暂无消费数据" />
          ) : null}
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
            {dayjs(trip.startDate).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="结束日期">
            {dayjs(trip.endDate).format('YYYY-MM-DD HH:mm:ss')}
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
    <div ref={pageRef}>
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
        onChange={(key: string) => {
          setActiveTab(key);
          setSearchParams({ tab: key }, { replace: true });
        }}
        renderTabBar={() => (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <SkateboardTabBar
              activeKey={activeTab}
              onChange={(key: string) => {
                setActiveTab(key);
                setSearchParams({ tab: key }, { replace: true });
              }}
              items={tabItems}
            />
            <Space style={{ flexShrink: 0, marginBottom: 16 }}>
              {(notes.length > 0 || expenses.length > 0) && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setExportModalOpen(true)}
                >
                  导出游记
                </Button>
              )}
            </Space>
          </div>
        )}
        items={tabItems}
      />

      {/* 游记导出弹窗 */}
      {trip && (
        <ExportModal
          open={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          tripId={trip.id}
          tripTitle={trip.title}
          notes={notes}
          hasExpenses={expenses.length > 0}
        />
      )}
    </div>
  );
}