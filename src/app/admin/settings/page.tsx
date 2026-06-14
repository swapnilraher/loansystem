"use client"

import React from "react"
import { 
  Settings as SettingsIcon, 
  Building2, 
  CreditCard, 
  Shield, 
  Bell, 
  Globe,
  CheckCircle2,
  Lock,
  Smartphone,
  Users
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Global Settings</h2>
          <p className="text-slate-500 font-medium tracking-tight">Manage your CRM company profile, billing, and system workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Settings Nav */}
        <div className="hidden lg:flex flex-col lg:col-span-1 space-y-2">
          {[
            { name: 'Company Profile', icon: Building2, active: true },
            { name: 'Subscription Plan', icon: CreditCard },
            { name: 'Roles & Security', icon: Shield },
            { name: 'Notification Rules', icon: Bell },
            { name: 'Webhooks & API', icon: Globe },
            { name: 'Mobile App (PWA)', icon: Smartphone },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${item.active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 hover:text-secondary'}`}
            >
              <item.icon size={18} />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile Horizontal Settings Nav */}
        <div className="lg:hidden flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth shrink-0 -mx-4 px-4">
          {[
            { name: 'Company Profile', icon: Building2, active: true },
            { name: 'Subscription Plan', icon: CreditCard },
            { name: 'Roles & Security', icon: Shield },
            { name: 'Notification Rules', icon: Bell },
            { name: 'Webhooks & API', icon: Globe },
            { name: 'Mobile App (PWA)', icon: Smartphone },
          ].map((item, i) => (
            <button 
              key={i}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${item.active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-105 hover:text-secondary'}`}
            >
              <item.icon size={14} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Company Config */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div>
              <h3 className="text-xl font-black text-secondary mb-2">Company Information</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">General business identification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                <input type="text" defaultValue="Techstar Money Solution" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email</label>
                <input type="email" defaultValue="admin@techstar.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Branch</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none">
                  <option>Mumbai Head Office</option>
                  <option>Pune Regional Office</option>
                  <option>Bangalore Sales Branch</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
                <input type="text" defaultValue="INR (₹)" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auto-Assignment</label>
                <div className="flex items-center gap-3 h-full pt-2">
                  <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 italic">Round-Robin Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* SaaS Plan Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg w-fit mb-4">Current Plan</div>
                <h3 className="text-3xl font-black mb-2 italic">Enterprise SaaS</h3>
                <p className="text-slate-400 font-medium">Full access to multi-branch automation & custom APIs.</p>
                <div className="flex items-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    <span className="text-sm font-bold">50 Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-primary" />
                    <span className="text-sm font-bold">10 Branches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-primary" />
                    <span className="text-sm font-bold">256-bit Encryption</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center backdrop-blur-md">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Next Billing Date</p>
                <p className="text-2xl font-black mb-4 tracking-tight">August 15, 2026</p>
                <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
