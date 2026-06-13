"use client"
import React from "react"

interface StickyMobileCTAProps {
  targetId: string
  label: string
}

export function StickyMobileCTA({ targetId, label }: StickyMobileCTAProps) {
  const handleClick = () => {
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100/60 dark:border-slate-800/80 z-50">
      <button 
        onClick={handleClick}
        className="w-full h-12 bg-primary hover:bg-emerald-650 text-white font-black uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/15 active:scale-[0.97] transition-all duration-300 cursor-pointer select-none"
      >
        {label}
      </button>
    </div>
  )
}
