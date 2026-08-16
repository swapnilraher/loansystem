import type { ComponentType } from "react";
import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  HardDrive,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Network,
  PieChart,
  Settings,
  ShieldCheck,
  Sliders,
  Kanban,
  UserCircle,
  Users,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Static pill on the right of the sidebar row. */
  badge?: string;
  /** Extra words the command palette should match on. */
  keywords?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for CRM navigation — sidebar, command palette and the
 * mobile bottom bar all read this. Grouped because one flat 16-item list is
 * unscannable.
 *
 * Access is not encoded here: every consumer filters through
 * `canAccessRoute(role, href)` so the sidebar can never drift from the layout's
 * route guard.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "work",
    label: "Work",
    items: [
      {
        name: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        keywords: "dashboard home",
      },
      {
        name: "Leads",
        href: "/admin/leads",
        icon: Briefcase,
        keywords: "customers files pipeline",
      },
      {
        name: "Pipeline Board",
        href: "/admin/kanban",
        icon: Kanban,
        keywords: "kanban stages drag",
      },
      {
        name: "Disbursal Approvals",
        href: "/admin/approvals",
        icon: CheckCircle2,
        keywords: "sign off verify",
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      {
        name: "Banks & Rates",
        href: "/admin/banks",
        icon: Landmark,
        keywords: "incentive commission rate card",
      },
      {
        name: "Banker Directory",
        href: "/admin/bankers",
        icon: Building2,
        keywords: "bankers contacts branch lookup rm",
      },
      {
        name: "Revenue & Reports",
        href: "/admin/reports",
        icon: CreditCard,
        keywords: "performance targets",
      },
      {
        name: "Payouts & Commissions",
        href: "/admin/payouts",
        icon: IndianRupee,
        keywords: "settlement ledger dsa",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      {
        name: "DSA Network",
        href: "/admin/partners",
        icon: Network,
        keywords: "partners connectors agents",
      },
      {
        name: "WhatsApp Inbox",
        href: "/admin/whatsapp-inbox",
        icon: MessageSquare,
        keywords: "chat messages conversations",
      },
      {
        name: "Marketing Analytics",
        href: "/admin/marketing",
        icon: BarChart3,
        keywords: "campaigns utm ads",
      },
      {
        name: "Google Analytics",
        href: "/admin/analytics",
        icon: PieChart,
        keywords: "traffic sessions ga4",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        name: "Team Management",
        href: "/admin/users",
        icon: Users,
        keywords: "staff telecallers accounts",
      },
      {
        name: "Roles & Permissions",
        href: "/admin/permissions",
        icon: ShieldCheck,
        keywords: "access rights matrix",
      },
      {
        name: "Integrations & CRM",
        href: "/admin/integrations",
        icon: Building2,
        keywords: "api webhook whatsapp cloud",
      },
      {
        name: "Auto Chatting",
        href: "/admin/integrations/all-auto-chatting",
        icon: Bot,
        keywords: "bot flows replies",
      },
      {
        name: "Automation",
        href: "/admin/automation",
        icon: Sliders,
        keywords: "rules triggers workflows",
      },
      {
        name: "Cloud Storage",
        href: "/admin/storage",
        icon: HardDrive,
        keywords: "documents files uploads",
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        keywords: "configuration preferences",
      },
      {
        name: "My Profile",
        href: "/admin/profile",
        icon: UserCircle,
        keywords: "account password notifications",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/**
 * Longest-prefix match, so `/admin/integrations/all-auto-chatting` highlights
 * Auto Chatting and not its parent, and `/admin` only lights up on exact match.
 */
export function activeHref(pathname: string | null): string | null {
  if (!pathname) return null;
  const matches = NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).href;
}
