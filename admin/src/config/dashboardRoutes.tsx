import type { ReactNode } from 'react';
import {
  TranslationOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import LanguageManager from '@/pages/LanguageManager';
import UserManagement from '@/pages/UserManagement';
import StatsPage from '@/pages/StatsPage';
import SiteSettingsPage from '@/pages/SiteSettingsPage';
import AnnouncementManager from '@/pages/AnnouncementManager';

export interface DashboardRouteConfig {
  path: string;
  label: string;
  icon: ReactNode;
  element: ReactNode;
}

const ROUTES: DashboardRouteConfig[] = [
  {
    path: '/dashboard/languages',
    label: '多语言管理',
    icon: <TranslationOutlined />,
    element: <LanguageManager />,
  },
  {
    path: '/dashboard/users',
    label: '用户管理',
    icon: <UserOutlined />,
    element: <UserManagement />,
  },
  {
    path: '/dashboard/stats',
    label: '统计与记录',
    icon: <BarChartOutlined />,
    element: <StatsPage />,
  },
  {
    path: '/dashboard/settings',
    label: '站点设置',
    icon: <SettingOutlined />,
    element: <SiteSettingsPage />,
  },
  {
    path: '/dashboard/announcements',
    label: '公告管理',
    icon: <NotificationOutlined />,
    element: <AnnouncementManager />,
  },
];

export const DEFAULT_DASHBOARD_PATH = '/dashboard/languages';

export function getDashboardRoutes() {
  return ROUTES;
}

export function getDashboardMenuItems(
  navigate: (path: string) => void,
  onItemClick?: () => void
): MenuProps['items'] {
  return ROUTES.map((r) => ({
    key: r.path,
    icon: r.icon,
    label: r.label,
    onClick: () => {
      navigate(r.path);
      onItemClick?.();
    },
  }));
}
