"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, ListPlus, LayoutList, Wallet, User, Menu, X, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/partner", icon: Home },
  { label: "New Lead", href: "/partner/leads/new", icon: ListPlus },
  { label: "My Leads", href: "/partner/leads", icon: LayoutList },
  { label: "Wallet", href: "/partner/wallet", icon: Wallet },
  { label: "Profile", href: "/partner/profile", icon: User },
]

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/partner/register') && pathname !== '/partner/login') {
      router.push('/partner/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  // Allow register and login pages to bypass the standard layout
  if (pathname.startsWith('/partner/register') || pathname === '/partner/login') {
    return <>{children}</>
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-50">
          <h1 className="text-2xl font-black text-secondary tracking-tight">TechStar <span className="text-primary">DSA</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/partner')
            return (
              <a 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-secondary'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </a>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-secondary uppercase">
              {profile?.name?.[0] || user.email?.[0] || "P"}
            </div>
            <div>
              <p className="text-sm font-black text-secondary truncate w-32">{profile?.name || "Partner"}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{profile?.dsaCode || "Pending"}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-rose-50 hover:text-rose-500 transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-100 p-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-black text-secondary tracking-tight">TechStar <span className="text-primary">DSA</span></h1>
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-secondary uppercase text-sm">
          {profile?.name?.[0] || user.email?.[0] || "P"}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/partner')
            return (
              <a 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                  isActive ? 'text-primary bg-primary/5' : 'text-slate-400 hover:text-secondary'
                }`}
              >
                <item.icon size={isActive ? 22 : 20} className={isActive ? 'mb-1' : 'mb-1'} />
                <span className={`text-[9px] font-black tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
