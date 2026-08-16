import crypto from "crypto"

const SALT = "dsa_loan_system_security_salt_2026"
const ITERATIONS = 10000
const KEY_LEN = 64
const DIGEST = "sha512"

/**
 * Hashes a plain-text password using salted PBKDF2 (SHA-512).
 */
export function hashPassword(password: string): string {
  if (!password) return ""
  return crypto.pbkdf2Sync(password, SALT, ITERATIONS, KEY_LEN, DIGEST).toString("hex")
}

/**
 * Verifies an input password against a stored password string.
 * Supports legacy plain-text comparison for backward compatibility.
 */
export function verifyPassword(inputPassword: string, storedPassword?: string): { valid: boolean; isLegacyPlainText: boolean } {
  if (!inputPassword || !storedPassword) {
    return { valid: false, isLegacyPlainText: false }
  }

  const hashedInput = hashPassword(inputPassword)
  if (hashedInput === storedPassword) {
    return { valid: true, isLegacyPlainText: false }
  }

  // Legacy plain-text fallback check
  if (inputPassword === storedPassword) {
    return { valid: true, isLegacyPlainText: true }
  }

  return { valid: false, isLegacyPlainText: false }
}

/**
 * Formats remaining lockout time into human readable format (e.g. "28 minutes" or "18 hours").
 */
export function formatRemainingTime(lockoutUntilMs: number): string {
  const diffMs = lockoutUntilMs - Date.now()
  if (diffMs <= 0) return "0 minutes"

  const minutes = Math.ceil(diffMs / (60 * 1000))
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours === 1 ? "" : "s"}`
}
