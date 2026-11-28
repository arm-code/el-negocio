import { isDocumentValues } from './document-values.validator';

describe('isDocumentValues', () => {
  it('acepta datos conocidos como texto', () => {
    expect(isDocumentValues({ clientName: 'Ana', amount: '100' })).toBe(true);
    expect(isDocumentValues({})).toBe(true);
  });

  it('rechaza claves desconocidas, otros tipos y textos enormes', () => {
    expect(isDocumentValues({ otro: 'x' })).toBe(false);
    expect(isDocumentValues(JSON.parse('{"__proto__":"x"}'))).toBe(false);
    expect(isDocumentValues({ amount: 100 })).toBe(false);
    expect(isDocumentValues({ clientName: { a: 1 } })).toBe(false);
    expect(isDocumentValues({ clientName: 'a'.repeat(2001) })).toBe(false);
    expect(isDocumentValues(['a'])).toBe(false);
    expect(isDocumentValues('texto')).toBe(false);
    expect(isDocumentValues(null)).toBe(false);
  });
});
