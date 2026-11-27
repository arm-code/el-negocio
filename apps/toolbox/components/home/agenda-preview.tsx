// Ejemplo visual (decorativo) de la agenda: qué hay hoy y mañana, de un vistazo.
// Solo es contenido de muestra.

const DAYS = [
    {
        label: "Hoy",
        items: [
            { time: "11:00 a.m.", title: "Entregar pastel", who: "Doña Mary" },
            { time: "4:30 p.m.", title: "Instalar chapa", who: "Calle Roble 214" },
        ],
    },
    {
        label: "Mañana",
        items: [{ time: "9:00 a.m.", title: "Surtir pedido de la escuela", who: "20 paquetes" }],
    },
]

export function AgendaPreview() {
    return (
        <div
            aria-hidden="true"
            className="receipt-shadow rotate-[1.5deg] select-none space-y-3 rounded-2xl border bg-card px-5 pb-5 pt-4 text-card-foreground"
        >
            {DAYS.map((day) => (
                <div key={day.label} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">{day.label}</p>
                    <ul className="space-y-2">
                        {day.items.map((item) => (
                            <li key={item.title} className="border-l-2 border-primary pl-3 text-sm">
                                <p className="text-xs font-semibold text-primary">{item.time}</p>
                                <p className="truncate font-medium">{item.title}</p>
                                <p className="truncate text-xs text-muted-foreground">{item.who}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )
}
