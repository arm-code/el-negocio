// Ejemplo visual (decorativo) de la caja del día: se entiende de un vistazo que es
// para anotar lo que entra y lo que sale. Solo es contenido de muestra.

const ROWS = [
    { label: "Venta de la mañana", amount: "+$1,500", in: true },
    { label: "Refrescos", amount: "−$450", in: false },
    { label: "Recibo de luz", amount: "−$300", in: false },
]

export function CashPreview() {
    return (
        <div
            aria-hidden="true"
            className="receipt-shadow -rotate-[1.5deg] select-none rounded-2xl border bg-card text-card-foreground"
        >
            <div className="px-5 pb-3 pt-4">
                <p className="text-xs text-muted-foreground">Te queda este mes</p>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">$750</p>
            </div>
            <div className="grid grid-cols-2 border-y text-sm">
                <p className="flex items-center gap-2 px-5 py-2">
                    <span className="size-2 rounded-full bg-success" />
                    <span className="font-medium tabular-nums">$1,500</span>
                </p>
                <p className="flex items-center gap-2 border-l px-5 py-2">
                    <span className="size-2 rounded-full bg-destructive" />
                    <span className="font-medium tabular-nums">$750</span>
                </p>
            </div>
            <ul className="space-y-2 px-5 pb-5 pt-3 text-sm">
                {ROWS.map((row) => (
                    <li key={row.label} className="flex justify-between gap-3">
                        <span className="truncate">{row.label}</span>
                        <span className={row.in ? "font-semibold text-success tabular-nums" : "tabular-nums"}>
                            {row.amount}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
