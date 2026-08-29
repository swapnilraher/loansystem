import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { mobileNumber, applicationId, fullName, email, panNumber, partnerType, firmType, addressLine1, addressLine2, city, stateName, pinCode, isGstRegistered, gstin, bankDetails } = payload

    if (!mobileNumber && !applicationId) {
      return NextResponse.json({ error: "Mobile number or Application ID is required" }, { status: 400 })
    }

    const db = getAdminDb()
    const docId = mobileNumber || applicationId

    const docRef = db.collection("partner_applications").doc(docId)
    const userRef = db.collection("users").doc(docId)

    const now = new Date()

    const updateFields: Record<string, any> = {
      updatedAt: now,
    }

    if (fullName !== undefined) updateFields.fullName = fullName
    if (email !== undefined) updateFields.email = email
    if (panNumber !== undefined) updateFields.panNumber = panNumber
    if (partnerType !== undefined) updateFields.partnerType = partnerType
    if (firmType !== undefined) updateFields.firmType = firmType
    if (addressLine1 !== undefined) updateFields.addressLine1 = addressLine1
    if (addressLine2 !== undefined) updateFields.addressLine2 = addressLine2
    if (city !== undefined) updateFields.city = city
    if (stateName !== undefined) updateFields.stateName = stateName
    if (pinCode !== undefined) updateFields.pinCode = pinCode
    if (isGstRegistered !== undefined) updateFields.isGstRegistered = isGstRegistered
    if (gstin !== undefined) updateFields.gstin = gstin
    if (bankDetails !== undefined) updateFields.bankDetails = bankDetails

    // Update partner_applications
    await docRef.set(updateFields, { merge: true })

    // Update users collection
    const userUpdateFields: Record<string, any> = {
      updatedAt: now,
    }
    if (fullName !== undefined) userUpdateFields.fullName = fullName
    if (email !== undefined) userUpdateFields.email = email
    if (panNumber !== undefined) {
      userUpdateFields.panData = {
        panNumber,
        status: "verified",
      }
    }
    if (bankDetails !== undefined) userUpdateFields.bankDetails = bankDetails
    if (addressLine1 !== undefined || city !== undefined || stateName !== undefined) {
      userUpdateFields.address = {
        line1: addressLine1 || "",
        line2: addressLine2 || "",
        city: city || "",
        state: stateName || "",
        pincode: pinCode || "",
      }
    }

    await userRef.set(userUpdateFields, { merge: true })

    // Also update by mobile search in users if keyed by UID
    const userQuery = await db.collection("users").where("mobileNumber", "==", docId).get()
    userQuery.forEach((uSnap) => {
      uSnap.ref.set(userUpdateFields, { merge: true })
    })

    return NextResponse.json({
      success: true,
      message: "Partner application details updated successfully by Admin",
    })
  } catch (error: any) {
    console.error("Admin Edit Application Error:", error)
    return NextResponse.json({ error: "Failed to update application details." }, { status: 500 })
  }
}
