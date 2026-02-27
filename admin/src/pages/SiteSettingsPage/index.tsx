import { useEffect } from 'react';
import { Card, Form, Input, Button } from 'antd';
import useAdminSWR, { mutate, ADMIN_SWR_KEYS, useAdminMutation } from '@/hooks';
import { fetchSettings, upsertSetting } from '@/api';

export default function SiteSettingsPage() {
  const [form] = Form.useForm();

  const { data, isLoading } = useAdminSWR(
    ADMIN_SWR_KEYS.settings,
    () => fetchSettings(),
    { errorMessage: '加载设置失败' }
  );

  const saveMutation = useAdminMutation(
    (values: Record<string, string>) => {
      const ps = Object.entries(values)
        .filter(([k, v]) => k && k !== '_new_key' && k !== '_new_value' && v !== undefined)
        .map(([key, value]) => upsertSetting(key, String(value)));
      return Promise.all(ps) as Promise<unknown>;
    },
    {
      successMessage: '保存成功',
      errorMessage: '保存失败',
      onSuccess: () => mutate(ADMIN_SWR_KEYS.settings),
    }
  );

  useEffect(() => {
    if (!data) return;
    const fields: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      fields[k] = typeof v === 'object' && v && 'value' in v ? (v as { value: string }).value : String(v);
    });
    form.setFieldsValue(fields);
  }, [data, form]);

  const onFinish = (values: Record<string, string>) => {
    saveMutation.trigger(values);
  };

  const handleAdd = () => {
    const key = form.getFieldValue('_new_key');
    const value = form.getFieldValue('_new_value');
    if (!key?.trim()) {
      message.warning('请输入 key');
      return;
    }
    form.setFieldsValue({ [key.trim()]: value ?? '' });
    form.setFieldsValue({ _new_key: '', _new_value: '' });
  };

  return (
    <Card title="站点设置" loading={isLoading}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="默认语言（如 default_locale）" name="default_locale">
          <Input placeholder="zh" />
        </Form.Item>
        <Form.Item label="JWT 过期时间说明（展示用）" name="jwt_expire_note">
          <Input placeholder="如：7 天" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.loading}>
            保存
          </Button>
        </Form.Item>
      </Form>
      <Card type="inner" title="新增一项设置" size="small" style={{ marginTop: 16 }}>
        <Form layout="inline" form={form}>
          <Form.Item name="_new_key">
            <Input placeholder="key" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="_new_value">
            <Input placeholder="value" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button onClick={handleAdd}>添加到表单</Button>
          </Form.Item>
        </Form>
      </Card>
    </Card>
  );
}
