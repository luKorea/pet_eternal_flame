// Admin types
export interface AdminUser {
  id: string;
  username: string;
  role?: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface LanguageString {
  id: number;
  key: string;
  zh: string;
  en: string;
  category: string;
  updated_at: string;
}

export interface Theme {
  id: number;
  name: string;
  colors: Record<string, string>;
  created_at: string;
}

export interface MathRule {
  id: number;
  name: string;
  formula: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  locale: string;
  active: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  status: number;
  user_id?: number;
  timestamp: string;
}

export interface UserListItem {
  id: number;
  username: string;
  created_at: string;
}

export interface StatsResult {
  total_users: number;
  today_calculates: number;
  total_calculates: number;
}

export interface CalculateLogItem {
  id: number;
  user_id: number | null;
  pet_name: string | null;
  death_date: string;
  locale: string;
  created_at: string;
}

export interface SettingItem {
  value: string;
  updated_at: string;
}
