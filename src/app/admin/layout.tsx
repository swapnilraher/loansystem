"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

import { Loader2, ShieldCheck, LayoutDashboard, Briefcase, Network, Menu } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, adminRole, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && pathname !== "/admin/login") {
      if (!user) {
        // Not logged in at all, redirect to admin login page
        router.push("/admin/login")
      } else if (!adminRole) {
        // Logged in but not an authorized admin, redirect to homepage
        router.push("/")
      }
    }
  }, [user, adminRole, loading, router, pathname])

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-slate-50 flex flex-col justify-center">{children}</div>
  }

  // Permission verification check
  if (loading || (!adminRole && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-bold gap-4 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={54} />
          <ShieldCheck className="text-primary absolute" size={24} />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-slate-450 animate-pulse">Verifying Permissions...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="min-w-0 ml-0 lg:ml-72 h-screen overflow-y-auto custom-scrollbar relative z-10">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around z-50 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
        <Link 
          href="/admin" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname === "/admin" ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <LayoutDashboard size={20} className={pathname === "/admin" ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">Overview</span>
        </Link>

        <Link 
          href="/admin/leads" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname.startsWith("/admin/leads") ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <Briefcase size={20} className={pathname.startsWith("/admin/leads") ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">Leads</span>
        </Link>

        <Link 
          href="/admin/partners" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname.startsWith("/admin/partners") ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <Network size={20} className={pathname.startsWith("/admin/partners") ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">DSA</span>
        </Link>

        <button 
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl text-slate-400 font-bold transition-all hover:text-slate-650 cursor-pointer active:scale-95"
        >
          <Menu size={20} />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </div>
  )
}
