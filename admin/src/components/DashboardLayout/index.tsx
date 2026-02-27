import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, message, Drawer } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useSetAtom, useAtomValue } from 'jotai';
import { adminUserAtom, adminTokenAtom } from '@/store/atoms';
import { logout } from '@/api';
import { getDashboardMenuItems } from '@/config/dashboardRoutes';
import './index.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const SIDER_WIDTH = 200;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const adminUser = useAtomValue(adminUserAtom);
  const setAdminUser = useSetAtom(adminUserAtom);
  const setAdminToken = useSetAtom(adminTokenAtom);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setAdminUser(null);
      setAdminToken(null);
      message.success('已退出登录');
      navigate('/login');
    } catch {
      message.error('退出登录失败');
    }
  };

  const menuItems = getDashboardMenuItems(navigate, () => setDrawerOpen(false));

  const userMenuItems = [
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  const menuContent = (
    <>
      <div className="dashboard-sider-title">
        {collapsed ? '运营' : '运营后台'}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        className="dashboard-sider-menu"
      />
      <div className="dashboard-sider-footer">
        <button
          type="button"
          className="dashboard-sider-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开' : '收起'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          {!collapsed && <span>收起</span>}
        </button>
      </div>
    </>
  );

  return (
    <Layout className={`dashboard-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <Layout.Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={SIDER_WIDTH}
        collapsedWidth={64}
        className="dashboard-sider"
      >
        {menuContent}
      </Layout.Sider>

      <Drawer
        title="菜单"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={SIDER_WIDTH}
        className="dashboard-drawer"
        bodyStyle={{ padding: 0 }}
        styles={{ body: { padding: 0 } }}
      >
        <div className="dashboard-drawer-body">
          <div className="dashboard-sider-title">运营后台</div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="dashboard-sider-menu"
          />
        </div>
      </Drawer>

      <Layout className="dashboard-body">
        <Layout.Header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              type="button"
              className="dashboard-header-trigger"
              onClick={() => setDrawerOpen(true)}
              aria-label="菜单"
            >
              <MenuOutlined />
            </button>
            <span className="dashboard-header-title">运营后台</span>
          </div>
          {adminUser && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button type="button" className="dashboard-header-user">
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                  {adminUser.username.charAt(0).toUpperCase()}
                </Avatar>
                <span className="dashboard-header-name">{adminUser.username}</span>
              </button>
            </Dropdown>
          )}
        </Layout.Header>
        <Layout.Content className="dashboard-content">
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
