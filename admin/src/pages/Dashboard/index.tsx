import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { getDashboardRoutes, DEFAULT_DASHBOARD_PATH } from '@/config/dashboardRoutes';

export default function Dashboard() {
  const routes = getDashboardRoutes();

  return (
    <DashboardLayout>
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path.replace('/dashboard', '')} element={r.element} />
        ))}
        <Route path="/" element={<Navigate to={DEFAULT_DASHBOARD_PATH} replace />} />
        <Route path="*" element={<Navigate to={DEFAULT_DASHBOARD_PATH} replace />} />
      </Routes>
    </DashboardLayout>
  );
}
