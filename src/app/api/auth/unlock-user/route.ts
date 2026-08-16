import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/apiAuth"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { userId, email } = await request.json()
    if (!userId && !email) {
      return NextResponse.json({ success: false, error: "Missing userId or email." }, { status: 400 })
    }

    const db = getAdminDb()
    let docRef

    if (userId) {
      docRef = db.collection("admin_users").doc(userId)
    } else {
      const snap = await db.collection("admin_users").where("email", "==", email).limit(1).get()
      if (snap.empty) {
        return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 })
      }
      docRef = snap.docs[0].ref
    }

    await docRef.update({
      lockoutUntil: null,
      lockoutReason: null,
      failedAttempts: 0,
      lockoutLevel: 0,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: "Account unlocked successfully." })
  } catch (error: any) {
    console.error("[unlock-user] Failed:", error)
    return NextResponse.json({ success: false, error: "Could not unlock account." }, { status: 500 })
  }
}
