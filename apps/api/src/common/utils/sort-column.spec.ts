import { sortColumn } from './sort-column';

describe('sortColumn', () => {
  const allowed = ['createdAt', 'name'] as const;

  it('acepta un campo de la lista', () => {
    expect(sortColumn('name', allowed)).toBe('name');
  });

  it('usa el primero si no se pide ninguno', () => {
    expect(sortColumn(undefined, allowed)).toBe('createdAt');
    expect(sortColumn('', allowed)).toBe('createdAt');
  });

  it.each([
    'ownerId',
    'NAME',
    'name; DROP TABLE users',
    'createdAt, (SELECT 1)',
    'constructor',
    '__proto__',
  ])('descarta %s', (requested) => {
    expect(sortColumn(requested, allowed)).toBe('createdAt');
  });
});
