// El documento como se verá impreso. Siempre en claro: es una hoja.

import { Fragment } from 'react'
import { cn } from '@el-negocio/ui/utils'
import type { Block } from '../lib/blocks'

const ALIGN = { left: '', right: 'text-right', justify: 'text-justify hyphens-auto' }

function Piece({ block }: { block: Block }) {
  switch (block.type) {
    case 'title':
      return <h2 className="text-center text-sm font-bold">{block.text}</h2>
    case 'heading':
      return <h3 className="pt-1 font-bold">{block.text}</h3>
    case 'meta':
      return (
        <p className="flex flex-wrap justify-between gap-x-3 font-bold">
          <span>{block.left}</span>
          <span>{block.right}</span>
        </p>
      )
    case 'text':
      return (
        <p className={cn('whitespace-pre-line', ALIGN[block.align ?? 'left'], block.small && 'text-[10px] leading-snug')}>
          {block.text}
        </p>
      )
    case 'fields':
      return (
        <div className="space-y-0.5">
          {block.rows.map((row) => (
            <p key={row.label} className="break-words">
              <strong>{row.label}:</strong> {row.value}
            </p>
          ))}
        </div>
      )
    case 'table':
      return (
        <table className="w-full table-fixed border-collapse text-[9px] leading-tight">
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th
                  key={column.label}
                  style={{ width: `${column.width * 100}%` }}
                  className={cn('border border-neutral-500 p-1 align-top', column.right ? 'text-right' : 'text-left')}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((cells, index) => (
              <tr key={index}>
                {block.columns.map((column, i) => (
                  <td
                    key={column.label}
                    className={cn('border border-neutral-500 p-1 align-top break-words', column.right && 'text-right')}
                  >
                    {cells[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {block.total && (
            <tfoot>
              <tr>
                <td colSpan={block.columns.length} className="border border-neutral-500 p-1 text-right font-bold">
                  {block.total.label}: {block.total.value}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      )
    case 'signatures':
      return (
        <div className={cn('grid gap-4 pt-8 text-center', block.people.length > 1 && 'grid-cols-2')}>
          {block.people.map((person) => (
            <div key={person.role} className="mx-auto w-full max-w-52 border-t border-neutral-800 pt-1">
              <p className="font-bold">{person.role}</p>
              <p className="break-words">{person.name}</p>
            </div>
          ))}
        </div>
      )
    case 'group':
      return (
        <div className="space-y-2.5">
          {block.blocks.map((inner, index) => (
            <Piece key={index} block={inner} />
          ))}
        </div>
      )
    case 'pageBreak':
      return <hr aria-label="Hoja nueva" className="!my-6 border-t-2 border-dashed border-neutral-300" />
  }
}

export function Paper({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-2.5 rounded-lg border bg-white p-4 text-[11px] leading-relaxed text-neutral-900">
      {blocks.map((block, index) => (
        <Fragment key={index}>
          <Piece block={block} />
        </Fragment>
      ))}
    </div>
  )
}
