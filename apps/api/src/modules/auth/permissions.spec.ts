import { BusinessRole } from '../businesses/enums/business-role.enum';
import { isAllowed } from './permissions';

const { ADMIN, EDITOR, VIEWER } = BusinessRole;

describe('isAllowed', () => {
  it('el administrador puede todo', () => {
    expect(isAllowed(ADMIN, 'DELETE', { adminOnly: true })).toBe(true);
    expect(isAllowed(ADMIN, 'PATCH', { adminWrites: true })).toBe(true);
  });

  it('el empleado no entra a lo exclusivo del administrador', () => {
    expect(isAllowed(EDITOR, 'GET', { adminOnly: true })).toBe(false);
  });

  it('el empleado consulta pero no cambia los catálogos y ajustes', () => {
    expect(isAllowed(EDITOR, 'GET', { adminWrites: true })).toBe(true);
    expect(isAllowed(EDITOR, 'POST', { adminWrites: true })).toBe(false);
    expect(isAllowed(EDITOR, 'DELETE', { adminWrites: true })).toBe(false);
  });

  it('el empleado trabaja en lo demás', () => {
    expect(isAllowed(EDITOR, 'POST', {})).toBe(true);
    expect(isAllowed(EDITOR, 'DELETE', {})).toBe(true);
  });

  it('quien solo consulta no cambia nada', () => {
    expect(isAllowed(VIEWER, 'GET', {})).toBe(true);
    expect(isAllowed(VIEWER, 'POST', {})).toBe(false);
  });
});
