import { Suspense } from "react"
import { EditFromQuery } from "./edit-from-query"

export default function EditNotePage() {
  // Suspense: lo exige useSearchParams en una página estática
  return (
    <Suspense>
      <EditFromQuery />
    </Suspense>
  )
}
