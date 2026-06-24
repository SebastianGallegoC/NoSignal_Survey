import { type ReactNode, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useEncuestadorProfilesSync } from "@/hooks/useEncuestadorProfilesSync";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useSessionRoleSync } from "@/hooks/useSessionRoleSync";
import { isAccessTokenValid } from "@/lib/jwt";
import { type UserRole } from "@/lib/permissions";
import { useAuthStore } from "@/store/useAuthStore";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) => {
  const token = useAuthStore((s) => s.token);
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  const valid = useMemo(() => isAccessTokenValid(token), [token]);

  useOfflineSync(valid);
  useEncuestadorProfilesSync(valid, username);
  useSessionRoleSync(valid);

  if (!valid) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/inicio" replace state={{ forbidden: location.pathname }} />;
  }
  return children;
};
