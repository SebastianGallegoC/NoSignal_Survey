import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants/appBrand";
import { type UserRole } from "@/lib/permissions";
import {
  createUserApi,
  listUsersApi,
  type UserRead,
  updateUserApi,
} from "@/services/usersApi";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Edición",
  encuestador: "Encuestador",
};

const CREATE_ROLE_OPTIONS: Array<{ value: Exclude<UserRole, "admin">; label: string }> = [
  { value: "editor", label: ROLE_LABELS.editor },
  { value: "encuestador", label: ROLE_LABELS.encuestador },
];

type DraftState = {
  username: string;
  password: string;
  role: Exclude<UserRole, "admin">;
};

const EMPTY_DRAFT: DraftState = {
  username: "",
  password: "",
  role: "encuestador",
};

function mapUserError(message: string): string {
  switch (message) {
    case "admin_role_creation_forbidden":
      return "No se pueden crear usuarios con rol administrador.";
    case "admin_user_immutable":
      return "Los usuarios administrador no se pueden modificar.";
    case "username_already_exists":
      return "Ese nombre de usuario ya existe.";
    default:
      return message;
  }
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const PasswordField = ({ id, label, value, onChange, placeholder }: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={id}>
      {label}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-16 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
    </label>
  );
};

export const UsuariosPage = () => {
  const [users, setUsers] = useState<UserRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [rowPasswords, setRowPasswords] = useState<Record<number, string>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsersApi());
    } catch (e) {
      setError(
        mapUserError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async () => {
    setError(null);
    const username = draft.username.trim();
    if (!username) {
      setError("Ingresá un nombre de usuario.");
      return;
    }
    if (draft.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await createUserApi({
        username,
        password: draft.password,
        role: draft.role,
      });
      setDraft(EMPTY_DRAFT);
      await loadUsers();
    } catch (e) {
      setError(
        mapUserError(e instanceof Error ? e.message : "No se pudo crear el usuario."),
      );
    } finally {
      setSaving(false);
    }
  }, [draft, loadUsers]);

  const updateUser = useCallback(
    async (user: UserRead, updates: { role?: UserRole; is_active?: boolean; password?: string }) => {
      setError(null);
      setSaving(true);
      try {
        await updateUserApi(user.id, updates);
        setRowPasswords((current) => ({ ...current, [user.id]: "" }));
        await loadUsers();
      } catch (e) {
        setError(
          mapUserError(e instanceof Error ? e.message : "No se pudo actualizar el usuario."),
        );
      } finally {
        setSaving(false);
      }
    },
    [loadUsers],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2f2ee_0,_#f6f7f5_45%,_#f6f7f5_100%)] px-3 py-4 text-slate-900 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-4 sm:mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/inicio">Regresar</Link>
            </Button>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-700 sm:text-xs sm:tracking-[0.35em]">
            {APP_NAME}
          </p>
          <h1 className="mt-1 text-xl font-semibold leading-tight text-slate-900 sm:mt-2 sm:text-3xl sm:leading-normal">
            Usuarios
          </h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm sm:leading-normal">
            Creá usuarios y administrá sus roles y acceso al sistema.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Crear usuario</h2>
            <label className="flex flex-col gap-1 text-sm">
              Usuario
              <input
                value={draft.username}
                onChange={(e) => setDraft((current) => ({ ...current, username: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Rol
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    role: e.target.value as Exclude<UserRole, "admin">,
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {CREATE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <PasswordField
              id="create-user-password"
              label="Contraseña"
              value={draft.password}
              onChange={(password) => setDraft((current) => ({ ...current, password }))}
            />
            <Button type="button" disabled={saving} onClick={() => void createUser()}>
              {saving ? "Guardando…" : "Crear usuario"}
            </Button>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Usuarios registrados</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadUsers()}>
                Recargar
              </Button>
            </div>
            {loading ? (
              <p className="text-sm text-slate-600">Cargando usuarios…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-slate-600">No hay usuarios creados.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const isAdmin = user.role === "admin";

                  return (
                    <div
                      key={user.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{user.username}</p>
                          <p className="text-xs text-slate-600">
                            Estado: {user.is_active ? "Activo" : "Inactivo"}
                          </p>
                          {isAdmin ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Cuenta administrador protegida: no editable.
                            </p>
                          ) : null}
                        </div>
                        {isAdmin ? (
                          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
                            {ROLE_LABELS.admin}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              void updateUser(user, { role: e.target.value as UserRole })
                            }
                            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                            disabled={saving}
                          >
                            {CREATE_ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {!isAdmin ? (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={saving}
                              onClick={() =>
                                void updateUser(user, { is_active: !user.is_active })
                              }
                            >
                              {user.is_active ? "Desactivar" : "Activar"}
                            </Button>
                          </div>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1">
                              <PasswordField
                                id={`reset-password-${user.id}`}
                                label="Nueva contraseña"
                                placeholder="Nueva contraseña"
                                value={rowPasswords[user.id] ?? ""}
                                onChange={(password) =>
                                  setRowPasswords((current) => ({
                                    ...current,
                                    [user.id]: password,
                                  }))
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={saving || (rowPasswords[user.id] ?? "").length < 8}
                              onClick={() =>
                                void updateUser(user, { password: rowPasswords[user.id] ?? "" })
                              }
                            >
                              Restablecer contraseña
                            </Button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
