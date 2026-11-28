import { DocumentsToolbox } from "../documents/documents-toolbox"
import { AgendaToolbox } from "./agenda-toolbox"

// La agenda enseña los documentos de cada cosa agendada
export default function AgendaLayout({ children }: { children: React.ReactNode }) {
    return (
        <DocumentsToolbox>
            <AgendaToolbox>{children}</AgendaToolbox>
        </DocumentsToolbox>
    )
}
