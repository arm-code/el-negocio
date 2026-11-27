import { AgendaToolbox } from "./agenda-toolbox"

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return <AgendaToolbox>{children}</AgendaToolbox>
}
