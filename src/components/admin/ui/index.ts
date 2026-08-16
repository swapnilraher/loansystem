/**
 * Admin design system. Import from here, never from the individual files:
 *   import { PageHeader, DataTable, StatusBadge } from "@/components/admin/ui"
 *
 * Every component reads the admin token layer in app/globals.css. If a screen
 * needs a colour, radius or type size that is not a token, add the token —
 * do not reach for a raw hex or a `slate-*` utility.
 */
export { PageHeader } from "./PageHeader"
export type { Crumb } from "./PageHeader"

export { StatCard } from "./StatCard"
export type { StatDelta } from "./StatCard"

export { CardCarousel } from "./CardCarousel"

export { DataTable } from "./DataTable"
export type { Column } from "./DataTable"

export { StatusBadge } from "./StatusBadge"
export { toneForStatus, TONE_CLASSES } from "./status"
export type { Tone } from "./status"

export { Sheet } from "./Sheet"
export { Toolbar } from "./Toolbar"
export type { FilterChip } from "./Toolbar"

export { EmptyState } from "./EmptyState"
export { Skeleton, SkeletonText, SkeletonRows } from "./Skeleton"
export { ToastProvider, useToast } from "./Toast"
export type { ToastInput } from "./Toast"

export { AdminButton, AdminLinkButton } from "./Button"
