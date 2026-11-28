import { SetMetadata } from '@nestjs/common';
import { BusinessRole } from '../businesses/enums/business-role.enum';

export const ADMIN_ONLY_KEY = 'adminOnly';
export const ADMIN_WRITES_KEY = 'adminWrites';

/** Solo administradores: ver y cambiar. */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

/** Cualquiera del equipo consulta; solo administradores cambian. */
export const AdminWrites = () => SetMetadata(ADMIN_WRITES_KEY, true);

/**
 * Qué puede hacer cada tipo de persona. `editor` es el empleado; `viewer` solo
 * consulta.
 */
export function isAllowed(
  role: BusinessRole,
  method: string,
  rules: { adminOnly?: boolean; adminWrites?: boolean },
): boolean {
  if (role === BusinessRole.ADMIN) return true;
  const reading = method === 'GET' || method === 'HEAD';
  if (rules.adminOnly) return false;
  if (rules.adminWrites && !reading) return false;
  return role === BusinessRole.EDITOR || reading;
}
