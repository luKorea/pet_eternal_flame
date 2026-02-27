import { useState } from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import { UserOutlined, CalculatorOutlined, FireOutlined } from '@ant-design/icons';
import useAdminSWR, { ADMIN_SWR_KEYS } from '@/hooks';
import { fetchStats, fetchCalculateLogs } from '@/api';

export default function StatsPage() {
  const [page, setPage] = useState(1);

  const { data: stats } = useAdminSWR(
    ADMIN_SWR_KEYS.stats,
    () => fetchStats(),
    { errorMessage: '加载统计失败' }
  );

  const { data: logsData, isLoading: logsLoading } = useAdminSWR(
    ADMIN_SWR_KEYS.calculateLogs(page),
    () => fetchCalculateLogs({ page, per_page: 20 }),
    { errorMessage: '加载计算记录失败' }
  );

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', width: 80, render: (v: number | null) => v ?? '—' },
    { title: '宠物名', dataIndex: 'pet_name', key: 'pet_name', ellipsis: true, render: (v: string | null) => v || '—' },
    { title: '死亡日期', dataIndex: 'death_date', key: 'death_date', width: 120 },
    { title: '语言', dataIndex: 'locale', key: 'locale', width: 70 },
    { title: '请求时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="注册用户总数" value={stats?.total_users ?? 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="今日计算次数" value={stats?.today_calculates ?? 0} prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="累计计算次数" value={stats?.total_calculates ?? 0} prefix={<CalculatorOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card title="计算请求记录">
        <Table
          columns={columns}
          dataSource={logsData?.items ?? []}
          rowKey="id"
          loading={logsLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: logsData?.total ?? 0,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>
    </div>
  );
}
