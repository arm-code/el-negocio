/**
 * Con qué categoría entra un cobro: lo que se devuelve es una renta; lo demás, una
 * venta. Si el negocio no tiene esas, "Otros" o la primera que haya.
 */
export function paymentCategory<T extends { code: string }>(
  active: T[],
  needsReturn: boolean,
): T | undefined {
  const preferred = needsReturn
    ? ['RENTA', 'VENTAS', 'OTROS']
    : ['VENTAS', 'OTROS'];
  return (
    preferred
      .map((code) => active.find((category) => category.code === code))
      .find(Boolean) ?? active[0]
  );
}
