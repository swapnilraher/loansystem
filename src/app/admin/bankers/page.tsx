"use client"

/**
 * The banker directory, maintained by hand.
 *
 * Every banker the lead screen's lookup can find is listed here, whether they
 * came from the shipped file or were added in the CRM — one row per person per
 * district, not per product, so changing a mobile number is one edit rather than
 * a dozen.
 *
 * Admin only, three deep: the route guard on navigation, this check on render,
 * and `requireAdmin` on every write in `/api/admin/bankers`.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Building2, EyeOff, Pencil, Phone, MessageSquare, Plus, Save, Search, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { authedFetch, authedJson } from "@/lib/authedFetch"
import {
  AdminButton,
  EmptyState,
  PageHeader,
  Sheet,
  SkeletonRows,
  useToast,
} from "@/components/admin/ui"

interface Banker {
  id: string
  state: string
  district: string
  bank: string
  branch: string
  name: string
  mobile: string
  products: string[]
  active: boolean
  edited: boolean
  updatedByName?: string
}

const EMPTY: Banker = {
  id: "",
  state: "Maharashtra",
  district: "",
  bank: "",
  branch: "",
  name: "",
  mobile: "",
  products: [],
  active: true,
  edited: true,
}

const fieldClass =
  "w-full rounded-admin-sm border border-admin-border bg-admin-surface px-3 py-2 text-admin-sm text-admin-text outline-none focus:border-admin-accent"

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <span className="text-admin-xs font-semibold uppercase tracking-wide text-admin-muted">
        {children}
      </span>
      {hint && <p className="text-admin-xs text-admin-subtle mt-0.5 normal-case">{hint}</p>}
    </div>
  )
}

/**
 * State → District → Bank → Branch, each list fetched from what the directory
 * already holds for the level above.
 *
 * Every level also accepts a typed value: the whole point of this screen is
 * adding bankers the directory does not have yet, and a closed dropdown could
 * never add the first banker in a new district.
 */
function CascadeSelect({
  label,
  hint,
  value,
  options,
  loading,
  disabled,
  placeholder,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  options: string[]
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
}) {
  const [allowCustom, setAllowCustom] = useState(false)
  const isValueCustom = Boolean(value && options.length > 0 && !options.includes(value))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label hint={hint}>{label}</Label>
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => setAllowCustom(!allowCustom)}
            className="text-[10px] text-admin-accent hover:underline font-medium cursor-pointer"
          >
            {allowCustom ? "Select from list" : "+ Type custom"}
          </button>
        )}
      </div>

      {allowCustom || isValueCustom ? (
        <input
          className={fieldClass}
          value={value}
          disabled={disabled}
          placeholder={loading ? "Loading…" : placeholder || `Type ${label}...`}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <select
          className={fieldClass}
          value={value}
          disabled={disabled || loading}
          onChange={e => {
            if (e.target.value === "__CUSTOM__") {
              setAllowCustom(true)
              onChange("")
            } else {
              onChange(e.target.value)
            }
          }}
        >
          <option value="">{loading ? "Loading options..." : placeholder || `-- Select ${label} --`}</option>
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="__CUSTOM__">+ Type custom {label}...</option>
        </select>
      )}
    </div>
  )
}

function BankerEditor({
  banker,
  open,
  products,
  onClose,
  onSaved,
}: {
  banker: Banker
  open: boolean
  products: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<Banker>(banker)
  const [saving, setSaving] = useState(false)

  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [banks, setBanks] = useState<string[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null)

  const [seeded, setSeeded] = useState(banker.id)
  if (banker.id !== seeded) {
    setSeeded(banker.id)
    setDraft(banker)
  }

  const patch = (updates: Partial<Banker>) => setDraft(d => ({ ...d, ...updates }))

  useEffect(() => {
    let cancelled = false
    authedFetch("/api/admin/bankers?action=metadata")
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) setStates(data.states || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // District list follows the state, and is cleared when the state changes so a
  // banker can never be saved into a district that state does not have.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!draft.state) {
        setDistricts([])
        return
      }
      setLoadingLevel("district")
      try {
        const res = await authedFetch(
          `/api/admin/bankers?action=cities&state=${encodeURIComponent(draft.state)}`
        )
        const data = await res.json()
        if (!cancelled && data.success) setDistricts(data.cities || [])
      } catch {
        // An unreachable list is not an error worth a toast: the field still
        // accepts a typed district, which is how a new area gets added at all.
      } finally {
        if (!cancelled) setLoadingLevel(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [draft.state])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!draft.state || !draft.district) {
        setBanks([])
        return
      }
      setLoadingLevel("bank")
      try {
        const res = await authedFetch(
          `/api/admin/bankers?action=lenders&state=${encodeURIComponent(
            draft.state
          )}&city=${encodeURIComponent(draft.district)}`
        )
        const data = await res.json()
        if (!cancelled && data.success) setBanks(data.lenders || [])
      } catch {
        // See above — a typed bank name is still accepted.
      } finally {
        if (!cancelled) setLoadingLevel(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [draft.state, draft.district])

  useEffect(() => {
    let cancelled = false
    if (!draft.bank) {
      // Cleared in a microtask so the effect body itself sets no state.
      Promise.resolve().then(() => {
        if (!cancelled) setBranches([])
      })
      return () => {
        cancelled = true
      }
    }
    authedFetch(
      `/api/admin/bankers?action=branches&state=${encodeURIComponent(
        draft.state
      )}&city=${encodeURIComponent(draft.district)}&lender=${encodeURIComponent(draft.bank)}`
    )
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) setBranches(data.branches || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [draft.state, draft.district, draft.bank])

  const problems: string[] = []
  if (!draft.name.trim()) problems.push("Banker name")
  if (!draft.state.trim()) problems.push("State")
  if (!draft.district.trim()) problems.push("District")
  if (!draft.bank.trim()) problems.push("Bank")
  if (draft.products.length === 0) problems.push("At least one loan product")

  const save = async () => {
    setSaving(true)
    try {
      const res = await authedJson(
        "/api/admin/bankers",
        draft.id ? "PATCH" : "POST",
        draft
      )
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.push({
        tone: "success",
        title: draft.id ? "Banker updated" : "Banker added",
      })
      onSaved()
      onClose()
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not save the banker",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="md"
      title={banker.id ? "Edit banker" : "Add banker"}
      description="Pick the state first — each list is built from the bankers already in that area."
      footer={
        <div className="flex items-center justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Save}
            loading={saving}
            disabled={problems.length > 0}
            onClick={save}
          >
            {banker.id ? "Save changes" : "Add banker"}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <CascadeSelect
          label="State"
          value={draft.state}
          options={states}
          placeholder="e.g. Maharashtra"
          onChange={state =>
            // District and bank belonged to the old state — clearing them is the
            // only way this cascade can stay truthful.
            patch({ state, district: "", bank: "", branch: "" })
          }
        />
        <CascadeSelect
          label="District"
          value={draft.district}
          options={districts}
          loading={loadingLevel === "district"}
          disabled={!draft.state}
          placeholder={draft.state ? "e.g. Pune" : "Select a state first"}
          onChange={district => patch({ district, bank: "", branch: "" })}
        />
        <CascadeSelect
          label="Bank / NBFC"
          value={draft.bank}
          options={banks}
          loading={loadingLevel === "bank"}
          disabled={!draft.district}
          placeholder={draft.district ? "e.g. HDFC" : "Select a district first"}
          onChange={bank => patch({ bank, branch: "" })}
        />
        <CascadeSelect
          label="Branch"
          hint="Optional. Type a new branch if it is not in the list."
          value={draft.branch}
          options={branches}
          disabled={!draft.bank}
          placeholder={draft.bank ? "e.g. Shivajinagar" : "Select a bank first"}
          onChange={branch => patch({ branch })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Banker name</Label>
            <input
              className={fieldClass}
              value={draft.name}
              placeholder="Full name"
              onChange={e => patch({ name: e.target.value })}
            />
          </div>
          <div>
            <Label>Mobile number</Label>
            <input
              className={fieldClass}
              value={draft.mobile}
              inputMode="tel"
              placeholder="10-digit number"
              onChange={e => patch({ mobile: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label hint="Which products this banker handles. The lead screen's lookup filters on these.">
            Loan products
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {products.map(product => {
              const on = draft.products.includes(product)
              return (
                <button
                  key={product}
                  type="button"
                  onClick={() =>
                    patch({
                      products: on
                        ? draft.products.filter(p => p !== product)
                        : [...draft.products, product],
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-admin-sm text-admin-xs font-semibold border transition-colors ${
                    on
                      ? "bg-admin-accent text-admin-accent-fg border-transparent"
                      : "border-admin-border text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {product}
                </button>
              )
            })}
          </div>
        </div>

        {problems.length > 0 && (
          <p className="text-admin-xs text-admin-muted">Still needed: {problems.join(", ")}.</p>
        )}
      </div>
    </Sheet>
  )
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | "gap")[] = [1]
  if (current > 3) pages.push("gap")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push("gap")
  pages.push(total)
  return pages
}

export default function BankerDirectoryPage() {
  const { role, loading: authLoading } = useAuth()
  const toast = useToast()

  const [states, setStates] = useState<string[]>([])
  const [products, setProducts] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [banks, setBanks] = useState<string[]>([])

  const [selectedState, setSelectedState] = useState<string>("Maharashtra")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  const [bankers, setBankers] = useState<Banker[]>([])
  const [total, setTotal] = useState<number>(0)

  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [loadingBankers, setLoadingBankers] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const [editing, setEditing] = useState<Banker | null>(null)
  const [hiding, setHiding] = useState<Banker | null>(null)
  const [busy, setBusy] = useState(false)

  const isAdmin = role === "Admin"

  // 1. Fetch metadata (States & Products)
  useEffect(() => {
    authedFetch("/api/admin/bankers?action=metadata")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStates(data.states || [])
          setProducts(data.products || [])
        }
      })
      .catch(() => {})
  }, [])

  // 2. Fetch Cities for selectedState ONLY
  useEffect(() => {
    if (!selectedState) {
      setCities([])
      setSelectedCity("")
      return
    }
    let cancelled = false
    setLoadingCities(true)
    authedFetch(`/api/admin/bankers?action=cities&state=${encodeURIComponent(selectedState)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) {
          setCities(data.cities || [])
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCities(false)
      })
    return () => { cancelled = true }
  }, [selectedState])

  // 3. Fetch Banks for selectedState + selectedCity ONLY
  useEffect(() => {
    if (!selectedState || !selectedCity) {
      setBanks([])
      setSelectedBank("")
      return
    }
    let cancelled = false
    setLoadingBanks(true)
    authedFetch(
      `/api/admin/bankers?action=lenders&state=${encodeURIComponent(
        selectedState
      )}&city=${encodeURIComponent(selectedCity)}`
    )
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.success) {
          setBanks(data.lenders || [])
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBanks(false)
      })
    return () => { cancelled = true }
  }, [selectedState, selectedCity])

  const handleStateChange = (val: string) => {
    setSelectedState(val)
    setSelectedCity("")
    setSelectedBank("")
    setBankers([])
    setHasFetched(false)
    setCurrentPage(1)
  }

  const handleCityChange = (val: string) => {
    setSelectedCity(val)
    setSelectedBank("")
    setBankers([])
    setHasFetched(false)
    setCurrentPage(1)
  }

  const handleBankChange = (val: string) => {
    setSelectedBank(val)
    setBankers([])
    setHasFetched(false)
    setCurrentPage(1)
  }

  const handleProductChange = (val: string) => {
    setSelectedProduct(val)
    setBankers([])
    setHasFetched(false)
    setCurrentPage(1)
  }

  // 4. Fetch Bankers on "Get Details" Click
  const handleGetDetails = useCallback(async () => {
    setLoadingBankers(true)
    setCurrentPage(1)
    try {
      const params = new URLSearchParams({ action: "directory", limit: "500" })
      if (selectedState) params.set("state", selectedState)
      if (selectedCity) params.set("district", selectedCity)
      if (selectedBank) params.set("bank", selectedBank)
      if (selectedProduct) params.set("product", selectedProduct)
      if (search.trim()) params.set("search", search.trim())

      const res = await authedFetch(`/api/admin/bankers?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Could not load bankers")
      setBankers(data.bankers || [])
      setTotal(data.total || 0)
      setHasFetched(true)
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not load the banker directory",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoadingBankers(false)
    }
  }, [selectedState, selectedCity, selectedBank, selectedProduct, search, toast])

  const hide = async (banker: Banker) => {
    setBusy(true)
    try {
      const res = await authedJson(
        `/api/admin/bankers?id=${encodeURIComponent(banker.id)}`,
        "DELETE"
      )
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed")
      setHiding(null)
      await handleGetDetails()
      toast.push({ tone: "success", title: "Banker hidden from the lookup" })
    } catch (error) {
      toast.push({
        tone: "danger",
        title: "Could not hide the banker",
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const filteredBankers = useMemo(() => {
    if (!search.trim()) return bankers
    const q = search.trim().toLowerCase()
    return bankers.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.mobile.includes(q) ||
      b.bank.toLowerCase().includes(q) ||
      b.branch.toLowerCase().includes(q)
    )
  }, [bankers, search])

  const totalEntries = filteredBankers.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize))
  const firstIndex = (currentPage - 1) * pageSize
  const lastIndex = Math.min(firstIndex + pageSize, totalEntries)
  const paginatedBankers = useMemo(() => {
    return filteredBankers.slice(firstIndex, lastIndex)
  }, [filteredBankers, firstIndex, lastIndex])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Banker Directory"
        subtitle="Step-by-step lookup: Select State > City > Bank > Product and click 'Get Details'."
        breadcrumbs={[{ label: "Money" }, { label: "Bankers" }]}
        actions={
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => setEditing({ ...EMPTY, id: "", state: selectedState, district: selectedCity, bank: selectedBank })}
          >
            Add banker
          </AdminButton>
        }
      />

      {/* Step-by-Step Filter Bar */}
      <div className="rounded-admin border border-admin-border bg-admin-surface p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-admin-border pb-2">
          <Building2 size={16} className="text-admin-accent" />
          <h3 className="text-admin-sm font-bold text-admin-text">
            Step-by-Step Selection (बँकर शोध)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
          {/* Step 1: State */}
          <div>
            <Label hint="Step 1">State (राज्य)</Label>
            <select
              className={fieldClass}
              value={selectedState}
              onChange={e => handleStateChange(e.target.value)}
            >
              <option value="Maharashtra">Maharashtra (Default)</option>
              {states.filter(s => s !== "Maharashtra").map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Step 2: City / District */}
          <div>
            <Label hint="Step 2">City / District (जिल्हा)</Label>
            <select
              className={fieldClass}
              value={selectedCity}
              disabled={loadingCities || !selectedState}
              onChange={e => handleCityChange(e.target.value)}
            >
              <option value="">-- District निवडा --</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Bank / Lender */}
          <div>
            <Label hint="Step 3">Bank / Lender (बँक नाव)</Label>
            <select
              className={fieldClass}
              value={selectedBank}
              disabled={loadingBanks || !selectedCity}
              onChange={e => handleBankChange(e.target.value)}
            >
              <option value="">-- All Banks / Lenders --</option>
              {banks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Step 4: Loan Product */}
          <div>
            <Label hint="Step 4 (Optional)">Loan Type (कर्ज प्रकार)</Label>
            <select
              className={fieldClass}
              value={selectedProduct}
              onChange={e => handleProductChange(e.target.value)}
            >
              <option value="">-- All Products --</option>
              {products.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Step 5: Get Details Action */}
          <div>
            <AdminButton
              variant="primary"
              loading={loadingBankers}
              disabled={!selectedState || !selectedCity}
              onClick={handleGetDetails}
              className="w-full h-[38px] justify-center text-admin-xs font-semibold"
            >
              Get Details
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loadingBankers ? (
        <SkeletonRows rows={6} />
      ) : !hasFetched ? (
        <EmptyState
          icon={Building2}
          title="Step-by-Step Search"
          description="बँकर नाव व मोबाईल नंबर पाहण्यासाठी State आणि District निवडून 'Get Details' बटणावर क्लिक करा."
        />
      ) : filteredBankers.length === 0 ? (
        <div className="rounded-admin border border-admin-border bg-admin-surface p-6 text-center space-y-2">
          <Building2 size={24} className="mx-auto text-admin-muted" />
          <p className="text-admin-sm font-semibold text-admin-text">
            No bankers found for {selectedCity || "selected location"} {selectedBank ? `(${selectedBank})` : ""}
          </p>
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => setEditing({ ...EMPTY, id: "", state: selectedState, district: selectedCity, bank: selectedBank })}
            className="mx-auto"
          >
            Add a Banker for {selectedCity || "this area"}
          </AdminButton>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header & Local Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-admin-surface p-2.5 rounded-admin border border-admin-border">
            <p className="text-admin-xs text-admin-muted font-medium">
              Showing <b>{filteredBankers.length}</b> of {total} bankers for <b>{selectedCity}</b> ({selectedState})
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-admin-subtle"
                />
                <input
                  className={`${fieldClass} pl-8 h-8 text-admin-xs`}
                  placeholder="Search name, phone, branch..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <AdminButton
                variant="primary"
                icon={Plus}
                onClick={() => setEditing({ ...EMPTY, id: "", state: selectedState, district: selectedCity, bank: selectedBank })}
                className="h-8 text-admin-xs shrink-0"
              >
                Add Banker
              </AdminButton>
            </div>
          </div>

          {/* Bankers Cards Grid */}
          <div className="space-y-2">
            {paginatedBankers.map(banker => (
              <div
                key={banker.id}
                className="rounded-admin border border-admin-border bg-admin-surface p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-admin-accent/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-admin-sm font-bold text-admin-text">
                      {banker.name}
                    </p>
                    <span className="rounded bg-admin-accent-soft px-2 py-0.5 text-admin-2xs font-bold text-admin-accent">
                      {banker.bank}
                    </span>
                    {banker.branch && (
                      <span className="text-admin-xs text-admin-muted font-medium">
                        ({banker.branch})
                      </span>
                    )}
                    {banker.edited && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-bold">
                        Edited
                      </span>
                    )}
                  </div>

                  <p className="text-admin-xs text-admin-muted flex items-center gap-2 flex-wrap">
                    <span>📍 {banker.district}, {banker.state}</span>
                    {banker.products.length > 0 && (
                      <span>· Loans: <b>{banker.products.join(", ")}</b></span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {banker.mobile ? (
                    <div className="flex items-center gap-1 bg-admin-bg px-2.5 py-1 rounded border border-admin-border">
                      <span className="font-mono text-admin-xs font-bold text-admin-text mr-1">
                        +91 {banker.mobile}
                      </span>
                      <a
                        href={`tel:${banker.mobile}`}
                        className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        title="Call Banker"
                      >
                        <Phone size={12} />
                      </a>
                      <a
                        href={`https://wa.me/91${banker.mobile.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-green-600 hover:bg-green-500 text-white transition-colors"
                        title="WhatsApp Banker"
                      >
                        <MessageSquare size={12} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-admin-xs text-admin-muted italic">No number</span>
                  )}

                  <div className="flex items-center gap-1 border-l border-admin-border pl-2">
                    <button
                      onClick={() => setEditing(banker)}
                      className="p-1.5 text-admin-subtle hover:text-admin-accent hover:bg-admin-accent-soft rounded transition-colors"
                      title={`Edit ${banker.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setHiding(banker)}
                      className="p-1.5 text-admin-subtle hover:text-tone-danger-fg hover:bg-red-500/10 rounded transition-colors"
                      title={`Hide ${banker.name}`}
                    >
                      <EyeOff size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stable Bottom Pagination Panel */}
          {totalEntries > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-admin border border-admin-border bg-admin-surface/95 backdrop-blur-sm text-admin-xs text-admin-muted sticky bottom-0 z-20 shadow-md">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-8 px-2 rounded-admin-sm border border-admin-border bg-admin-bg font-bold text-admin-text outline-none"
                >
                  {[10, 25, 50, 100].map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              <div className="font-semibold text-admin-text text-center">
                Showing {totalEntries > 0 ? firstIndex + 1 : 0} to {lastIndex} of {totalEntries} entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface disabled:opacity-40 font-semibold cursor-pointer"
                >
                  Prev
                </button>

                {pageWindow(currentPage, totalPages).map((slot, idx) =>
                  slot === "gap" ? (
                    <span key={`gap-${idx}`} className="px-1 text-admin-subtle font-bold">…</span>
                  ) : (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setCurrentPage(Number(slot))}
                      className={`w-7 h-7 rounded-admin-sm text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === slot
                          ? "bg-admin-accent text-white"
                          : "bg-admin-bg border border-admin-border text-admin-muted hover:text-admin-text"
                      }`}
                    >
                      {slot}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 rounded-admin-sm border border-admin-border bg-admin-bg hover:bg-admin-surface disabled:opacity-40 font-semibold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {editing && (
        <BankerEditor
          banker={editing}
          open={!!editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={handleGetDetails}
        />
      )}

      <Sheet
        open={!!hiding}
        onClose={() => setHiding(null)}
        side="center"
        size="sm"
        title="Hide this banker?"
        dismissOnBackdrop={false}
        footer={
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" icon={X} onClick={() => setHiding(null)}>
              Cancel
            </AdminButton>
            <AdminButton variant="danger" loading={busy} onClick={() => hiding && hide(hiding)}>
              Hide
            </AdminButton>
          </div>
        }
      >
        <p className="text-admin-sm text-admin-text">
          <strong>{hiding?.name}</strong> stops appearing in the banker lookup on the leads screen.
          The record is kept, so you can add them back later.
        </p>
      </Sheet>
    </div>
  )
}
