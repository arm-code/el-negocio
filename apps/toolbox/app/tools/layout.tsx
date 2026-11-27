// app/tools/layout.tsx
import { InstallInvite } from '@/components/install/install-invite'
import { ToolBar } from '@/components/tool-bar'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    // min-h-dvh: en móvil 100vh incluye la barra del navegador y provoca scroll de más.
    <div className="flex min-h-dvh flex-col">
      <ToolBar />
      <main className="flex-1">
        {/* El max() respeta la barra de gestos en la PWA instalada; el notch lo cubre la barra */}
        <div className="mx-auto max-w-4xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          {children}
        </div>
      </main>
      <InstallInvite />
    </div>
  )
}
