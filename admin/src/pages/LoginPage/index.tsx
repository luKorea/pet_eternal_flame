import { useState } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useSetAtom } from 'jotai';
import { adminUserAtom, adminTokenAtom } from '@/store/atoms';
import { login } from '@/api';
import './index.css';

export default function LoginPage() {
  const setAdminUser = useSetAtom(adminUserAtom);
  const setAdminToken = useSetAtom(adminTokenAtom);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login(values);
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_user', JSON.stringify(response.user));
      setAdminToken(response.token);
      setAdminUser(response.user);
      message.success('登录成功');
      // 使用整页跳转，避免部署在子路径 /admin 时 React 路由与 Jotai 状态不同步导致仍被重定向回登录页
      const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
      const to = base ? `${base}/dashboard` : '/dashboard';
      window.location.href = to;
    } catch (error: any) {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? '登录失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Spin spinning={loading} fullscreen />

      <div className="login-shell">
        <header className="login-topbar">
          <div className="login-logo">
            <span className="login-logo-badge">永恒之焰</span>
            <span className="login-logo-subtitle">创作服务平台 · 运营后台</span>
          </div>
        </header>

        <main className="login-main">
          <section className="login-hero">
            <div className="login-hero-text">
              <h1>
                加入我们
                <br />
                解锁运营专属能力
              </h1>
              <p>让内容配置、数据洞察、活动运营更高效。</p>
            </div>
            <div className="login-hero-visual">
              <div className="hero-circle hero-circle-lg" />
              <div className="hero-circle hero-circle-md" />
              <div className="hero-circle hero-circle-sm" />
              <div className="hero-circle hero-circle-xs" />
            </div>
          </section>

          <section className="login-panel">
            <Card className="login-card" bordered={false}>
              <div className="login-card-header">
                <h2>管理员登录</h2>
                <p>使用运营账号登录控制台</p>
              </div>

              <Form
                form={form}
                onFinish={handleLogin}
                layout="vertical"
                autoComplete="off"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>

              <div className="login-card-footer">
                <span className="login-tip">测试账号：admin / admin</span>
              </div>
            </Card>
          </section>
        </main>

        <footer className="login-footer">
          <p>© {new Date().getFullYear()} Pet Eternal Flame. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
