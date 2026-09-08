import { guarded, rows, ANY_STAFF, ADMIN_ONLY } from "@/lib/apiCollection"

/**
 * The bank master list.
 *
 * Every role reads it — the disbursal screen auto-fills payable amounts from these
 * records — but only an Admin may change one, because `staffIncentive` and
 * `connectorCommission` decide what the business pays out.
 */

export async function GET(request: Request) {
  return guarded(request, ANY_STAFF, async ({ db }) => {
    const snap = await db.collection("banks").get()
    const banks = rows(snap).sort((a: any, b: any) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    )
    return { banks }
  })
}

export async function POST(request: Request) {
  return guarded<{ bank?: Record<string, unknown> }>(request, ADMIN_ONLY, async ({ db, body }) => {
    const bank = body.bank || {}
    const ref = await db.collection("banks").add({
      name: String(bank.name || "").trim(),
      type: String(bank.type || "Personal Loan"),
      staffIncentive: Number(bank.staffIncentive) || 0,
      connectorCommission: Number(bank.connectorCommission) || 0,
      active: bank.active !== false,
      notes: String(bank.notes || ""),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: ref.id }
  })
}

export async function PATCH(request: Request) {
  return guarded<{ id?: string; bank?: Record<string, unknown> }>(
    request,
    ADMIN_ONLY,
    async ({ db, body }) => {
      const id = String(body.id || "").trim()
      if (!id) throw new Error("A bank id is required.")

      const bank = body.bank || {}
      const update: Record<string, unknown> = { updatedAt: new Date() }
      // Only the fields actually sent are written, so a partial edit from one screen
      // cannot blank a field another screen owns.
      if (bank.name !== undefined) update.name = String(bank.name).trim()
      if (bank.type !== undefined) update.type = String(bank.type)
      if (bank.staffIncentive !== undefined) update.staffIncentive = Number(bank.staffIncentive) || 0
      if (bank.connectorCommission !== undefined) {
        update.connectorCommission = Number(bank.connectorCommission) || 0
      }
      if (bank.active !== undefined) update.active = bank.active !== false
      if (bank.notes !== undefined) update.notes = String(bank.notes)

      await db.collection("banks").doc(id).update(update)
      return { id }
    }
  )
}

export async function DELETE(request: Request) {
  return guarded(request, ADMIN_ONLY, async ({ db, url }) => {
    const id = String(url.searchParams.get("id") || "").trim()
    if (!id) throw new Error("A bank id is required.")
    await db.collection("banks").doc(id).delete()
    return { id }
  })
}
