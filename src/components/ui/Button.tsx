import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 font-black uppercase tracking-wider transition-all duration-300',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-950/15 font-black uppercase tracking-wider transition-all duration-300',
      outline: 'border border-slate-200/80 bg-background hover:bg-slate-50 text-foreground hover:border-slate-350 font-bold uppercase tracking-wider transition-all duration-300',
      ghost: 'hover:bg-slate-50 text-foreground font-bold transition-all duration-300',
      accent: 'bg-accent text-accent-foreground hover:bg-amber-600 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 font-black uppercase tracking-wider transition-all duration-300',
    }
    
    const sizes = {
      sm: 'h-9 px-3 text-[10px] font-black',
      md: 'h-11 px-5 text-xs',
      lg: 'h-12 px-6 text-sm font-black',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
