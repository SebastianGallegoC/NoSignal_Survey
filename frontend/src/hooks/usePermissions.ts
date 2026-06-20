import { canDeleteForms, canManageEncuestadorProfiles, canManageUsers } from "@/lib/permissions";
import { useAuthStore } from "@/store/useAuthStore";


export function usePermissions() {
  const role = useAuthStore((s) => s.role);

  return {
    role,
    canManageUsers: canManageUsers(role),
    canDeleteForms: canDeleteForms(role),
    canManageEncuestadorProfiles: canManageEncuestadorProfiles(role),
  };
}
