/**
 * Una sesión emitida antes del último cambio de contraseña ya no vale.
 * `issuedAt` viene en segundos (claim `iat`).
 */
export function isSessionStale(
  issuedAt: number | undefined,
  passwordChangedAt: Date | null,
): boolean {
  if (!passwordChangedAt) return false;
  if (issuedAt === undefined) return true;
  return issuedAt < Math.floor(passwordChangedAt.getTime() / 1000);
}
