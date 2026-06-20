import { create } from 'zustand';

import { ACCESS_ROLE_KEY, ACCESS_TOKEN_KEY, ACCESS_USERNAME_KEY } from '@/lib/authStorage';
import { decodeJwtPayload, isAccessTokenValid } from '@/lib/jwt';
import { isUserRole, type UserRole } from '@/lib/permissions';
import { fetchMeApi, loginApi } from '@/services/api';
import { db } from '@/services/db';
import { syncEnabledEncuestadorProfiles } from '@/services/encuestadorProfiles';

async function syncEncuestadorProfilesIfOnline(username: string | null): Promise<void> {
  if (!username?.trim() || !navigator.onLine) {
    return;
  }
  try {
    await syncEnabledEncuestadorProfiles(username.trim());
  } catch {
    // La caché previa sigue disponible offline.
  }
}

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  role: null,
  ready: false,

  hydrate: async () => {
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    let username = localStorage.getItem(ACCESS_USERNAME_KEY);
    let role = localStorage.getItem(ACCESS_ROLE_KEY);
    if (!token) {
      const row = await db.sesionLocal.get('current');
      if (row) {
        token = row.accessToken;
        username = row.username;
        role = row.role ?? null;
        localStorage.setItem(ACCESS_TOKEN_KEY, row.accessToken);
        localStorage.setItem(ACCESS_USERNAME_KEY, row.username);
        if (row.role) {
          localStorage.setItem(ACCESS_ROLE_KEY, row.role);
        }
      }
    }
    let normalizedRole: UserRole | null = isUserRole(role) ? role : null;
    if (isAccessTokenValid(token)) {
      const payloadRole = decodeJwtPayload(token ?? '')?.role;
      if (isUserRole(payloadRole)) {
        normalizedRole = payloadRole;
      } else if (!normalizedRole) {
        try {
          const me = await fetchMeApi();
          normalizedRole = me.role;
        } catch {
          normalizedRole = null;
        }
      }
    } else {
      normalizedRole = null;
    }
    if (normalizedRole) {
      localStorage.setItem(ACCESS_ROLE_KEY, normalizedRole);
    } else {
      localStorage.removeItem(ACCESS_ROLE_KEY);
    }
    set({ token, username, role: normalizedRole, ready: true });
    if (isAccessTokenValid(token) && username) {
      void syncEncuestadorProfilesIfOnline(username);
    }
  },

  login: async (username, password) => {
    const res = await loginApi(username, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
    localStorage.setItem(ACCESS_USERNAME_KEY, res.username);
    localStorage.setItem(ACCESS_ROLE_KEY, res.role);
    await db.sesionLocal.put({
      id: 'current',
      accessToken: res.access_token,
      username: res.username,
      role: res.role,
    });
    set({ token: res.access_token, username: res.username, role: res.role, ready: true });
    void syncEncuestadorProfilesIfOnline(res.username);
  },

  logout: async () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_USERNAME_KEY);
    localStorage.removeItem(ACCESS_ROLE_KEY);
    await db.sesionLocal.delete('current');
    set({ token: null, username: null, role: null, ready: true });
  },
}));
