import { type ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useEncuestadorProfilesSync } from '@/hooks/useEncuestadorProfilesSync';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSessionRoleSync } from '@/hooks/useSessionRoleSync';
import { isAccessTokenValid } from '@/lib/jwt';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.username);
  const location = useLocation();

  const valid = useMemo(() => isAccessTokenValid(token), [token]);

  useOfflineSync(valid);
  useEncuestadorProfilesSync(valid, username);
  useSessionRoleSync(valid);

  if (!valid) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};
