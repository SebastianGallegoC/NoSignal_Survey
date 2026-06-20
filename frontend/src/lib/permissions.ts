export type UserRole = "admin" | "editor" | "encuestador";

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "editor" || value === "encuestador";
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function canDeleteForms(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canManageEncuestadorProfiles(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canAccessRoute(
  role: UserRole | null | undefined,
  route: string,
): boolean {
  if (!role) {
    return false;
  }
  if (route === "/usuarios") {
    return canManageUsers(role);
  }
  return (
    route === "/inicio" ||
    route === "/formulario" ||
    route === "/formularios-diligenciados" ||
    route === "/perfil-encuestador" ||
    route === "/datos"
  );
}
