import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 text-left">
        {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-slate-200/60 bg-slate-50/30 hover:bg-slate-50/60 focus:bg-white px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-slate-400 shadow-sm",
            error && "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
