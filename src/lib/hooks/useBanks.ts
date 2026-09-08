"use client"

import { useMemo } from "react"
import { usePolledResource, POLL_NORMAL } from "@/lib/hooks/usePolledResource"

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

/** As stored: every field is optional until an Admin has filled the card in. */
type BankRow = Partial<Bank> & { id: string }

export function useBanks() {
  const { data, loading, error, refresh } = usePolledResource<{ banks: BankRow[] }>(
    "/api/banks",
    POLL_NORMAL
  )

  const banks = useMemo(() => {
    const rows = (data?.banks || []).map(
      bank =>
        ({
          id: bank.id,
          name: bank.name || "Unnamed Bank",
          type: bank.type || "Personal Loan",
          staffIncentive: Number(bank.staffIncentive) || 0,
          connectorCommission: Number(bank.connectorCommission) || 0,
          active: bank.active !== false,
          notes: bank.notes || "",
          createdAt: bank.createdAt,
          updatedAt: bank.updatedAt,
        }) as Bank
    )
    rows.sort((a, b) => a.name.localeCompare(b.name))
    return rows
  }, [data])

  return {
    banks,
    loading,
    error: error ? "Failed to load the bank list." : null,
    /** Call after creating or editing a bank so the list does not wait for the next poll. */
    refresh,
  }
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
