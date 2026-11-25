"use client"

import { useSearchParams } from "next/navigation"
import { EditNote } from "@/features/sales-notes"

export function EditFromQuery() {
  const id = useSearchParams().get("id") ?? ""
  return <EditNote noteId={id} />
}
