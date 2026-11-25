"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        // Aquí los datos viven en el navegador. Con el valor por defecto ('online'),
        // react-query pausa lecturas y guardados cuando no hay red.
        defaultOptions: {
          queries: { networkMode: "always" },
          mutations: { networkMode: "always" },
        },
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}
