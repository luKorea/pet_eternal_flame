import { useState } from 'react';
import { Card, Table, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import useAdminSWR, { ADMIN_SWR_KEYS } from '@/hooks';
import { fetchUsers } from '@/api';
import type { UserListItem } from '@/types/admin';

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminSWR(
    ADMIN_SWR_KEYS.users(page, search),
    () => fetchUsers({ page, per_page: 20, search: search || undefined }),
    { errorMessage: '加载用户列表失败' }
  );

  const onSearch = () => {
    setPage(1);
  };

  const onTableChange = (pagination: { current?: number }) => {
    const next = pagination.current ?? 1;
    setPage(next);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  ];

  return (
    <div>
      <Card
        title="用户管理"
        extra={
          <Space>
            <Input
              placeholder="搜索用户名"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={onSearch}
              style={{ width: 200 }}
              allowClear
            />
            <a onClick={onSearch}>搜索</a>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total ?? 0,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={onTableChange}
        />
      </Card>
    </div>
  );
}
