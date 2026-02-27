import adminApiClient from './client';
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  UserListItem,
  StatsResult,
  CalculateLogItem,
  Announcement,
} from '@/types/admin';

export const login = async (
  credentials: AdminLoginRequest
): Promise<AdminLoginResponse> => {
  const response = await adminApiClient.post('/api/admin/login', credentials);
  return response.data;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};

export const fetchUsers = async (params: { page?: number; per_page?: number; search?: string }) => {
  const { data } = await adminApiClient.get<{ items: UserListItem[]; total: number }>(
    '/api/admin/users',
    { params }
  );
  return data;
};

export const fetchStats = async () => {
  const { data } = await adminApiClient.get<StatsResult>('/api/admin/stats');
  return data;
};

export const fetchCalculateLogs = async (params: { page?: number; per_page?: number }) => {
  const { data } = await adminApiClient.get<{ items: CalculateLogItem[]; total: number }>(
    '/api/admin/calculate-logs',
    { params }
  );
  return data;
};

export const fetchSettings = async () => {
  const { data } = await adminApiClient.get<Record<string, { value: string; updated_at: string }>>(
    '/api/admin/settings'
  );
  return data;
};

export const upsertSetting = async (key: string, value: string) => {
  await adminApiClient.post('/api/admin/settings', { key, value });
};

export const fetchAnnouncements = async () => {
  const { data } = await adminApiClient.get<Announcement[]>('/api/admin/announcements');
  return data;
};

export const createAnnouncement = async (body: {
  title: string;
  body: string;
  locale?: string;
  active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}) => {
  const { data } = await adminApiClient.post<{ id: number }>('/api/admin/announcements', body);
  return data;
};

export const updateAnnouncement = async (
  id: number,
  body: Partial<{ title: string; body: string; locale: string; active: boolean; start_at: string | null; end_at: string | null }>
) => {
  await adminApiClient.put(`/api/admin/announcements/${id}`, body);
};

export const deleteAnnouncement = async (id: number) => {
  await adminApiClient.delete(`/api/admin/announcements/${id}`);
};
