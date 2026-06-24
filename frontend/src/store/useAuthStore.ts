import { create } from 'zustand';

import { ACCESS_ROLE_KEY, ACCESS_TOKEN_KEY, ACCESS_USERNAME_KEY } from '@/lib/authStorage';
import { decodeJwtPayload, isAccessTokenValid } from '@/lib/jwt';
import { isUserRole, type UserRole } from '@/lib/permissions';
import { fetchMeApi, loginApi, type LoginResponse } from '@/services/api';
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

async function resolveRoleFromToken(
  token: string | null,
  storedRole: string | null,
): Promise<UserRole | null> {
  if (!isAccessTokenValid(token)) {
    return null;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const me = await fetchMeApi();
      return me.role;
    } catch {
      // Si falla /auth/me, usar claims locales como respaldo offline-first.
    }
  }

  const payloadRole = decodeJwtPayload(token ?? '')?.role;
  if (isUserRole(payloadRole)) {
    return payloadRole;
  }
  if (isUserRole(storedRole)) {
    return storedRole;
  }
  return null;
}

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  applyLoginResponse: (response: LoginResponse) => Promise<void>;
  refreshSessionFromServer: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

    const normalizedRole = await resolveRoleFromToken(token, role);
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

  applyLoginResponse: async (response) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(ACCESS_USERNAME_KEY, response.username);
    localStorage.setItem(ACCESS_ROLE_KEY, response.role);
    await db.sesionLocal.put({
      id: 'current',
      accessToken: response.access_token,
      username: response.username,
      role: response.role,
    });
    set({
      token: response.access_token,
      username: response.username,
      role: response.role,
      ready: true,
    });
  },

  login: async (username, password) => {
    const res = await loginApi(username, password);
    await get().applyLoginResponse(res);
    void syncEncuestadorProfilesIfOnline(res.username);
  },

  refreshSessionFromServer: async () => {
    const token = get().token ?? localStorage.getItem(ACCESS_TOKEN_KEY);
    const username = get().username ?? localStorage.getItem(ACCESS_USERNAME_KEY);
    if (!token || !isAccessTokenValid(token) || !username || !navigator.onLine) {
      return false;
    }
    try {
      const me = await fetchMeApi();
      localStorage.setItem(ACCESS_ROLE_KEY, me.role);
      localStorage.setItem(ACCESS_USERNAME_KEY, me.username);
      await db.sesionLocal.put({
        id: 'current',
        accessToken: token,
        username: me.username,
        role: me.role,
      });
      set({ role: me.role, username: me.username, token });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_USERNAME_KEY);
    localStorage.removeItem(ACCESS_ROLE_KEY);
    await db.sesionLocal.delete('current');
    set({ token: null, username: null, role: null, ready: true });
  },
}));
