import { useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useAdminSWR, { mutate, ADMIN_SWR_KEYS, useAdminMutation } from '@/hooks';
import adminApiClient from '@/api/client';
import type { LanguageString } from '@/types/admin';
import './index.css';

type EditingLanguageString = Omit<LanguageString, 'id' | 'updated_at'> & {
  id?: number;
};

const CATEGORIES = [
  { label: '通用', value: 'common' },
  { label: '仪式', value: 'ritual' },
  { label: '结果', value: 'result' },
  { label: '错误', value: 'error' },
];

export default function LanguageManager() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EditingLanguageString | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useAdminSWR<LanguageString[]>(
    ADMIN_SWR_KEYS.languageStrings,
    undefined,
    { errorMessage: '加载多语言文案失败' }
  );

  const deleteMutation = useAdminMutation(
    (id: number) => adminApiClient.delete(`/api/admin/language-strings/${id}`),
    {
      successMessage: '删除成功',
      errorMessage: '删除失败',
      onSuccess: () => mutate(ADMIN_SWR_KEYS.languageStrings),
    }
  );

  const upsertMutation = useAdminMutation(
    (payload: { id?: number; values: EditingLanguageString }) => {
      const { id, values } = payload;
      if (id) {
        return adminApiClient.put(`/api/admin/language-strings/${id}`, values);
      }
      return adminApiClient.post('/api/admin/language-strings', values);
    },
    {
      successMessage: '保存成功',
      errorMessage: '操作失败',
      onSuccess: () => {
        setModalVisible(false);
        mutate(ADMIN_SWR_KEYS.languageStrings);
      },
    }
  );

  const handleAddNew = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: LanguageString) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.trigger(id);
  };

  const handleModalOk = async () => {
    const values = await form.validateFields();
    await upsertMutation.trigger({ id: editingRecord?.id, values });
  };

  const columns = [
    {
      title: '键',
      dataIndex: 'key',
      key: 'key',
      width: '15%',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: '10%',
      render: (text: string) => {
        const category = CATEGORIES.find((c) => c.value === text);
        return category?.label || text;
      },
    },
    {
      title: '中文',
      dataIndex: 'zh',
      key: 'zh',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '英文',
      dataIndex: 'en',
      key: 'en',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_: any, record: LanguageString) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="language-manager">
      <Card
        title="多语言管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            新增文案
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description="暂无数据" /> }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑文案' : '新增文案'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="key"
            label="键"
            rules={[{ required: true, message: '请输入键' }]}
          >
            <Input placeholder="例如：ritual.start.button" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              placeholder="选择分类"
              options={CATEGORIES}
            />
          </Form.Item>

          <Form.Item
            name="zh"
            label="中文"
            rules={[{ required: true, message: '请输入中文' }]}
          >
            <Input.TextArea rows={3} placeholder="输入中文文案" />
          </Form.Item>

          <Form.Item
            name="en"
            label="英文"
            rules={[{ required: true, message: '请输入英文' }]}
          >
            <Input.TextArea rows={3} placeholder="输入英文文案" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
