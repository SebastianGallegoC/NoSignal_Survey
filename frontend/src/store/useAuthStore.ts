import { create } from 'zustand';

import { ACCESS_TOKEN_KEY, ACCESS_USERNAME_KEY } from '@/lib/authStorage';
import { isAccessTokenValid } from '@/lib/jwt';
import { loginApi } from '@/services/api';
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
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  ready: false,

  hydrate: async () => {
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    let username = localStorage.getItem(ACCESS_USERNAME_KEY);
    if (!token) {
      const row = await db.sesionLocal.get('current');
      if (row) {
        token = row.accessToken;
        username = row.username;
        localStorage.setItem(ACCESS_TOKEN_KEY, row.accessToken);
        localStorage.setItem(ACCESS_USERNAME_KEY, row.username);
      }
    }
    set({ token, username, ready: true });
    if (isAccessTokenValid(token) && username) {
      void syncEncuestadorProfilesIfOnline(username);
    }
  },

  login: async (username, password) => {
    const res = await loginApi(username, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
    localStorage.setItem(ACCESS_USERNAME_KEY, username);
    await db.sesionLocal.put({
      id: 'current',
      accessToken: res.access_token,
      username,
    });
    set({ token: res.access_token, username, ready: true });
    void syncEncuestadorProfilesIfOnline(username);
  },

  logout: async () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_USERNAME_KEY);
    await db.sesionLocal.delete('current');
    set({ token: null, username: null, ready: true });
  },
}));
