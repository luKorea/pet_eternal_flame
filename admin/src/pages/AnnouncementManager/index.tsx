import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import useAdminSWR, { mutate, ADMIN_SWR_KEYS, useAdminMutation } from '@/hooks';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api';
import type { Announcement } from '@/types/admin';
import RichTextEditor from '@/components/RichTextEditor';

export default function AnnouncementManager() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form] = Form.useForm();

  const { data: list, isLoading } = useAdminSWR<Announcement[]>(
    ADMIN_SWR_KEYS.announcements,
    () => fetchAnnouncements(),
    { errorMessage: '加载公告失败' }
  );

  const saveMutation = useAdminMutation<{ editing: Announcement | null; values: any }, void>(
    async (payload: { editing: Announcement | null; values: any }) => {
      const { editing, values } = payload;
      if (editing) {
        await updateAnnouncement(editing.id, {
          title: values.title,
          body: values.body,
          locale: values.locale,
          active: values.active,
        });
      }
      await createAnnouncement({
        title: values.title,
        body: values.body,
        locale: values.locale,
        active: values.active,
      });
    },
    {
      successMessage: '保存成功',
      errorMessage: '操作失败',
      onSuccess: () => {
        setModalOpen(false);
        mutate(ADMIN_SWR_KEYS.announcements);
      },
    }
  );

  const deleteMutation = useAdminMutation(
    (id: number) => deleteAnnouncement(id),
    {
      successMessage: '已删除',
      errorMessage: '删除失败',
      onSuccess: () => mutate(ADMIN_SWR_KEYS.announcements),
    }
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Announcement) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      body: record.body,
      locale: record.locale,
      active: !!record.active,
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await saveMutation.trigger({ editing, values });
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.trigger(id);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '语言', dataIndex: 'locale', key: 'locale', width: 70 },
    {
      title: '启用',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (v: number) => (v ? '是' : '否'),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Announcement) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="公告管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增公告
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={list ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
      <Modal
        title={editing ? '编辑公告' : '新增公告'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="公告标题" />
          </Form.Item>
          <Form.Item name="body" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <RichTextEditor />
          </Form.Item>
          <Form.Item name="locale" label="语言" initialValue="zh">
            <Select options={[{ label: '中文', value: 'zh' }, { label: '英文', value: 'en' }]} />
          </Form.Item>
          <Form.Item name="active" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
