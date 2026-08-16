import { NextResponse } from "next/server"
import { callerOf } from "@/lib/apiAuth"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { hashPassword, verifyPassword } from "@/lib/passwordSecurity"

export async function POST(request: Request) {
  try {
    const caller = await callerOf(request)
    if (!caller || !caller.email) {
      return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "New password must be at least 6 characters." }, { status: 400 })
    }

    const db = getAdminDb()
    const snapshot = await db
      .collection("admin_users")
      .where("email", "==", caller.email)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: "Staff record not found." }, { status: 404 })
    }

    const docRef = snapshot.docs[0].ref
    const staff = snapshot.docs[0].data()

    // Verify current password if provided
    if (currentPassword) {
      const { valid } = verifyPassword(String(currentPassword), staff.password)
      if (!valid) {
        return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 })
      }
    }

    const hashedNew = hashPassword(String(newPassword))

    // Update admin_users document
    await docRef.update({
      password: hashedNew,
      mustChangePassword: false,
      failedAttempts: 0,
      lockoutUntil: null,
      lockoutReason: null,
      updatedAt: new Date().toISOString(),
    })

    // Sync with Firebase Auth
    try {
      const auth = getAdminAuth()
      await auth.updateUser(caller.uid, { password: String(newPassword) })
    } catch (authErr) {
      console.warn("[change-password] Could not update Auth password directly:", authErr)
    }

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error: any) {
    console.error("[change-password] Failed:", error)
    return NextResponse.json({ success: false, error: "Could not update password." }, { status: 500 })
  }
}
