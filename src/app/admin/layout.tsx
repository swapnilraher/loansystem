import React, { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, adminRole, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user || !adminRole) {
        // Not logged in or not an admin, boot them
        router.push("/")
      }
    }
  }, [user, adminRole, loading, router])

  if (loading || !adminRole) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Verifying Permissions...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <div className="flex-1 ml-72">
        <AdminHeader />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
