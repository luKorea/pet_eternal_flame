import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { AdminUser } from '@/types/admin';

const storageUser = {
  getItem: (key: string): AdminUser | null => {
    try {
      const s = localStorage.getItem(key);
      if (!s || s === 'undefined' || s === 'null') return null;
      return JSON.parse(s) as AdminUser;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
  setItem: (key: string, value: AdminUser | null) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};

const storageToken = {
  getItem: (key: string): string | null => {
    const t = localStorage.getItem(key);
    if (!t || t === 'undefined' || t === 'null') return null;
    return t;
  },
  setItem: (key: string, value: string | null) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};

export const adminUserAtom = atomWithStorage<AdminUser | null>(
  'admin_user',
  null,
  storageUser,
  { getOnInit: true }
);

export const adminTokenAtom = atomWithStorage<string | null>(
  'admin_token',
  null,
  storageToken,
  { getOnInit: true }
);

export const isAdminAuthenticatedAtom = atom((get) => {
  const user = get(adminUserAtom);
  const token = get(adminTokenAtom);
  return !!user && !!token;
});
