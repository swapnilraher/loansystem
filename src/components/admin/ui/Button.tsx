"use client"

import React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "brand" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md"

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-admin-accent text-admin-accent-fg border border-transparent hover:bg-admin-accent-hover",
  /*
   * The partner-facing auth + onboarding flows only. Those screens lead with
   * the marketing brand blue, not the CRM emerald -- see PARTNER BRAND
   * SURFACE in globals.css. Everything inside /admin stays on `primary`.
   */
  brand:
    "bg-brand text-brand-fg border border-transparent hover:bg-brand-hover",
  secondary:
    "bg-admin-surface text-admin-text border border-admin-border hover:bg-admin-surface-2 hover:border-admin-border-strong",
  ghost:
    "bg-transparent text-admin-muted border border-transparent hover:bg-admin-surface-2 hover:text-admin-text",
  danger:
    "bg-tone-danger text-tone-danger-fg border border-tone-danger-bd hover:brightness-95",
}

/**
 * 44px tall on phones, dense on wider screens. Staff drive this CRM with a
 * thumb; a 32px button is below every published touch-target minimum, and these
 * are the buttons that approve disbursals and dial customers.
 */
const SIZES: Record<Size, string> = {
  sm: "h-11 sm:h-8 px-3 sm:px-2.5 text-admin-xs gap-1.5",
  md: "h-11 sm:h-9 px-4 sm:px-3.5 text-admin-sm gap-2",
}

interface BaseProps {
  variant?: Variant
  size?: Size
  icon?: React.ComponentType<{ size?: number; className?: string }>
  loading?: boolean
  className?: string
  children?: React.ReactNode
}

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

/** The only button used inside /admin. Marketing-site Button stays untouched. */
export function AdminButton({
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "admin-focus inline-flex items-center justify-center rounded-admin-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 13 : 15} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 13 : 15} />
      )}
      {children}
    </button>
  )
}

type LinkProps = BaseProps & { href: string }

export function AdminLinkButton({
  href,
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
}: LinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "admin-focus inline-flex items-center justify-center rounded-admin-sm font-semibold whitespace-nowrap transition-colors active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </Link>
  )
}
