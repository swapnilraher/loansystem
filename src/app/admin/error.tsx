"use client"

import React, { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin route error:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-admin-bg">
      <div className="w-14 h-14 rounded-admin-lg bg-tone-danger/15 border border-tone-danger-bd text-tone-danger-fg flex items-center justify-center shadow-lg">
        <AlertTriangle size={28} />
      </div>
      <div className="max-w-md space-y-1.5">
        <h2 className="text-admin-lg font-bold text-admin-text">Something went wrong while loading this page</h2>
        <p className="text-admin-xs text-admin-muted">
          {error?.message || "An unexpected error occurred while loading dashboard records."}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="py-2 px-4 bg-admin-surface border border-admin-border hover:bg-admin-surface-2 text-admin-text text-admin-xs font-bold rounded-admin shadow-admin-1 transition-colors"
        >
          Reload Page
        </button>
        <button
          onClick={() => reset()}
          className="py-2 px-4 bg-admin-accent hover:bg-admin-accent-hover text-white text-admin-xs font-bold rounded-admin shadow-admin-1 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    </div>
  )
}
