"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  MessageSquare,
  PhoneCall,
  Settings,
  LogOut,
  ShieldCheck,
  FileText,
  PieChart,
  Zap,
  HardDrive,
  IndianRupee,
  X,
  BarChart3,
  Network,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Leads Pipeline", href: "/admin/leads", icon: Briefcase },
  { name: "DSA Network", href: "/admin/partners", icon: Network },
  { name: "Team Management", href: "/admin/users", icon: Users },
  { name: "Revenue & Reports", href: "/admin/reports", icon: CreditCard },
  { name: "Payouts & Commissions", href: "/admin/payouts", icon: IndianRupee },
  { name: "Google Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Marketing Analytics", href: "/admin/marketing", icon: BarChart3 },
  { name: "Integrations & CRM", href: "/admin/integrations", icon: Building2 },
  { name: "Cloud Storage", href: "/admin/storage", icon: HardDrive },
  { name: "Roles & Permissions", href: "/admin/permissions", icon: ShieldCheck },
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user, profile, adminRole, logout } = useAuth()

  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/admin/users") {
      // Only Super Admin can manage team
      return adminRole === "Super Admin"
    }
    if (item.href === "/admin/marketing") {
      // Marketing for Super Admin & Admin
      return adminRole === "Super Admin" || adminRole === "Admin"
    }
    if (item.href === "/admin/permissions") {
      // Permissions for Super Admin & Admin
      return adminRole === "Super Admin" || adminRole === "Admin"
    }
    return true
  })

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 h-screen w-72 bg-white text-slate-900 border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm p-1">
            <img src="/img/logo.jpeg" alt="TechStar Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-900">TECHSTAR</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Portal</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <nav className="p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            const isExternal = item.href.startsWith("http")
            const LinkComponent = isExternal ? "a" : Link
            const extraProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}

            return (
              // @ts-ignore
              <LinkComponent
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group active:scale-[0.98]",
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                )}
                {...extraProps}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600 transition-colors")} />
                <span className="font-bold text-sm truncate">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
              </LinkComponent>
            )
          })}
        </nav>
      </div>

      <div className="p-5 mt-auto border-t border-slate-100 bg-slate-50/80 lg:hidden">
        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-3 w-full text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold text-sm border border-transparent hover:border-rose-100"
        >
          <LogOut size={18} />
          <span className="truncate">Logout securely</span>
        </button>
      </div>
    </aside>
  )
}
