"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
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
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Leads Pipeline", href: "/admin/leads", icon: Briefcase },
  { name: "Kanban Board", href: "/admin/kanban", icon: LayoutDashboard },
  { name: "Team Management", href: "/admin/users", icon: Users },
  { name: "Cloud Storage", href: "/admin/storage", icon: HardDrive },
  { name: "Marketing & UTM", href: "/admin/marketing", icon: Zap },
  { name: "Reports & MIS", href: "/admin/reports", icon: FileText },
  { name: "Revenue Tracking", href: "/admin/revenue", icon: PieChart },
  { name: "Payouts & Commissions", href: "/admin/payouts", icon: IndianRupee },
  { name: "WhatsApp Chat", href: "/admin/whatsapp", icon: MessageSquare },
  { name: "Call Logs", href: "/admin/calls", icon: PhoneCall },
  { name: "Global Settings", href: "/admin/settings", icon: Settings },
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
    if (item.href === "/admin/whatsapp") {
      // WhatsApp is for HR and Admin (and Super Admin)
      return adminRole === "Super Admin" || adminRole === "Admin" || adminRole === "HR"
    }
    if (item.href === "/admin/settings" || item.href === "/admin/marketing") {
      // Global Settings & Marketing for Super Admin & Admin
      return adminRole === "Super Admin" || adminRole === "Admin"
    }
    return true
  })

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-72 bg-slate-950 text-white border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight">TECHSTAR</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Control</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-primary transition-colors")} />
              <span className="font-bold text-sm">{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-800">
        <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-bold text-sm uppercase">
            {(profile?.name || user?.displayName || user?.email || "AD").substring(0, 2)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-bold text-sm truncate">{profile?.name || user?.displayName || user?.email || "Admin User"}</p>
            <p className="text-xs text-slate-500 truncate">{adminRole || "Staff"}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
