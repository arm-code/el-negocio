"use client"

import { useSearchParams } from "next/navigation"
import { EditNote } from "@el-negocio/tool-sales-notes"

export function EditFromQuery() {
  const id = useSearchParams().get("id") ?? ""
  return <EditNote noteId={id} />
}
