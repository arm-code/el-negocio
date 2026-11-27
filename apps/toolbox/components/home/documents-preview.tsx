// Ejemplo visual (decorativo) de un pagaré ya llenado. Solo es contenido de muestra.

export function DocumentsPreview() {
    return (
        <div
            aria-hidden="true"
            className="receipt-shadow -rotate-[1.5deg] select-none space-y-3 rounded-2xl border bg-card px-5 pb-6 pt-4 text-card-foreground"
        >
            <p className="text-center text-sm font-bold tracking-widest">PAGARÉ</p>
            <div className="flex justify-between text-xs font-semibold">
                <span>Folio 0007</span>
                <span className="tabular-nums">Bueno por: $2,500.00</span>
            </div>
            <p className="text-justify text-[11px] leading-relaxed text-muted-foreground">
                Debo y pagaré incondicionalmente por este pagaré a la orden de Mueblería Lupita la cantidad de
                $2,500.00 (dos mil quinientos pesos 00/100 moneda nacional).
            </p>
            <div className="space-y-1.5">
                <span className="block h-1.5 w-full rounded-full bg-muted" />
                <span className="block h-1.5 w-4/5 rounded-full bg-muted" />
            </div>
            <p className="mx-auto w-3/5 border-t border-foreground/60 pt-1 text-center text-[11px] font-medium">
                Firma
            </p>
        </div>
    )
}
