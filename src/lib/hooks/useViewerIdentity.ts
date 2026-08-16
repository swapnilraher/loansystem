"use client"

import { useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { EMPTY_VIEWER, ViewerIdentity, viewerIdentity } from "@/lib/permissions"

/**
 * The signed-in staff member's identity, in every id shape the CRM stores.
 *
 * Use this — never a bare `user.uid` — for anything that decides whether a lead,
 * an incentive row or a notification belongs to the person looking at the
 * screen. See the note on `ViewerIdentity`.
 */
export function useViewerIdentity(): ViewerIdentity {
  const { user, profile, staffProfile } = useAuth()

  return useMemo(() => {
    if (!user) return EMPTY_VIEWER
    return viewerIdentity(
      user.uid,
      staffProfile?.uid,
      staffProfile?.id,
      user.email,
      staffProfile?.email,
      profile?.email
    )
  }, [
    user,
    staffProfile?.uid,
    staffProfile?.id,
    staffProfile?.email,
    profile?.email,
  ])
}
