import {
  listEnabledEncuestadorProfilesApi,
  type EncuestadorProfileLite,
} from "@/services/api";
import { db, type EncuestadorProfileCacheRow } from "@/services/db";

function nowIso(): string {
  return new Date().toISOString();
}

export async function syncEnabledEncuestadorProfiles(username: string): Promise<EncuestadorProfileLite[]> {
  const apiItems = await listEnabledEncuestadorProfilesApi();
  const updatedAt = nowIso();
  await db.transaction("rw", db.encuestadorProfilesCache, async () => {
    await db.encuestadorProfilesCache.where("username").equals(username).delete();
    if (apiItems.length === 0) {
      return;
    }
    const rows: EncuestadorProfileCacheRow[] = apiItems.map((item) => ({
      id: item.id,
      username,
      nombre: item.nombre,
      habilitado: true,
      updated_at: updatedAt,
    }));
    await db.encuestadorProfilesCache.bulkPut(rows);
  });
  return apiItems;
}

export async function listEnabledEncuestadorProfilesLocal(
  username: string,
): Promise<EncuestadorProfileLite[]> {
  const rows = await db.encuestadorProfilesCache.where("username").equals(username).toArray();
  return rows
    .filter((r) => r.habilitado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((r) => ({ id: r.id, nombre: r.nombre }));
}
