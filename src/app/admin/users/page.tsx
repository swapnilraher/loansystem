"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  FileText,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  BarChart3,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle2,
  Award,
  Layers,
  Key,
} from "lucide-react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUsers, AdminUser } from "@/lib/hooks/useUsers"
import { useLeads } from "@/lib/hooks/useLeads"
import { useAuth } from "@/context/AuthContext"
import { can, normalizeRole } from "@/lib/permissions"
import { useStaffIncentives } from "@/lib/hooks/useStaffPerformance"
import { formatINR } from "@/lib/hooks/useBanks"
import { formatDayShort } from "@/lib/dates"
import { hashPassword } from "@/lib/passwordSecurity"
import { authedFetch } from "@/lib/authedFetch"
import {
  AdminButton,
  Column,
  DataTable,
  PageHeader,
  Sheet,
  StatusBadge,
  Toolbar,
  useToast,
} from "@/components/admin/ui"
import { Field, FactRow, SectionCard, Select, TextInput } from "@/components/admin/leads/fields"

// Analytics Components & Helpers
import {
  AnalyticsFilterState,
  INITIAL_ANALYTICS_FILTERS,
  computeKpiSummary,
  computeStaffMetrics,
  StaffPerformanceMetrics,
} from "@/lib/analyticsEngine"
import { GlobalAnalyticsFilterBar } from "@/components/admin/analytics/GlobalAnalyticsFilterBar"
import { StaffPerformanceCharts } from "@/components/admin/analytics/StaffPerformanceCharts"
import { StaffPerformanceTable } from "@/components/admin/analytics/StaffPerformanceTable"
import { StaffDetailModal } from "@/components/admin/analytics/StaffDetailModal"
import { LeadJourneyModal } from "@/components/admin/analytics/LeadJourneyModal"
import { PorterAnalyticsTab } from "@/components/admin/analytics/PorterAnalyticsTab"

/** The one account that can never be demoted, deactivated or deleted. */
const PRIMARY_ADMIN_EMAIL = "swapnil.r.aher@gmail.com"

interface PortalUser {
  id: string
  panName?: string
  displayName?: string
  panNumber?: string
  email?: string
  mobile?: string
  city?: string
  createdAt?: unknown
  docs?: Record<string, unknown>
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "Telecaller",
  designation: "",
  status: "Active",
  password: "",
  joiningDate: "",
  annualLeaves: 12,
  leavesTaken: 0,
  leaveNotes: "",
}

type StaffForm = typeof EMPTY_FORM

export default function UsersPage() {
  const { user, role } = useAuth()
  const toast = useToast()
  const canViewStaff = can(role, "staff:view")
  const canManageStaff = can(role, "staff:manage")

  const { users: adminUsers, loading: adminsLoading } = useUsers()
  const { leads } = useLeads()
  const { incentives } = useStaffIncentives()

  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])
  const [portalLoading, setPortalLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])

  // Top Tabs: "analytics" | "journey" | "porter" | "admins" | "portal"
  const [tab, setTab] = useState<string>(canViewStaff ? "analytics" : "portal")
  const [search, setSearch] = useState("")

  // Analytics Filter & Selected Staff Modal State
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilterState>(INITIAL_ANALYTICS_FILTERS)
  const [selectedStaffModal, setSelectedStaffModal] = useState<StaffPerformanceMetrics | null>(null)

  // Account Management States
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [portalDetail, setPortalDetail] = useState<PortalUser | null>(null)
  const [confirm, setConfirm] = useState<{ member: AdminUser; action: "toggle" | "delete" } | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      snapshot => {
        setPortalUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as PortalUser))
        setPortalLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!canViewStaff) return
    const unsubscribe = onSnapshot(query(collection(db, "lead_activities")), snapshot => {
      setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsubscribe()
  }, [canViewStaff])

  // Analytics KPI & Staff Metrics Computation
  const kpis = useMemo(
    () => computeKpiSummary(adminUsers, leads, activities, analyticsFilters),
    [adminUsers, leads, activities, analyticsFilters]
  )

  const staffPerformanceList = useMemo(
    () => computeStaffMetrics(adminUsers, leads, activities, analyticsFilters),
    [adminUsers, leads, activities, analyticsFilters]
  )

  // Account Management Handlers
  const term = search.trim().toLowerCase()
  const filteredStaff = useMemo(
    () =>
      adminUsers.filter(member =>
        `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(term)
      ),
    [adminUsers, term]
  )

  const filteredPortal = useMemo(
    () =>
      portalUsers.filter(portalUser =>
        `${portalUser.panName || portalUser.displayName || ""} ${portalUser.email || ""} ${portalUser.mobile || ""}`
          .toLowerCase()
          .includes(term)
      ),
    [portalUsers, term]
  )

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (member: AdminUser) => {
    setEditing(member)
    setForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      role: normalizeRole(member.role),
      designation: member.designation || "",
      status: member.status || "Active",
      password: "",
      joiningDate: member.joiningDate || "",
      annualLeaves: member.annualLeaves ?? 12,
      leavesTaken: member.leavesTaken ?? 0,
      leaveNotes: member.leaveNotes || "",
    })
    setFormOpen(true)
  }

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageStaff) return

    if (!form.name.trim() || !form.email.trim()) {
      toast.push({ tone: "danger", title: "Name and email are required" })
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const updateData: any = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: form.role,
          designation: form.designation.trim(),
          status: form.status,
          joiningDate: form.joiningDate,
          annualLeaves: Number(form.annualLeaves) || 0,
          leavesTaken: Number(form.leavesTaken) || 0,
          leaveNotes: form.leaveNotes.trim(),
          updatedAt: serverTimestamp(),
        }

        if (form.password.trim()) {
          const { salt, hash } = hashPassword(form.password.trim())
          updateData.passwordHash = hash
          updateData.passwordSalt = salt
          updateData.mustChangePassword = true
        }

        await updateDoc(doc(db, "admin_users", editing.id), updateData)
        toast.push({ tone: "success", title: `${form.name} updated` })
      } else {
        const rawPassword = form.password.trim() || "123456"
        const { salt, hash } = hashPassword(rawPassword)

        const docRef = await addDoc(collection(db, "admin_users"), {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          role: form.role,
          designation: form.designation.trim(),
          status: form.status,
          joiningDate: form.joiningDate || new Date().toISOString().split("T")[0],
          annualLeaves: Number(form.annualLeaves) || 12,
          leavesTaken: Number(form.leavesTaken) || 0,
          leaveNotes: form.leaveNotes.trim(),
          passwordHash: hash,
          passwordSalt: salt,
          mustChangePassword: true,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lockoutReason: null,
          lockoutLevel: 0,
          createdAt: serverTimestamp(),
        })

        if (rawPassword) {
          try {
            await fetch("/api/auth/sync-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email.trim().toLowerCase(), password: rawPassword }),
            })
          } catch (err) {
            console.error("Firebase Auth password sync error:", err)
          }
        }

        toast.push({ tone: "success", title: `${form.name} created` })
      }

      setFormOpen(false)
    } catch (err: any) {
      console.error("Save staff error:", err)
      toast.push({ tone: "danger", title: err.message || "Failed to save team member" })
    } finally {
      setSaving(false)
    }
  }

  const handleUnlockUser = async (memberId: string, memberName: string) => {
    try {
      const idToken = user ? await user.getIdToken() : ""
      const res = await authedFetch("/api/auth/unlock-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: memberId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unlock failed")
      }
      toast.push({ tone: "success", title: `${memberName} account unlocked!` })
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message || "Could not unlock account." })
    }
  }

  const handleExecuteAction = async () => {
    if (!confirm || !canManageStaff) return
    const { member, action } = confirm

    if (member.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      toast.push({ tone: "danger", title: "The primary super admin account cannot be modified." })
      setConfirm(null)
      return
    }

    try {
      if (action === "toggle") {
        const nextStatus = member.status === "Active" ? "Inactive" : "Active"
        await updateDoc(doc(db, "admin_users", member.id), { status: nextStatus })
        toast.push({ tone: "success", title: `${member.name} set to ${nextStatus}` })
      } else if (action === "delete") {
        await deleteDoc(doc(db, "admin_users", member.id))
        toast.push({ tone: "success", title: `${member.name} deleted` })
      }
    } catch (err) {
      console.error("Action error:", err)
      toast.push({ tone: "danger", title: "Action failed" })
    } finally {
      setConfirm(null)
    }
  }

  // Staff Table Columns for Account Directory
  const staffColumns: Column<AdminUser>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Team Member",
        cell: member => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-admin-text">{member.name}</span>
              {member.mustChangePassword && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                  Must Change Password
                </span>
              )}
            </div>
            <div className="text-admin-2xs text-admin-subtle font-medium">{member.email}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: member => <span className="font-semibold text-admin-text">{member.role}</span>,
      },
      {
        id: "status",
        header: "Status & Security",
        cell: member => {
          const isLocked = member.lockoutUntil && new Date(member.lockoutUntil) > new Date()
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <StatusBadge tone={member.status === "Active" ? "success" : "neutral"} status={member.status || "Active"} />
                {isLocked && (
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 text-[10px] font-bold border border-red-200">
                    LOCKED ({member.lockoutLevel === 2 ? "24h" : "30m"})
                  </span>
                )}
              </div>
              {isLocked && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-red-500 font-semibold">{member.lockoutReason}</p>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      handleUnlockUser(member.id, member.name)
                    }}
                    className="text-[10px] font-bold text-indigo-600 underline cursor-pointer"
                  >
                    Unlock Account
                  </button>
                </div>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: member => (
          <div className="flex items-center justify-end gap-1.5">
            {canManageStaff && (
              <>
                <AdminButton size="xs" variant="ghost" onClick={() => openEdit(member)}>
                  Edit
                </AdminButton>
                {member.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase() && (
                  <AdminButton
                    size="xs"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setConfirm({ member, action: "delete" })}
                  >
                    Delete
                  </AdminButton>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [canManageStaff]
  )

  const portalColumns: Column<PortalUser>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Customer",
        cell: portalUser => (
          <div>
            <div className="font-bold text-admin-text">{portalUser.panName || portalUser.displayName || "Customer"}</div>
            <div className="text-admin-2xs text-admin-subtle">{portalUser.mobile || "—"}</div>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        cell: portalUser => <span className="text-admin-muted">{portalUser.email || "—"}</span>,
      },
      {
        id: "city",
        header: "City",
        cell: portalUser => <span className="text-admin-muted">{portalUser.city || "—"}</span>,
      },
    ],
    []
  )

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <PageHeader
        title="Team Management & Lead Analytics"
        subtitle="Comprehensive staff performance engine, stage lifecycle journey, and team account administration."
        breadcrumbs={[{ label: "Admin" }, { label: "Team Management" }]}
        actions={
          tab === "admins" && canManageStaff ? (
            <AdminButton size="sm" variant="primary" icon={UserPlus} onClick={openAdd}>
              Add team member
            </AdminButton>
          ) : undefined
        }
      />

      {/* Main Tabs Navigation */}
      <Toolbar
        search={tab === "admins" || tab === "portal" ? search : undefined}
        onSearchChange={setSearch}
        searchPlaceholder={tab === "portal" ? "Search portal users..." : "Search team members..."}
        chips={
          canViewStaff
            ? [
                { id: "analytics", label: "📊 Staff Performance Analytics", count: adminUsers.length },
                { id: "journey", label: "⏳ Lead Journey Tracker" },
                { id: "porter", label: "🌐 Portal Customer Analytics" },
                { id: "admins", label: "👥 Team Directory", count: adminUsers.length },
                { id: "portal", label: "🌐 Portal Users", count: portalUsers.length },
              ]
            : [{ id: "portal", label: "Portal users", count: portalUsers.length }]
        }
        activeChip={tab}
        onChipChange={setTab}
      />

      {/* TAB 1: Staff Performance & Analytics Dashboard */}
      {tab === "analytics" && (
        <div className="space-y-4">
          {/* 17 Top-Level KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Total Staff</p>
              <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{kpis.totalStaff}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Active Staff</p>
              <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{kpis.activeStaff}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Assigned Leads</p>
              <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{kpis.totalAssignedLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">New Leads</p>
              <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{kpis.newLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">In Progress</p>
              <p className="text-admin-base font-extrabold text-amber-600 mt-0.5">{kpis.inProgressLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Login Leads</p>
              <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{kpis.loginLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Sanction</p>
              <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{kpis.sanctionLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Disbursed</p>
              <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{kpis.disbursedLeads}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Rejected</p>
              <p className="text-admin-base font-extrabold text-red-600 mt-0.5">{kpis.rejectedLeads}</p>
            </div>

            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Total Calls</p>
              <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{kpis.totalCalls}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Connected Calls</p>
              <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{kpis.connectedCalls}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Total Chats</p>
              <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{kpis.totalChats}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Follow-ups</p>
              <p className="text-admin-base font-extrabold text-amber-600 mt-0.5">{kpis.totalFollowUps}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Updates</p>
              <p className="text-admin-base font-extrabold text-admin-text mt-0.5">{kpis.totalStatusUpdates}</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center col-span-2">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Conversion Rate %</p>
              <p className="text-admin-base font-extrabold text-emerald-600 mt-0.5">{kpis.overallConversionRate}%</p>
            </div>
            <div className="p-3 bg-admin-surface border border-admin-border rounded-admin text-center col-span-2">
              <p className="text-admin-2xs font-bold text-admin-subtle uppercase">Disbursement Rate %</p>
              <p className="text-admin-base font-extrabold text-indigo-600 mt-0.5">{kpis.overallDisbursementRate}%</p>
            </div>
          </div>

          {/* Global Filter Bar */}
          <GlobalAnalyticsFilterBar
            filters={analyticsFilters}
            onChange={setAnalyticsFilters}
            staffList={adminUsers}
          />

          {/* 10 Interactive Charts */}
          <StaffPerformanceCharts
            staffMetrics={staffPerformanceList}
            leads={leads}
          />

          {/* Detailed Staff Performance Table (Admin Only) */}
          <StaffPerformanceTable
            metrics={staffPerformanceList}
            onSelectStaff={setSelectedStaffModal}
          />

          {/* Staff Detailed Performance Modal */}
          <StaffDetailModal
            staff={selectedStaffModal}
            activities={activities}
            onClose={() => setSelectedStaffModal(null)}
          />
        </div>
      )}

      {/* TAB 2: Lead Journey Tracker */}
      {tab === "journey" && (
        <LeadJourneyModal leads={leads} activities={activities} />
      )}

      {/* TAB 3: Porter Analytics */}
      {tab === "porter" && (
        <PorterAnalyticsTab leads={leads} staffList={adminUsers} />
      )}

      {/* TAB 4: Team Directory (Existing Admin Users) */}
      {tab === "admins" && (
        <DataTable
          columns={staffColumns}
          rows={filteredStaff}
          getRowId={member => member.id}
          loading={adminsLoading}
          emptyTitle="No team members found"
          emptyDescription={canManageStaff ? "Add your first team member to get started." : undefined}
          emptyAction={
            canManageStaff ? (
              <AdminButton variant="primary" icon={UserPlus} onClick={openAdd}>
                Add team member
              </AdminButton>
            ) : undefined
          }
          getRowClassName={member => (member.status === "Inactive" ? "opacity-60" : undefined)}
        />
      )}

      {/* TAB 5: Portal Customers */}
      {tab === "portal" && (
        <DataTable
          columns={portalColumns}
          rows={filteredPortal}
          getRowId={portalUser => portalUser.id}
          loading={portalLoading}
          onRowClick={setPortalDetail}
          emptyTitle="No portal users found"
          emptyDescription="Customers who register on the website appear here."
        />
      )}

      {/* User Creation / Edit Sheet */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        side="right"
        size="md"
        title={editing ? `Edit ${editing.name}` : "Add team member"}
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <SectionCard title="Identity">
            <div className="space-y-3">
              <Field label="Full Name *" required>
                <TextInput
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Email Address *" required>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Mobile Phone">
                <TextInput
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Role & Access">
            <div className="grid grid-cols-2 gap-3">
              <Field label="System Role *">
                <Select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="Telecaller">Telecaller</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="DSA Partner">DSA Partner</option>
                </Select>
              </Field>
              <Field label="Status *">
                <Select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Password & Security">
            <Field label={editing ? "Reset Password (leave empty to keep current)" : "Initial Password"}>
              <TextInput
                type="password"
                placeholder={editing ? "Leave blank to keep password" : "Default: 123456"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </Field>
          </SectionCard>

          <div className="flex justify-end gap-2 pt-2 border-t border-admin-border">
            <AdminButton variant="ghost" onClick={() => setFormOpen(false)} type="button">
              Cancel
            </AdminButton>
            <AdminButton variant="primary" type="submit" loading={saving}>
              {editing ? "Update Member" : "Create Member"}
            </AdminButton>
          </div>
        </form>
      </Sheet>

      {/* Confirmation Dialog */}
      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        side="right"
        size="sm"
        title="Confirm Action"
      >
        {confirm && (
          <div className="space-y-4">
            <p className="text-admin-xs text-admin-text font-medium">
              Are you sure you want to {confirm.action} <b>{confirm.member.name}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setConfirm(null)}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={handleExecuteAction}>
                Confirm
              </AdminButton>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
