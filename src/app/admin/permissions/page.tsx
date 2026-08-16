"use client"

import React from "react"
import { Check, Key, Lock, Minus, Shield, UserCheck, Users } from "lucide-react"
import { useUsers } from "@/lib/hooks/useUsers"
import {
  CRM_ROLES,
  MODULE_MATRIX,
  ROLE_SUMMARY,
  can,
  normalizeRole,
} from "@/lib/permissions"
import { AdminLinkButton, PageHeader } from "@/components/admin/ui"

export default function PermissionsPage() {
  const { users } = useUsers()

  const headcount = (roleName: string) =>
    users.filter(u => normalizeRole(u.role) === roleName && u.status !== "Inactive").length

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Roles & permissions"
        subtitle="The CRM has three roles. Access is derived from the role on each staff account — this screen is a read-only view of what the code enforces."
        actions={
          <AdminLinkButton href="/admin/users" size="sm" icon={Users} variant="primary">
            Manage team
          </AdminLinkButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CRM_ROLES.map(roleName => {
          const summary = ROLE_SUMMARY[roleName]
          const count = headcount(roleName)
          return (
            <section
              key={roleName}
              className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-admin-sm bg-admin-accent-soft border border-admin-border text-admin-accent flex items-center justify-center shrink-0">
                  <Shield size={15} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-admin-base font-semibold text-admin-text">{roleName}</h2>
                  <p className="admin-num text-admin-2xs text-admin-subtle">
                    {count} active {count === 1 ? "member" : "members"} · {summary.level}
                  </p>
                </div>
              </div>

              <p className="text-admin-sm text-admin-text mt-3">{summary.access}</p>
              <p className="text-admin-xs text-admin-muted mt-1.5 leading-relaxed">
                {summary.description}
              </p>
            </section>
          )
        })}
      </div>

      <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-admin-border">
          <h2 className="text-admin-base font-semibold text-admin-text">Module access matrix</h2>
          <p className="text-admin-xs text-admin-subtle mt-0.5">
            Enforced in the browser and by Firestore security rules
          </p>
        </div>

        {/* Desktop: real table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-admin-surface-2">
                <th className="h-9 px-3 text-left text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted border-b border-admin-border">
                  Capability
                </th>
                {CRM_ROLES.map(roleName => (
                  <th
                    key={roleName}
                    className="h-9 px-3 text-center text-admin-2xs font-semibold uppercase tracking-wide text-admin-muted border-b border-admin-border w-32"
                  >
                    {roleName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULE_MATRIX.map(module => (
                <tr key={module.permission} className="border-b border-admin-border last:border-0">
                  <td className="h-11 px-3">
                    <span className="flex items-center gap-2 text-admin-sm text-admin-text">
                      <Key size={13} className="text-admin-subtle shrink-0" />
                      {module.name}
                    </span>
                  </td>
                  {CRM_ROLES.map(roleName => (
                    <td key={roleName} className="h-11 px-3 text-center">
                      {can(roleName, module.permission) ? (
                        <Check size={16} className="inline text-tone-success-fg" aria-label="Allowed" />
                      ) : (
                        <Minus size={16} className="inline text-admin-subtle" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: one card per capability */}
        <div className="md:hidden divide-y divide-admin-border">
          {MODULE_MATRIX.map(module => (
            <div key={module.permission} className="p-3">
              <p className="flex items-center gap-2 text-admin-sm font-medium text-admin-text">
                <Key size={13} className="text-admin-subtle shrink-0" />
                {module.name}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {CRM_ROLES.map(roleName => {
                  const allowed = can(roleName, module.permission)
                  return (
                    <div
                      key={roleName}
                      className={`rounded-admin-sm border px-2 py-1.5 text-center ${
                        allowed
                          ? "bg-tone-success border-tone-success-bd text-tone-success-fg"
                          : "bg-admin-surface-2 border-admin-border text-admin-subtle"
                      }`}
                    >
                      <span className="block text-admin-2xs uppercase tracking-wide">{roleName}</span>
                      <span className="block text-admin-xs font-semibold">
                        {allowed ? "Yes" : "No"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Rule
          icon={UserCheck}
          title="Automatic lead assignment"
          body="New leads arrive unassigned and are visible to every telecaller. The first telecaller to call the lead or open the in-built WhatsApp chat claims it — from that moment the lead disappears from every other telecaller's pipeline. Admins and Managers see all leads regardless of assignment and never claim a lead by acting on it."
        />
        <Rule
          icon={Lock}
          title="Account deactivation"
          body="Setting a staff account to Inactive on the Users screen revokes CRM access on their next sign-in, while keeping the account and its lead history intact. Only Admins can activate or deactivate accounts."
        />
      </div>
    </div>
  )
}

function Rule({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  body: string
}) {
  return (
    <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 p-4 flex items-start gap-3">
      <span className="w-9 h-9 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-muted flex items-center justify-center shrink-0">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <h2 className="text-admin-base font-semibold text-admin-text">{title}</h2>
        <p className="text-admin-sm text-admin-muted mt-1 leading-relaxed">{body}</p>
      </div>
    </section>
  )
}
