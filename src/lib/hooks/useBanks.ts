"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query } from "firebase/firestore"

/**
 * Bank master record. Admin-only writes; every other role reads it so the
 * disbursal approval screen can auto-fill the payable amounts.
 *
 * `staffIncentive` is a flat rupee amount per disbursed file.
 * `connectorCommission` is a percentage of the disbursed amount.
 */
export interface Bank {
  id: string
  name: string
  type: string
  /** Flat ₹ paid to the telecaller who closed the file. */
  staffIncentive: number
  /** % of the disbursed amount paid to the DSA / connector who sourced it. */
  connectorCommission: number
  active: boolean
  notes?: string
  createdAt?: any
  updatedAt?: any
}

/** Used before any bank is configured, and for legacy ledger rows. */
export const DEFAULT_CONNECTOR_COMMISSION = 2

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "banks")),
      snapshot => {
        const rows = snapshot.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name || "Unnamed Bank",
            type: data.type || "Personal Loan",
            staffIncentive: Number(data.staffIncentive) || 0,
            connectorCommission: Number(data.connectorCommission) || 0,
            active: data.active !== false,
            notes: data.notes || "",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Bank
        })
        rows.sort((a, b) => a.name.localeCompare(b.name))
        setBanks(rows)
        setLoading(false)
      },
      err => {
        console.error("Error fetching banks:", err)
        setError("Failed to load the bank list.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { banks, loading, error }
}

/** Parses the loosely-typed amounts stored on leads ("450000", 450000, "₹4,50,000"). */
export function toAmount(value: unknown): number {
  if (typeof value === "number") return isFinite(value) ? value : 0
  if (typeof value !== "string") return 0
  const cleaned = value.replace(/[^\d.-]/g, "")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/** Staff incentive for one disbursed file — a flat amount off the bank card. */
export function calcStaffIncentive(bank?: Bank | null): number {
  return Math.round(bank?.staffIncentive || 0)
}

/** Connector commission = configured % of the disbursed amount. */
export function calcConnectorCommission(
  bank: Bank | null | undefined,
  disbursedAmount: number
): number {
  const percentage = bank?.connectorCommission ?? DEFAULT_CONNECTOR_COMMISSION
  return Math.round((disbursedAmount * percentage) / 100)
}

export function formatINR(value: number): string {
  return `₹${Math.round(value || 0).toLocaleString("en-IN")}`
}

/** Compact display for dashboard tiles: ₹12.5L / ₹1.20Cr. */
export function formatINRShort(value: number): string {
  const amount = Math.round(value || 0)
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString("en-IN")}`
}
