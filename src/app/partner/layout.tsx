"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ListPlus, LayoutList, Wallet, User, Menu, X, LogOut, AlertCircle } from "lucide-react"
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

  const partnerPhoto = profile?.kycData?.photoBase64 
    ? `data:image/jpeg;base64,${profile.kycData.photoBase64}` 
    : user?.photoURL || "";

  // Redirect checks:
  // 1. If not authenticated, redirect to partner login
  // 2. If authenticated but role is not partner or dsaStatus is not Active, redirect to partner register to complete onboarding
  useEffect(() => {
    if (loading) return;
    
    const onRegisterOrLogin = pathname.startsWith('/partner/register') || pathname === '/partner/login';
    
    if (!user) {
      if (!onRegisterOrLogin) {
        router.push('/partner/login');
      }
    } else if (profile) {
      const isRegisteredAndActive = profile.role === "partner" && profile.dsaStatus === "Active";
      if (!isRegisteredAndActive && !onRegisterOrLogin) {
        router.push('/partner/register');
      }
    }
  }, [user, profile, loading, pathname, router])

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
          <h1 className="text-xl font-black text-secondary tracking-tight">Techstar Money Solution <span className="text-primary text-sm block font-bold mt-1">DSA Partner</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/partner')
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 hover:text-secondary'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center font-black text-secondary uppercase">
              {partnerPhoto ? (
                <img src={partnerPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.[0] || user.email?.[0] || "P"
              )}
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
        <h1 className="text-lg font-black text-secondary tracking-tight">Techstar Money Solution <span className="text-primary text-xs ml-1">DSA</span></h1>
        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 shadow-inner overflow-hidden flex items-center justify-center font-black text-secondary uppercase text-sm">
          {partnerPhoto ? (
            <img src={partnerPhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            profile?.name?.[0] || user.email?.[0] || "P"
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
          {profile?.dsaStatus && profile.dsaStatus !== "Active" && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={20} />
              <div>
                <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest">Account {profile.dsaStatus}</h3>
                <p className="text-xs font-bold text-rose-500 mt-1">You cannot submit new leads at this time. Please contact Admin for support.</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/partner')
            return (
              <Link 
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
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
