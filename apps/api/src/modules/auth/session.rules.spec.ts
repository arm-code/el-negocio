import { isSessionStale } from './session.rules';

describe('isSessionStale', () => {
  const changed = new Date('2026-11-27T12:00:00.500Z');
  const second = Math.floor(changed.getTime() / 1000);

  it('acepta la sesión si nunca cambió la contraseña', () => {
    expect(isSessionStale(second, null)).toBe(false);
  });

  it('cierra las sesiones anteriores al cambio', () => {
    expect(isSessionStale(second - 1, changed)).toBe(true);
  });

  it('acepta la sesión abierta al guardar la contraseña', () => {
    expect(isSessionStale(second, changed)).toBe(false);
  });

  it('desconfía de una sesión sin fecha de emisión', () => {
    expect(isSessionStale(undefined, changed)).toBe(true);
  });
});
