"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/lib/hooks/useMediaQuery"
import { EmptyState } from "./EmptyState"
import { SkeletonRows } from "./Skeleton"
import { useTablePrefs } from "./useTablePrefs"

export interface Column<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Return a comparable value to make the column sortable. Omit to disable. */
  sortValue?: (row: T) => string | number | null | undefined
  align?: "left" | "right"
  /** Tailwind width class, e.g. "w-40". */
  width?: string
  /** Off by default in the column picker. */
  defaultHidden?: boolean
  /** Keep out of the column picker (selection, row actions). */
  pinned?: boolean
  /**
   * Freeze against the right edge while the table scrolls sideways. Meant for
   * the actions column: on a narrow laptop the row buttons used to scroll out
   * of reach, so reaching them meant scrolling right on every single row.
   */
  stickyRight?: boolean
  /**
   * Mobile-only renderer. A 28px icon row that reads fine in a dense desktop
   * table is a mis-tap hazard on a phone — especially when one of the icons
   * dials a customer. Provide this to render the same column differently on
   * the card layout; falls back to `cell`.
   */
  cardCell?: (row: T) => React.ReactNode
  /**
   * Role on the mobile card, since a horizontally scrolling table on a phone is
   * unusable and staff work this CRM on phones.
   * title = card heading · trailing = top-right (usually status) ·
   * meta = label/value line · hide = dropped on mobile.
   */
  card?: "title" | "trailing" | "meta" | "hide"
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRowClick?: (row: T) => void
  /** Extra classes per row — used to flag overdue or untouched records. */
  getRowClassName?: (row: T) => string | undefined
  /** Presence of `onSelectionChange` turns on the selection column. */
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  initialSort?: { columnId: string; direction: "asc" | "desc" }
  stickyHeader?: boolean
  columnPicker?: boolean
  /**
   * Client-side paging. A telecaller's pipeline runs to hundreds of rows; a
   * single scroll of everything is both slow to render and impossible to keep
   * a place in. Off by default so existing short lists are untouched.
   */
  paginate?: boolean
  defaultPageSize?: number
  pageSizeOptions?: number[]
  /** Left-hand side of the utility row above the table (row counts, badges). */
  toolbarLeft?: React.ReactNode
  /**
   * Remember this table's column choices and page size under this key. Omit to
   * keep the table stateless between visits.
   */
  storageKey?: string
  className?: string
}

type SortState = { columnId: string; direction: "asc" | "desc" } | null

/** Narrow enough to hide a column, wide enough to still grab its handle. */
const MIN_COLUMN_WIDTH = 56

function compare(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === ""
  const bEmpty = b === null || b === undefined || b === ""
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1 // blanks always sink, in both directions
  if (bEmpty) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" })
}

/** `1 … 4 5 6 … 25` — never more than seven slots, however long the list gets. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const out: (number | "gap")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push("gap")
  for (let page = start; page <= end; page++) out.push(page)
  if (end < total - 1) out.push("gap")
  out.push(total)
  return out
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      onClick={e => e.stopPropagation()}
      className="admin-focus w-3.5 h-3.5 rounded-[4px] border border-admin-border-strong accent-[var(--admin-accent)] cursor-pointer"
    />
  )
}

export function DataTable<T,>({
  columns,
  rows,
  getRowId,
  loading = false,
  error = null,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  onRowClick,
  getRowClassName,
  selectedIds,
  onSelectionChange,
  initialSort = undefined,
  stickyHeader = true,
  columnPicker = true,
  paginate = false,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  toolbarLeft,
  storageKey,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(initialSort ?? null)
  const [localHidden, setLocalHidden] = useState<string[] | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [localPageSize, setLocalPageSize] = useState<number | null>(null)
  const [requestedPage, setRequestedPage] = useState(1)
  const pickerRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  /**
   * Three layers, most specific first: what the user changed this session, what
   * they chose on a previous visit, and the column defaults. Resolving it here
   * rather than seeding state avoids an effect that would flash the defaults
   * for one frame after hydration.
   */
  const { prefs, save } = useTablePrefs(storageKey)
  const hidden =
    localHidden ?? prefs?.hidden ?? columns.filter(c => c.defaultHidden).map(c => c.id)
  const pageSize = localPageSize ?? (prefs?.pageSize || defaultPageSize)

  const setHidden = (next: string[]) => {
    setLocalHidden(next)
    save({ hidden: next })
  }

  /**
   * Column widths, dragged from the header the way a spreadsheet does.
   *
   * Nothing is stored until the first drag; up to that point the table sizes
   * itself from its content. The first drag measures every column as it stands
   * and pins all of them, so from then on the table is `table-fixed` and moving
   * one edge moves exactly one edge — otherwise the browser would quietly
   * re-flow the neighbours and the drag would feel like it fought back.
   */
  const [localWidths, setLocalWidths] = useState<Record<string, number> | null>(null)
  const widths = localWidths ?? prefs?.widths ?? {}
  const sized = Object.keys(widths).length > 0
  /**
   * Latest widths during a drag. Seeded when the drag starts and updated on
   * every move, so the pointer handlers — which live outside React's render —
   * always save the values actually on screen.
   */
  const widthsRef = useRef<Record<string, number>>({})
  const dragRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  /** Every visible column's width as it renders right now. */
  const measureColumns = (): Record<string, number> => {
    const measured: Record<string, number> = {}
    tableRef.current?.querySelectorAll<HTMLTableCellElement>("thead th[data-col-id]").forEach(th => {
      const id = th.dataset.colId
      if (id) measured[id] = th.offsetWidth
    })
    return measured
  }

  const applyWidths = (next: Record<string, number>) => {
    widthsRef.current = next
    setLocalWidths(next)
  }

  const resizeBy = (columnId: string, delta: number) => {
    const base = sized ? widths : measureColumns()
    const current = base[columnId] ?? MIN_COLUMN_WIDTH
    const next = { ...base, [columnId]: Math.max(MIN_COLUMN_WIDTH, Math.round(current + delta)) }
    applyWidths(next)
    save({ widths: next })
  }

  const startResize = (event: React.PointerEvent<HTMLElement>, columnId: string) => {
    // The handle sits inside the header button's row; without this the press
    // would also toggle that column's sort.
    event.preventDefault()
    event.stopPropagation()
    const header = event.currentTarget.closest("th")
    if (!header) return
    applyWidths(sized ? widths : measureColumns())
    dragRef.current = {
      id: columnId,
      startX: event.clientX,
      startWidth: header.offsetWidth,
    }
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (event: PointerEvent) => {
      const state = dragRef.current
      if (!state) return
      applyWidths({
        ...widthsRef.current,
        [state.id]: Math.max(
          MIN_COLUMN_WIDTH,
          Math.round(state.startWidth + (event.clientX - state.startX))
        ),
      })
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
      save({ widths: widthsRef.current })
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [dragging, save])

  /** Double-click any handle: back to content-sized columns for the whole table. */
  const resetWidths = () => {
    applyWidths({})
    save({ widths: {} })
  }

  /**
   * Only one layout is mounted at a time. Rendering the table and the card list
   * together and hiding one with `lg:hidden` doubled the DOM for every row —
   * on a 200-lead pipeline that is 200 rows of markup the user can never see.
   */
  const isDesktop = useIsDesktop()

  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [pickerOpen])

  const visibleColumns = useMemo(
    () => columns.filter(c => !hidden.includes(c.id)),
    [columns, hidden]
  )

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find(c => c.id === sort.columnId)
    if (!column?.sortValue) return rows
    const factor = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((a, b) => factor * compare(column.sortValue!(a), column.sortValue!(b)))
  }, [rows, sort, columns])

  /**
   * Clamped rather than reset in an effect: filtering from 25 pages down to 3
   * while sitting on page 20 should land on page 3, not flash an empty table
   * for a render before an effect corrects it.
   */
  const totalPages = paginate ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const firstIndex = paginate ? (page - 1) * pageSize : 0
  const pageRows = paginate ? sortedRows.slice(firstIndex, firstIndex + pageSize) : sortedRows

  const goToPage = (next: number) => {
    setRequestedPage(next)
    topRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  const selectable = !!onSelectionChange
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds])
  /** Selection acts on the visible page — "select all" must mean what it shows. */
  const pageIds = useMemo(() => pageRows.map(getRowId), [pageRows, getRowId])
  const selectedOnPage = pageIds.filter(id => selected.has(id)).length

  const toggleAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(Array.from(new Set([...(selectedIds ?? []), ...pageIds])))
    } else {
      const onPage = new Set(pageIds)
      onSelectionChange((selectedIds ?? []).filter(id => !onPage.has(id)))
    }
  }

  const toggleOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    const next = new Set(selectedIds ?? [])
    if (checked) next.add(id)
    else next.delete(id)
    onSelectionChange(Array.from(next))
  }

  const toggleSort = (column: Column<T>) => {
    if (!column.sortValue) return
    setSort(prev =>
      prev?.columnId === column.id
        ? prev.direction === "asc"
          ? { columnId: column.id, direction: "desc" }
          : null
        : { columnId: column.id, direction: "asc" }
    )
  }

  const shell = "bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 overflow-hidden"

  const cardTitle = columns.find(c => c.card === "title") ?? columns.find(c => !c.pinned)
  const cardTrailing = columns.find(c => c.card === "trailing")
  const cardMeta = visibleColumns.filter(
    c => c.card === "meta" || (!c.card && c !== cardTitle && !c.pinned)
  )
  const cardActions = columns.filter(c => c.pinned && c.card !== "hide")

  const showUtilityRow = !!toolbarLeft || (columnPicker && isDesktop)

  const footer = paginate && !loading && !error && sortedRows.length > 0 && (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 text-admin-xs text-admin-muted sticky bottom-0 z-20 bg-admin-surface/95 backdrop-blur-sm shadow-md",
        isDesktop
          ? "border-t border-admin-border"
          : "border border-admin-border rounded-admin"
      )}
    >
      <label className="flex items-center gap-2 shrink-0">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => {
            const next = Number(e.target.value)
            setLocalPageSize(next)
            save({ pageSize: next })
            setRequestedPage(1)
          }}
          aria-label="Rows per page"
          className="admin-focus admin-num h-8 pl-2 pr-6 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs text-admin-text"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>entries</span>
      </label>

      <p className="admin-num sm:ml-auto sm:text-right">
        Showing {firstIndex + 1} to {Math.min(firstIndex + pageSize, sortedRows.length)} of{" "}
        {sortedRows.length} entries
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1 sm:ml-3">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className="admin-focus admin-touch w-8 h-8 inline-flex items-center justify-center rounded-admin-sm border border-admin-border bg-admin-surface text-admin-muted hover:text-admin-text hover:border-admin-border-strong disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {pageWindow(page, totalPages).map((slot, i) =>
          slot === "gap" ? (
            <span key={`gap-${i}`} className="w-6 text-center text-admin-subtle">
              …
            </span>
          ) : (
            <button
              key={slot}
              onClick={() => goToPage(slot)}
              aria-current={slot === page ? "page" : undefined}
              className={cn(
                "admin-focus admin-num w-8 h-8 inline-flex items-center justify-center rounded-admin-sm border text-admin-xs font-semibold transition-colors",
                slot === page
                  ? "bg-admin-accent border-admin-accent text-admin-accent-fg"
                  : "bg-admin-surface border-admin-border text-admin-muted hover:text-admin-text hover:border-admin-border-strong"
              )}
            >
              {slot}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className="admin-focus admin-touch w-8 h-8 inline-flex items-center justify-center rounded-admin-sm border border-admin-border bg-admin-surface text-admin-muted hover:text-admin-text hover:border-admin-border-strong disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  )

  let body: React.ReactNode

  if (error) {
    body = (
      <div className={shell}>
        <EmptyState
          variant="error"
          icon={AlertCircle}
          title="Could not load this list"
          description={error}
        />
      </div>
    )
  } else if (loading) {
    body = (
      <div className={shell}>
        <SkeletonRows rows={7} cols={Math.min(visibleColumns.length || 4, 5)} />
      </div>
    )
  } else if (sortedRows.length === 0) {
    body = (
      <div className={shell}>
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  } else if (isDesktop) {
    body = (
      <div className={shell}>
        <div className={cn("overflow-x-auto custom-scrollbar", dragging && "select-none")}>
          <table
            ref={tableRef}
            // Fixed only once the user has taken over the sizing: it is what
            // makes a dragged width stick instead of being renegotiated from
            // the cell contents on every render.
            className={cn("w-full border-collapse", sized && "table-fixed")}
          >
            <thead>
              <tr className={cn("bg-admin-surface-2", stickyHeader && "sticky top-0 z-10")}>
                {selectable && (
                  <th className="w-10 px-3 border-b border-admin-border">
                    <Checkbox
                      label="Select all rows on this page"
                      checked={selectedOnPage > 0 && selectedOnPage === pageIds.length}
                      indeterminate={selectedOnPage > 0 && selectedOnPage < pageIds.length}
                      onChange={toggleAll}
                    />
                  </th>
                )}
                {visibleColumns.map(column => {
                  const isSorted = sort?.columnId === column.id
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      data-col-id={column.id}
                      style={widths[column.id] ? { width: widths[column.id] } : undefined}
                      className={cn(
                        "relative h-9 px-3 border-b border-admin-border text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted",
                        column.align === "right" ? "text-right" : "text-left",
                        column.stickyRight &&
                          "sticky right-0 z-10 bg-admin-surface-2 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]",
                        // A dragged width wins; the Tailwind class is only the
                        // starting point.
                        !widths[column.id] && column.width
                      )}
                    >
                      {/* Spreadsheet-style grab bar on the column's right edge.
                          Sits over the border so the whole 8px is grabbable. */}
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize column`}
                        tabIndex={0}
                        title="Drag to resize · double-click to reset"
                        onPointerDown={event => startResize(event, column.id)}
                        onDoubleClick={resetWidths}
                        onKeyDown={event => {
                          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
                          event.preventDefault()
                          resizeBy(column.id, event.key === "ArrowRight" ? 16 : -16)
                        }}
                        className="group absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize touch-none select-none admin-focus"
                      >
                        <span className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-admin-accent transition-colors" />
                      </span>

                      {column.sortValue ? (
                        <button
                          onClick={() => toggleSort(column)}
                          className={cn(
                            "admin-focus inline-flex items-center gap-1 rounded hover:text-admin-text transition-colors",
                            column.align === "right" && "flex-row-reverse",
                            isSorted && "text-admin-text"
                          )}
                        >
                          {column.header}
                          {isSorted ? (
                            sort.direction === "asc" ? (
                              <ArrowUp size={11} />
                            ) : (
                              <ArrowDown size={11} />
                            )
                          ) : (
                            <ChevronsUpDown size={11} className="opacity-40" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => {
                const id = getRowId(row)
                const isSelected = selected.has(id)
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    // Rows were mouse-only: everything a row opened was
                    // unreachable by keyboard. Enter and Space now activate the
                    // row the same way a click does, and the focus ring lands
                    // on the row rather than skipping to the first link inside.
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    onKeyDown={
                      onRowClick
                        ? event => {
                            if (event.key !== "Enter" && event.key !== " ") return
                            // A keypress inside a cell's own button or link is
                            // that control's to handle, not the row's.
                            if (event.target !== event.currentTarget) return
                            event.preventDefault()
                            onRowClick(row)
                          }
                        : undefined
                    }
                    className={cn(
                      "border-b border-admin-border last:border-0 transition-colors",
                      // Not `admin-focus`: that ring is a box-shadow, and a
                      // box-shadow on a <tr> is not painted in a
                      // border-collapse table. An inset outline is.
                      "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-accent",
                      // An opaque base colour is what makes `bg-inherit` work on
                      // the sticky actions cell; a transparent row would let the
                      // scrolled content show through underneath it.
                      isSelected
                        ? "bg-admin-accent-soft"
                        : "bg-admin-surface hover:bg-admin-surface-2 focus-visible:bg-admin-surface-2",
                      onRowClick && "cursor-pointer",
                      getRowClassName?.(row)
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-3">
                        <Checkbox
                          label="Select row"
                          checked={isSelected}
                          onChange={checked => toggleOne(id, checked)}
                        />
                      </td>
                    )}
                    {visibleColumns.map(column => (
                      <td
                        key={column.id}
                        className={cn(
                          "h-11 px-3 text-admin-sm text-admin-text align-middle",
                          column.align === "right" && "text-right admin-num",
                          // Once the user owns the widths, content that no
                          // longer fits is clipped rather than allowed to push
                          // the column back open.
                          sized && "overflow-hidden",
                          column.stickyRight &&
                            "sticky right-0 bg-inherit shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]"
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    )
  } else {
    body = (
      <div className="space-y-2">
        {pageRows.map(row => {
          const id = getRowId(row)
          const isSelected = selected.has(id)
          return (
            <div
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "bg-admin-surface border rounded-admin p-3 shadow-admin-1 transition-colors",
                isSelected ? "border-admin-accent bg-admin-accent-soft" : "border-admin-border",
                onRowClick && "active:bg-admin-surface-2 cursor-pointer",
                getRowClassName?.(row)
              )}
            >
              <div className="flex items-start gap-2.5">
                {selectable && (
                  <div className="pt-0.5">
                    <Checkbox
                      label="Select row"
                      checked={isSelected}
                      onChange={checked => toggleOne(id, checked)}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-admin-sm font-semibold text-admin-text">
                  {cardTitle && (cardTitle.cardCell ?? cardTitle.cell)(row)}
                </div>
                {cardTrailing && (
                  <div className="shrink-0">{(cardTrailing.cardCell ?? cardTrailing.cell)(row)}</div>
                )}
              </div>

              {cardMeta.length > 0 && (
                <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {cardMeta.map(column => (
                    <div key={column.id} className="min-w-0">
                      <dt className="text-admin-2xs uppercase tracking-wide text-admin-subtle truncate">
                        {column.header}
                      </dt>
                      <dd className="text-admin-xs text-admin-text truncate">
                        {(column.cardCell ?? column.cell)(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {cardActions.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-admin-border">
                  {cardActions.map(column => (
                    <React.Fragment key={column.id}>
                      {(column.cardCell ?? column.cell)(row)}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {footer}
      </div>
    )
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div ref={topRef} className="scroll-mt-20" />

      {showUtilityRow && (
        <div className="flex items-center gap-3 mb-2">
          {toolbarLeft}
          {columnPicker && isDesktop && (
            <div className="relative ml-auto" ref={pickerRef}>
              <button
                onClick={() => setPickerOpen(o => !o)}
                className="admin-focus inline-flex items-center gap-1.5 h-8 px-2.5 rounded-admin-sm border border-admin-border bg-admin-surface text-admin-xs font-medium text-admin-muted hover:text-admin-text hover:border-admin-border-strong transition-colors"
              >
                <Columns3 size={13} />
                Columns
              </button>
              {pickerOpen && (
                <div className="absolute right-0 top-9 z-30 w-52 max-h-72 overflow-y-auto bg-admin-surface border border-admin-border rounded-admin shadow-admin-3 p-1.5">
                  {columns
                    .filter(c => !c.pinned)
                    .map(c => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-admin-sm text-admin-xs text-admin-text hover:bg-admin-surface-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={!hidden.includes(c.id)}
                          label={`Toggle column`}
                          onChange={checked =>
                            setHidden(
                              checked ? hidden.filter(id => id !== c.id) : [...hidden, c.id]
                            )
                          }
                        />
                        <span className="truncate">{c.header}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {body}
    </div>
  )
}
