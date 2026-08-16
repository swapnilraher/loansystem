/**
 * Single source of truth for CRM role-based access.
 *
 * The CRM has exactly three roles: Admin, Manager and Telecaller.
 * Older role labels still live in Firestore (`admin_users.role`), so every
 * read goes through `normalizeRole()` before any permission check.
 *
 * NOTE: these checks run in the browser and shape the UI. Firestore security
 * rules remain the real enforcement boundary for reads/writes.
 */

export type CrmRole = "Admin" | "Manager" | "Telecaller"

export const CRM_ROLES: CrmRole[] = ["Admin", "Manager", "Telecaller"]

/** Legacy / alternate labels found in existing `admin_users` documents. */
const ROLE_ALIASES: Record<string, CrmRole> = {
  "super admin": "Admin",
  "admin": "Admin",
  "hr": "Admin",
  "manager": "Manager",
  "sales manager": "Manager",
  "telecaller": "Telecaller",
  "assistant telecaller": "Telecaller",
  "agent": "Telecaller",
  "staff": "Telecaller",
}

/**
 * Maps a stored role label to one of the three CRM roles.
 * Returns null only when there is no staff record at all (= no CRM access).
 * Unrecognised labels fall back to Telecaller (least privilege) rather than
 * locking an existing staff member out.
 */
export function normalizeRole(raw?: string | null): CrmRole | null {
  if (!raw || !raw.trim()) return null
  return ROLE_ALIASES[raw.trim().toLowerCase()] ?? "Telecaller"
}

export type Permission =
  /** See the staff directory and every staff member's progress. */
  | "staff:view"
  /** Add, edit, activate and deactivate staff accounts. */
  | "staff:manage"
  /** See every lead in the organisation, not just own + unassigned. */
  | "leads:viewAll"
  /** Assign or re-assign a lead to a telecaller. */
  | "leads:assign"
  /**
   * Remove a lead from the working pipeline. Every role has this: a telecaller
   * clearing a wrong number should not need an Admin. It is not destructive —
   * see `softDeleteLead`, which hides the file rather than erasing it.
   */
  | "leads:delete"
  /**
   * See leads that have been deleted, and put one back. Admin only, and the
   * reason the delete above is safe to hand out: the file is still there, and
   * exactly one role can find it.
   */
  | "leads:viewDeleted"
  | "leads:export"
  /** Verify a telecaller's disbursal, then approve or reject it. */
  | "disbursement:approve"
  /** Manage the bank master: incentive rates and connector commission rates. */
  | "banks:manage"
  /** Team performance reports. */
  | "reports:view"

const ROLE_PERMISSIONS: Record<CrmRole, Permission[]> = {
  Admin: [
    "staff:view",
    "staff:manage",
    "leads:viewAll",
    "leads:assign",
    "leads:delete",
    "leads:viewDeleted",
    "leads:export",
    "disbursement:approve",
    "banks:manage",
    "reports:view",
  ],
  // Managers monitor the team and sign off disbursals, but never touch staff
  // accounts or the bank rate card, and cannot export.
  Manager: [
    "staff:view",
    "leads:viewAll",
    "leads:assign",
    "leads:delete",
    "disbursement:approve",
    "reports:view",
  ],
  // Telecallers only work their own leads + the unassigned pool. Deleting one
  // hides it from their own list and from everyone else's; only an Admin can
  // still see it afterwards.
  Telecaller: ["leads:delete"],
}

export function can(role: CrmRole | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function permissionsFor(role: CrmRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Who the signed-in staff member is, in every id shape `leads.assignedTo` can
 * legitimately hold.
 *
 * `assignedTo` is not one kind of id in this CRM. The assignment dropdown writes
 * an `admin_users` *document* id; auto-claim (`useLeadMutations`) writes a
 * Firebase Auth *uid*. Both shapes are already live in Firestore, so comparing
 * against a single id silently hides leads from the person they were handed to.
 * Match against the whole set instead. (`waNotificationShared.identityTokens`
 * solves the same problem for the notification feed.)
 */
export interface ViewerIdentity {
  /** Raw ids, case preserved — safe to use in a Firestore `where(... "in" ...)`. */
  ids: string[]
  /** Lower-cased, for in-memory matching. */
  tokens: string[]
}

export const EMPTY_VIEWER: ViewerIdentity = { ids: [], tokens: [] }

/** Builds a de-duplicated identity from whatever ids are known for one person. */
export function viewerIdentity(...raw: (string | null | undefined)[]): ViewerIdentity {
  const ids: string[] = []
  const tokens = new Set<string>()
  for (const value of raw) {
    const id = (value ?? "").trim()
    if (!id) continue
    const token = id.toLowerCase()
    if (tokens.has(token)) continue
    tokens.add(token)
    ids.push(id)
  }
  return { ids, tokens: [...tokens] }
}

/** True when this lead is assigned to the viewer, whichever id shape it stores. */
export function ownsLead(
  lead: { assignedTo?: string | null },
  viewer: ViewerIdentity | null | undefined
): boolean {
  const owner = (lead.assignedTo ?? "").trim().toLowerCase()
  if (!owner || !viewer) return false
  return viewer.tokens.includes(owner)
}

/**
 * Lead visibility rule.
 * Admin and Manager see everything. A telecaller sees leads assigned to them
 * plus the unassigned pool — never another telecaller's leads.
 */
export function canSeeLead(
  role: CrmRole | null,
  lead: { assignedTo?: string | null },
  viewer: ViewerIdentity | null | undefined
): boolean {
  if (!role) return false
  if (can(role, "leads:viewAll")) return true
  if (!lead.assignedTo) return true
  return ownsLead(lead, viewer)
}

/**
 * A telecaller claims an unassigned lead on first contact (call or in-built
 * WhatsApp chat). Admins and Managers acting on a lead never claim it.
 */
export function shouldAutoClaimLead(
  role: CrmRole | null,
  lead: { assignedTo?: string | null }
): boolean {
  return (role === "Telecaller" || role === "Manager") && !lead.assignedTo
}

const ADMIN_ONLY: CrmRole[] = ["Admin"]
const ADMIN_AND_MANAGER: CrmRole[] = ["Admin", "Manager"]

/**
 * Which roles may open each admin route. Longest matching prefix wins; routes
 * that are not listed (Overview, Leads, Kanban, Profile) are open to all roles.
 * Hiding a sidebar link is not enough — the layout enforces this on every
 * navigation, including direct URL entry.
 */
export const ROUTE_ROLES: { prefix: string; roles: CrmRole[] }[] = [
  { prefix: "/admin/users", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/approvals", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/banks", roles: ADMIN_ONLY },
  { prefix: "/admin/bankers", roles: ADMIN_ONLY },
  { prefix: "/admin/permissions", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/partners", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/reports", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/analytics", roles: ADMIN_AND_MANAGER },
  { prefix: "/admin/whatsapp-inbox", roles: ["Admin", "Manager", "Telecaller"] },
  { prefix: "/admin/payouts", roles: ADMIN_ONLY },
  { prefix: "/admin/marketing", roles: ADMIN_ONLY },
  { prefix: "/admin/integrations", roles: ADMIN_ONLY },
  { prefix: "/admin/automation", roles: ADMIN_ONLY },
  { prefix: "/admin/storage", roles: ADMIN_ONLY },
  { prefix: "/admin/settings", roles: ADMIN_ONLY },
]

export function canAccessRoute(role: CrmRole | null, pathname?: string | null): boolean {
  if (!role) return false
  if (!pathname) return true
  const match = ROUTE_ROLES
    .filter(r => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  return match ? match.roles.includes(role) : true
}

/** Human-readable summary used by the Roles & Permissions screen. */
export const ROLE_SUMMARY: Record<CrmRole, { level: string; access: string; description: string }> = {
  Admin: {
    level: "L1",
    access: "Full CRM",
    description:
      "Complete access. Manages staff accounts, the bank rate card and the WhatsApp bot script, sees every lead — including deleted ones, which only this role can see or restore — and is the only role that can export leads.",
  },
  Manager: {
    level: "L2",
    access: "All leads, all staff progress, disbursal approvals, reports",
    description:
      "Monitors the team and signs off disbursals: verifies the file, picks the bank, confirms the disbursed amount and releases the incentive. Cannot manage staff accounts, edit bank rates or export leads, and cannot see a lead once it has been deleted.",
  },
  Telecaller: {
    level: "L3",
    access: "Own leads + unassigned pool",
    description:
      "Sees only their own assigned leads and new unassigned leads. A lead is auto-assigned to them on the first call or first in-built WhatsApp chat. Marking a file disbursed raises an approval request for a Manager to confirm.",
  },
}

/** Module-by-role matrix rendered on the Roles & Permissions screen. */
export const MODULE_MATRIX: { name: string; permission: Permission }[] = [
  { name: "View all leads", permission: "leads:viewAll" },
  { name: "Assign / re-assign leads", permission: "leads:assign" },
  { name: "Delete leads", permission: "leads:delete" },
  { name: "See & restore deleted leads", permission: "leads:viewDeleted" },
  { name: "Export leads", permission: "leads:export" },
  { name: "Approve disbursals", permission: "disbursement:approve" },
  { name: "Manage banks & rates", permission: "banks:manage" },
  { name: "View staff progress", permission: "staff:view" },
  { name: "Manage staff accounts", permission: "staff:manage" },
  { name: "Team performance reports", permission: "reports:view" },
]
