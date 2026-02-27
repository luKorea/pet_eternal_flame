import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { Provider } from 'jotai';
import { ConfigProvider } from 'antd';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import './App.css';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#f0f0f0',
    borderRadius: 6,
  },
};

const swrConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 2000,
  errorRetryCount: 1,
};

export default function App() {
  return (
    <Provider>
      <SWRConfig value={swrConfig}>
        <ConfigProvider theme={theme}>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </ConfigProvider>
      </SWRConfig>
    </Provider>
  );
}
