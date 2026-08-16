"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  /** Buttons, filters — anything right-aligned on desktop, stacked on mobile. */
  actions?: React.ReactNode
  /** Tab bar or stat strip rendered under the title, above the divider. */
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-1.5">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <ChevronRight size={12} className="text-admin-subtle shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-admin-xs text-admin-muted hover:text-admin-text transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-admin-xs text-admin-subtle">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-admin-xl sm:text-admin-2xl font-semibold text-admin-text tracking-tight truncate">
            {title}
          </h1>
          {subtitle && <p className="text-admin-sm text-admin-muted mt-0.5 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
