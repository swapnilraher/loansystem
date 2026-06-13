"use client"

import React from "react"
import { Search, Bell, Moon, Sun, SearchIcon, Grid, User, Menu } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-4 md:gap-8 flex-1">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:text-primary hover:bg-white/50 rounded-xl transition-all cursor-pointer shadow-sm border border-transparent hover:border-slate-200"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search leads, users, transactions..."
            className="block w-full pl-11 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>

        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <Grid size={20} />
        </button>

        <div className="w-px h-8 bg-slate-200 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-secondary">Alex Johnson</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee #482</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
            <User size={20} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
