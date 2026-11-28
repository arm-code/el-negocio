export const MIN_PASSWORD_LENGTH = 10;
/** bcrypt ignora lo que pase de 72 bytes. */
export const MAX_PASSWORD_LENGTH = 72;

/** Cuánto sirve un enlace para crear contraseña. */
export const ACCESS_LINK_TTL_MS = 72 * 60 * 60 * 1000;

/** 32 bytes en base64url. */
export const ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
