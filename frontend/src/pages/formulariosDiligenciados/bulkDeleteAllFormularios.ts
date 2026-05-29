/** Contraseña fija en el modal de borrado masivo (no es la contraseña de inicio de sesión). */
export const BULK_DELETE_ALL_PASSWORD = "123456789";

export function isBulkDeleteAllPasswordValid(password: string): boolean {
  return password.trim() === BULK_DELETE_ALL_PASSWORD;
}
