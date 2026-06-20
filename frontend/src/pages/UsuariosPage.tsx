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

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Edición" },
  { value: "encuestador", label: "Encuestador" },
];

type DraftState = {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

const EMPTY_DRAFT: DraftState = {
  username: "",
  password: "",
  confirmPassword: "",
  role: "encuestador",
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
      setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios.");
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
    if (draft.password !== draft.confirmPassword) {
      setError("La confirmación de contraseña no coincide.");
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
      setError(e instanceof Error ? e.message : "No se pudo crear el usuario.");
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
        setError(e instanceof Error ? e.message : "No se pudo actualizar el usuario.");
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
                    role: e.target.value as UserRole,
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Contraseña
              <input
                type="password"
                value={draft.password}
                onChange={(e) => setDraft((current) => ({ ...current, password: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Confirmar contraseña
              <input
                type="password"
                value={draft.confirmPassword}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, confirmPassword: e.target.value }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
            </label>
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
                {users.map((user) => (
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
                      </div>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          void updateUser(user, { role: e.target.value as UserRole })
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        disabled={saving}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

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

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={rowPasswords[user.id] ?? ""}
                        onChange={(e) =>
                          setRowPasswords((current) => ({
                            ...current,
                            [user.id]: e.target.value,
                          }))
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                      />
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
