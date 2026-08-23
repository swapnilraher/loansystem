"use client"

/**
 * Marketing-site eligibility wizard.
 *
 * NOTE ON BOOTSTRAP — this renders inside the marketing shell (via
 * `ui/DynamicSections`), where Bootstrap is deliberately still in play. It must
 * NOT carry `partner-root`: that marker is matched as
 * `body:not(:has(.partner-root))`, so mounting it here would switch Bootstrap
 * off for the whole marketing page rather than just this section.
 *
 * So this file uses the admin tokens (Bootstrap declares none of them) while
 * avoiding every utility Bootstrap also declares `!important`:
 *   - `p-*`/`m-*`/`gap-*` integers 0–5   -> use 6+, `.5` steps, or `space-y-*`
 *   - bare `border` / `rounded` / `shadow` -> `border-[1px]`, `rounded-admin*`,
 *     `shadow-admin-*`
 * `AdminButton` is deliberately not reused here for the same reason: its
 * `px-4`, `gap-2` and `border` are all names Bootstrap overrides.
 *
 * The `dark:` variants the previous version carried were dead: ThemeContext
 * strips `.dark` on mount, so the marketing site is light-only.
 */

import React, { useState } from "react"
import Link from "next/link"
import { motion as motionFramer } from "framer-motion"
import { Sparkles, ArrowRight, ArrowLeft, Coins, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, title: "Loan Requirement" },
  { id: 2, title: "Employment & Salary" },
  { id: 3, title: "Credit Score & City" },
] as const

const CITIES = [
  "Mumbai", "Pune", "Delhi / NCR", "Bangalore", "Hyderabad",
  "Kolkata", "Chennai", "Ahmedabad", "Other",
] as const

const LOAN_TYPES = ["personal", "home", "business"] as const
const EMPLOYMENTS = [
  { id: "salaried", label: "Salaried", desc: "Paid a monthly salary into a bank account" },
  { id: "self_employed", label: "Self-employed", desc: "Own a business or professional practice" },
] as const
const CIBIL_RANGES = ["750+", "700-749", "650-699", "<650"] as const

type LoanType = (typeof LOAN_TYPES)[number]
type Employment = (typeof EMPLOYMENTS)[number]["id"]
type Cibil = (typeof CIBIL_RANGES)[number]

/** Approval bands map onto the shared tone families, not ad-hoc colours. */
const ODDS_TONE = {
  Excellent: "bg-tone-success text-tone-success-fg border-tone-success-bd",
  Good: "bg-tone-success text-tone-success-fg border-tone-success-bd",
  Medium: "bg-tone-warn text-tone-warn-fg border-tone-warn-bd",
  Low: "bg-tone-danger text-tone-danger-fg border-tone-danger-bd",
} as const

/** A selectable card/pill. Every option control on this screen uses it. */
function Choice({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "admin-focus min-h-11 rounded-admin border-[1px] text-admin-sm! font-semibold! transition-colors cursor-pointer",
        selected
          ? "bg-admin-accent-soft border-admin-accent text-admin-accent!"
          : "bg-admin-surface-2 border-admin-border text-admin-muted! hover:text-admin-text! hover:border-admin-border-strong",
        className
      )}
    >
      {children}
    </button>
  )
}

/** Labelled range input with its live value. */
function SliderRow({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string
  display: string
  min: number
  max: number
  step: number
  value: number
  onChange: (n: number) => void
  minLabel: string
  maxLabel: string
}) {
  const id = `slider-${label.replace(/\W+/g, "-").toLowerCase()}`
  return (
    <div className="bg-admin-surface-2 border-[1px] border-admin-border rounded-admin px-6 py-6">
      <div className="flex justify-between items-center gap-2.5 mb-3.5">
        <label htmlFor={id} className="text-admin-sm! font-semibold! text-admin-text!">
          {label}
        </label>
        <span className="admin-num text-admin-sm! font-semibold! text-admin-accent! bg-admin-surface border-[1px] border-admin-border rounded-full px-2.5 py-0.5">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="admin-focus w-full h-2 bg-admin-surface-3 rounded-full appearance-none cursor-pointer accent-admin-accent"
      />
      <div className="flex justify-between text-admin-2xs! text-admin-subtle! mt-1.5 admin-num">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

export function EligibilityWizard() {
  const [step, setStep] = useState(1)
  const [loanType, setLoanType] = useState<LoanType>("personal")
  const [amount, setAmount] = useState(1000000) // Default 10 L
  const [employment, setEmployment] = useState<Employment>("salaried")
  const [income, setIncome] = useState(50000) // Default 50k
  const [emis, setEmis] = useState(0) // Existing EMIs
  const [cibil, setCibil] = useState<Cibil>("750+")
  const [city, setCity] = useState("Pune")

  // Results generation logic
  const calculateResult = () => {
    // Basic DSR calculation (Debt-to-Service Ratio)
    const disposableIncome = income - emis
    const maxAffordableEMI = disposableIncome * 0.5

    // Estimated Interest Rate based on CIBIL
    let baseRate = 10.49
    if (loanType === "home") baseRate = 8.5
    if (loanType === "business") baseRate = 14.0

    let rateAdj = 0
    if (cibil === "700-749") rateAdj = 0.5
    else if (cibil === "650-699") rateAdj = 1.5
    else if (cibil === "<650") rateAdj = 3.0

    const finalRate = baseRate + rateAdj

    // Approval odds calculation
    let odds: "Low" | "Medium" | "Good" | "Excellent" = "Good"

    if (cibil === "750+" && disposableIncome > 20000) {
      odds = "Excellent"
    } else if (cibil === "<650" || disposableIncome < 15000) {
      odds = "Low"
    } else if (cibil === "650-699" || disposableIncome < 30000) {
      odds = "Medium"
    }

    // EMI estimation for the loan amount
    const P = amount
    const r = finalRate / 12 / 100
    const n = 5 * 12 // 5 years fixed
    const estimatedEMI = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))

    return { rate: finalRate.toFixed(2), emi: estimatedEMI, odds, maxAffordableEMI }
  }

  const results = calculateResult()

  // Match best lenders
  const getMatchedLenders = () => {
    if (loanType === "home") {
      return [
        { name: "HDFC Bank", rate: results.rate, speed: "2 Days", doc: "Standard" },
        { name: "SBI", rate: (Number(results.rate) - 0.2).toFixed(2), speed: "4 Days", doc: "Detailed" },
      ]
    } else if (loanType === "business") {
      return [
        { name: "Tata Capital", rate: results.rate, speed: "24 Hours", doc: "Minimal" },
        { name: "Bajaj Finance", rate: (Number(results.rate) + 0.5).toFixed(2), speed: "12 Hours", doc: "Minimal" },
      ]
    } else {
      return [
        { name: "ICICI Bank", rate: results.rate, speed: "2 Hours", doc: "Minimal" },
        { name: "Axis Bank", rate: (Number(results.rate) - 0.1).toFixed(2), speed: "4 Hours", doc: "Standard" },
      ]
    }
  }

  const matchedLenders = getMatchedLenders()

  return (
    <section className="py-12 md:py-16 bg-admin-bg relative">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <span className="inline-block text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-accent! bg-admin-accent-soft border-[1px] border-admin-border rounded-full px-3.5 py-1">
            Lender Match
          </span>
          <h2 className="text-admin-2xl! md:text-admin-2xl! font-semibold! text-admin-text! mt-3.5 tracking-tight">
            Smart loan eligibility wizard
          </h2>
          <p className="text-admin-sm! text-admin-muted! mt-1.5 max-w-xl mx-auto">
            Find out your approval chance and get matched with lenders in under two minutes.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-admin-surface border-[1px] border-admin-border rounded-admin-lg shadow-admin-2 px-6 py-6 md:px-8 md:py-8">
          {/* Progress header */}
          <div
            className="flex justify-between items-start max-w-xl mx-auto relative mb-8"
            role="list"
            aria-label="Progress"
          >
            <span
              aria-hidden
              className="absolute top-4 left-0 right-0 h-px bg-admin-border -translate-y-1/2"
            />
            {STEPS.map(s => {
              const done = step > s.id
              const now = step === s.id
              return (
                <div
                  key={s.id}
                  role="listitem"
                  aria-current={now ? "step" : undefined}
                  className="relative z-10 flex flex-col items-center"
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-admin-xs! font-semibold! border-[1px] transition-colors",
                      now && "bg-admin-accent border-admin-accent text-admin-accent-fg!",
                      done && "bg-admin-accent-soft border-admin-accent text-admin-accent!",
                      !now && !done && "bg-admin-surface border-admin-border text-admin-subtle!"
                    )}
                  >
                    {done ? <Check size={14} /> : s.id}
                  </span>
                  <span className="hidden sm:block text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle! mt-1.5 text-center">
                    {s.title}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Reserved height keeps the nav row from jumping between steps. */}
          <div className="min-h-[250px]">
            {step === 1 && (
              <motionFramer.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div
                  role="radiogroup"
                  aria-label="What kind of loan do you need?"
                  className="space-y-3.5"
                >
                  <span className="block text-admin-sm! font-semibold! text-admin-text!">
                    What kind of loan do you need?
                  </span>
                  <div className="grid grid-cols-3 gap-3.5">
                    {LOAN_TYPES.map(type => (
                      <Choice
                        key={type}
                        selected={loanType === type}
                        onClick={() => setLoanType(type)}
                        className="flex flex-col items-center justify-center gap-2.5 px-2.5 py-6 capitalize"
                      >
                        <Coins size={24} />
                        <span>{type} loan</span>
                      </Choice>
                    ))}
                  </div>
                </div>

                <SliderRow
                  label="Required amount"
                  display={`₹${(amount / 100000).toFixed(1)} Lacs`}
                  min={100000}
                  max={5000000}
                  step={50000}
                  value={amount}
                  onChange={setAmount}
                  minLabel="₹1 Lac"
                  maxLabel="₹50 Lacs"
                />
              </motionFramer.div>
            )}

            {step === 2 && (
              <motionFramer.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div role="radiogroup" aria-label="Employment type" className="space-y-3.5">
                  <span className="block text-admin-sm! font-semibold! text-admin-text!">
                    What is your employment type?
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {EMPLOYMENTS.map(emp => (
                      <Choice
                        key={emp.id}
                        selected={employment === emp.id}
                        onClick={() => setEmployment(emp.id)}
                        className="flex flex-col items-start gap-1 text-left px-3.5 py-3.5"
                      >
                        <span>{emp.label}</span>
                        <span className="text-admin-xs! font-normal! text-admin-subtle!">
                          {emp.desc}
                        </span>
                      </Choice>
                    ))}
                  </div>
                </div>

                <SliderRow
                  label="Monthly net income"
                  display={`₹${income.toLocaleString("en-IN")}`}
                  min={15000}
                  max={300000}
                  step={5000}
                  value={income}
                  onChange={setIncome}
                  minLabel="₹15K"
                  maxLabel="₹3 Lacs+"
                />

                <SliderRow
                  label="Existing monthly EMIs"
                  display={`₹${emis.toLocaleString("en-IN")}`}
                  min={0}
                  max={100000}
                  step={2000}
                  value={emis}
                  onChange={setEmis}
                  minLabel="₹0"
                  maxLabel="₹1 Lac"
                />
              </motionFramer.div>
            )}

            {step === 3 && (
              <motionFramer.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div role="radiogroup" aria-label="Credit score range" className="space-y-3.5">
                  <span className="block text-admin-sm! font-semibold! text-admin-text!">
                    Select your credit score (CIBIL) range
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {CIBIL_RANGES.map(range => (
                      <Choice
                        key={range}
                        selected={cibil === range}
                        onClick={() => setCibil(range)}
                        className="admin-num px-2.5"
                      >
                        {range}
                      </Choice>
                    ))}
                  </div>
                </div>

                <div role="radiogroup" aria-label="Current city" className="space-y-3.5">
                  <span className="block text-admin-sm! font-semibold! text-admin-text!">
                    Select your current city
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {CITIES.map(c => (
                      <Choice
                        key={c}
                        selected={city === c}
                        onClick={() => setCity(c)}
                        className="px-3.5 text-admin-xs!"
                      >
                        {c}
                      </Choice>
                    ))}
                  </div>
                </div>
              </motionFramer.div>
            )}

            {step === 4 && (
              <motionFramer.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
              >
                {/* Result panel */}
                <div className="bg-admin-surface-2 border-[1px] border-admin-border rounded-admin px-6 py-6 text-center space-y-3.5">
                  <h3 className="text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle!">
                    Estimated eligibility
                  </h3>
                  <div>
                    <p className="text-admin-2xs! text-admin-subtle! mb-1">Estimated monthly EMI</p>
                    <p className="admin-num text-admin-2xl! font-semibold! text-admin-accent!">
                      ₹{results.emi.toLocaleString("en-IN")}
                    </p>
                    <p className="text-admin-2xs! text-admin-subtle! mt-1.5">
                      Calculated over a 5-year tenure
                    </p>
                  </div>

                  <div className="pt-3.5 border-t-[1px] border-admin-border flex justify-center items-center gap-2.5">
                    <span className="text-admin-xs! text-admin-muted!">Approval odds</span>
                    <span
                      className={cn(
                        "text-admin-2xs! font-semibold! uppercase tracking-wide py-1 px-2.5 rounded-full border-[1px]",
                        ODDS_TONE[results.odds]
                      )}
                    >
                      {results.odds}
                    </span>
                  </div>

                  <p className="text-admin-xs! text-admin-muted!">
                    Estimated interest rate{" "}
                    <span className="admin-num font-semibold! text-admin-text!">
                      {results.rate}% p.a.
                    </span>
                  </p>
                </div>

                {/* Matched lenders */}
                <div className="space-y-3.5">
                  <h3 className="flex items-center gap-1.5 text-admin-2xs! font-semibold! uppercase tracking-wide text-admin-subtle!">
                    <Sparkles size={13} className="text-admin-accent!" /> Best matched lenders
                  </h3>

                  <div className="space-y-2.5">
                    {matchedLenders.map(lender => (
                      <div
                        key={lender.name}
                        className="px-3.5 py-3.5 bg-admin-surface border-[1px] border-admin-border rounded-admin shadow-admin-1 flex items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-10 h-10 shrink-0 rounded-full bg-admin-accent-soft text-admin-accent! flex items-center justify-center text-admin-sm! font-semibold!">
                            {lender.name.substring(0, 2)}
                          </span>
                          <span className="block min-w-0">
                            <span className="block text-admin-sm! font-semibold! text-admin-text! truncate">
                              {lender.name}
                            </span>
                            <span className="block text-admin-2xs! text-admin-subtle!">
                              Disbursal in {lender.speed}
                            </span>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="admin-num text-admin-sm! font-semibold! text-admin-accent!">
                            {lender.rate}%
                          </p>
                          <p className="text-admin-2xs! text-admin-subtle!">Docs: {lender.doc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/personal-loan"
                    className="admin-focus w-full min-h-11 rounded-admin-sm bg-admin-accent text-admin-accent-fg! flex items-center justify-center gap-2.5 text-admin-sm! font-semibold! transition-colors hover:bg-admin-accent-hover"
                  >
                    Request an instant callback <ArrowRight size={15} />
                  </Link>
                </div>
              </motionFramer.div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-3.5 pt-6 mt-6 border-t-[1px] border-admin-border">
            {step > 1 && step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="admin-focus inline-flex items-center gap-2.5 min-h-11 px-3.5 rounded-admin-sm text-admin-sm! font-semibold! text-admin-muted! hover:text-admin-text! transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="admin-focus inline-flex items-center gap-2.5 min-h-11 px-6 rounded-admin-sm bg-admin-accent text-admin-accent-fg! text-admin-sm! font-semibold! transition-colors hover:bg-admin-accent-hover cursor-pointer"
              >
                {step === 3 ? "Calculate odds" : "Continue"} <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="admin-focus inline-flex items-center min-h-11 px-3.5 rounded-admin-sm text-admin-sm! font-semibold! text-admin-accent! hover:underline cursor-pointer"
              >
                Reset calculation
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
