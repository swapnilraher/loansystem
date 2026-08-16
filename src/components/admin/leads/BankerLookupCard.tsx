"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Phone, MessageSquare, AlertCircle, RefreshCw, MapPin } from "lucide-react"
import { SectionCard, Field, Select } from "./fields"
import { bankerProductFor, currentDistrictName, matchLocationOption } from "@/lib/locationMatch"
import type { Lead } from "@/lib/hooks/useLeads"

interface Banker {
  lender: string
  name: string
  contact: string
}

/** Where the banker search points when the lead's own location matches nothing. */
const FALLBACK_STATE = "Maharashtra"

/**
 * Banker assignment for a lead.
 *
 * State and District are seeded from the lead's PIN code lookup (`pinState` /
 * `pinDistrict`) and are then the staff member's to change — re-pointing the
 * search reloads the banker list without touching the `pin*` fields, which stay
 * as the record of where the customer's PIN code actually is.
 *
 * A staff override is saved back to the lead as `bankerState` / `bankerDistrict`
 * so it survives closing the sheet, and takes priority over the PIN code seed on
 * the next open.
 *
 * Mount this with `key={lead.id}`. Auto-selection is a mount-time concern, and a
 * fresh instance per lead is what keeps one customer's district from surviving
 * into the next file.
 */
export function BankerLookupCard({
  lead,
  onSaveBankerLocation,
}: {
  lead: Lead
  /** Persists a staff override. Omitted for read-only viewers. */
  onSaveBankerLocation?: (leadId: string, state: string, district: string) => Promise<unknown>
}) {
  /**
   * Read into a ref, not into effect dependencies: the leads screen re-renders
   * this card with a fresh `lead` object on every Firestore snapshot, and any
   * dependency on it would re-seed the dropdowns out from under whoever is
   * using them. Seeding reads the ref once, at mount.
   *
   * A saved staff override wins over the PIN code, which is the point of storing
   * the two separately.
   */
  const leadId = lead.id
  const sourceDistrict =
    lead.bankerDistrict || lead.pinDistrict || lead.pinCity || lead.city || ""
  const seedSource = useRef({
    state: lead.bankerState || lead.pinState || lead.state || FALLBACK_STATE,
    district: sourceDistrict,
    product: lead.type || "",
  })

  const [states, setStates] = useState<string[]>([])
  const [products, setProducts] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [lenders, setLenders] = useState<string[]>([])
  const [bankers, setBankers] = useState<Banker[]>([])

  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedLender, setSelectedLender] = useState("")

  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingLenders, setLoadingLenders] = useState(false)
  const [loadingBankers, setLoadingBankers] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  /**
   * Whether the District dropdown has had its one auto-fill.
   *
   * A ref rather than state on purpose: it must not be an effect dependency, or
   * flipping it would re-run the fetch that set it.
   */
  const districtSeeded = useRef(false)
  /** Set once the auto-fill is done, so staff edits are distinguishable from it. */
  const [ready, setReady] = useState(false)
  /** The lead's district has no entry in the banker list — staff must pick one. */
  const [seedMissed, setSeedMissed] = useState(false)

  /**
   * 1. States and products, then the State and Loan Type auto-fill.
   *
   * Seeding happens inside the response handler rather than in a follow-up
   * effect: it is the arrival of the options list that makes a selection
   * possible, so that is where the selection belongs.
   */
  useEffect(() => {
    let cancelled = false
    async function fetchMetadata() {
      setLoadingMetadata(true)
      try {
        const res = await fetch("/api/admin/bankers?action=metadata")
        const json = await res.json()
        if (cancelled || !json.success) return

        const stateList: string[] = json.states || []
        const productList: string[] = json.products || []
        setStates(stateList)
        setProducts(productList)

        const { state, product } = seedSource.current
        setSelectedState(
          matchLocationOption(state, stateList) ||
            matchLocationOption(FALLBACK_STATE, stateList)
        )
        setSelectedProduct(bankerProductFor(product, productList))
        setReady(true)
      } catch (err) {
        console.error("Failed to load bankers metadata:", err)
      } finally {
        if (!cancelled) setLoadingMetadata(false)
      }
    }
    fetchMetadata()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * 2. Districts for the selected state, then the District auto-fill.
   *
   * The auto-fill runs at most once. A staff member who switches state is
   * exploring, and re-imposing the PIN code's district there would fight them.
   */
  useEffect(() => {
    if (!selectedState) return
    let cancelled = false
    async function fetchCities() {
      setLoadingCities(true)
      try {
        const res = await fetch(
          `/api/admin/bankers?action=cities&state=${encodeURIComponent(selectedState)}`
        )
        const json = await res.json()
        if (cancelled || !json.success) return

        const cityList: string[] = json.cities || []
        setCities(cityList)

        if (!districtSeeded.current) {
          districtSeeded.current = true
          const seededDistrict = matchLocationOption(seedSource.current.district, cityList)
          setSelectedCity(seededDistrict)
          setSeedMissed(Boolean(seedSource.current.district) && !seededDistrict)
        }
      } catch (err) {
        console.error("Failed to load cities:", err)
      } finally {
        if (!cancelled) setLoadingCities(false)
      }
    }
    fetchCities()
    return () => {
      cancelled = true
    }
  }, [selectedState])

  // 3. Lenders present for this State + District + Loan Type.
  useEffect(() => {
    if (!selectedState || !selectedCity || !selectedProduct) return

    let cancelled = false
    async function fetchLenders() {
      setLoadingLenders(true)
      try {
        const res = await fetch(
          `/api/admin/bankers?action=lenders&state=${encodeURIComponent(
            selectedState
          )}&city=${encodeURIComponent(selectedCity)}&product=${encodeURIComponent(
            selectedProduct
          )}`
        )
        const json = await res.json()
        if (!cancelled && json.success) setLenders(json.lenders || [])
      } catch (err) {
        console.error("Failed to load lenders:", err)
      } finally {
        if (!cancelled) setLoadingLenders(false)
      }
    }

    fetchLenders()
    return () => {
      cancelled = true
    }
  }, [selectedState, selectedCity, selectedProduct])

  /**
   * Drops the results of the previous search. Called from the handlers rather
   * than from the effect above, so that changing a dropdown clears the stale
   * bankers in the same render that records the change.
   */
  const clearResults = () => {
    setLenders([])
    setSelectedLender("")
    setBankers([])
    setHasFetched(false)
  }

  /**
   * Records a staff override so it is still there on the next open.
   *
   * Gated on `ready`: until the auto-fill has run there is nothing a staff
   * member could have chosen, and writing then would store the seed as though
   * it were a deliberate override.
   */
  const persistLocation = useCallback(
    (state: string, district: string) => {
      if (!onSaveBankerLocation || !ready) return
      onSaveBankerLocation(leadId, state, district).catch(err =>
        console.error("Failed to save banker location:", err)
      )
    },
    [onSaveBankerLocation, leadId, ready]
  )

  const handleStateChange = (value: string) => {
    setSelectedState(value)
    // The old district belongs to the old state's list, and the customer's
    // district must not be re-imposed on a state staff chose deliberately.
    setSelectedCity("")
    districtSeeded.current = true
    // The warning was about the customer's district in their own state; it says
    // nothing about a state staff picked on purpose.
    setSeedMissed(false)
    clearResults()
    persistLocation(value, "")
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
    clearResults()
    persistLocation(selectedState, value)
  }

  const handleProductChange = (value: string) => {
    setSelectedProduct(value)
    clearResults()
  }

  const handleLenderChange = (val: string) => {
    setSelectedLender(val)
    setBankers([])
    setHasFetched(false)
  }

  // 4. The banker contacts themselves, on demand.
  const handleGetDetails = async () => {
    if (!selectedState || !selectedCity || !selectedProduct) return

    setLoadingBankers(true)
    try {
      const lenderQuery = selectedLender ? `&lender=${encodeURIComponent(selectedLender)}` : ""
      const res = await fetch(
        `/api/admin/bankers?state=${encodeURIComponent(selectedState)}&city=${encodeURIComponent(
          selectedCity
        )}&product=${encodeURIComponent(selectedProduct)}${lenderQuery}`
      )
      const json = await res.json()
      if (json.success) {
        setBankers(json.bankers || [])
        setHasFetched(true)
      }
    } catch (err) {
      console.error("Failed to fetch bankers details:", err)
    } finally {
      setLoadingBankers(false)
    }
  }

  const isLoading = loadingMetadata || loadingCities || loadingLenders || loadingBankers

  // The PIN code line is the source record, shown so staff can see what the
  // dropdowns were seeded from even after they re-point the search.
  const pinLine = [
    lead.pinCity,
    currentDistrictName(lead.pinDistrict || ""),
    lead.pinState,
  ]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i)
    .join(", ")

  const pinExtras = [
    lead.pinTaluka ? `Taluka: ${lead.pinTaluka}` : "",
    lead.pinUrbanRural || "",
    lead.pinPostOffice ? `PO: ${lead.pinPostOffice}` : "",
  ].filter(Boolean)

  const seedFailed = seedMissed && !selectedCity

  return (
    <SectionCard title="🏦 Banker Details (बँकर संपर्क माहिती)">
      <div className="p-3 space-y-3">
        {/* Source location from the PIN code — read-only on purpose */}
        {lead.pincode && (
          <div className="rounded-admin-sm border border-admin-border bg-admin-surface-2 px-2.5 py-2 space-y-0.5">
            <div className="flex items-center gap-1.5 text-admin-xs">
              <MapPin size={12} className="text-admin-accent shrink-0" />
              <span className="text-admin-muted shrink-0">PIN {lead.pincode} →</span>
              <span className="font-semibold text-admin-text truncate">
                {pinLine || "स्थान मिळाले नाही (not resolved)"}
              </span>
            </div>
            {pinExtras.length > 0 && (
              <p className="text-[10px] text-admin-subtle pl-4.5 truncate">
                {pinExtras.join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* Dropdowns Row 1 */}
        <div className="grid grid-cols-3 gap-2">
          <Field label="State (राज्य)">
            <Select
              value={selectedState}
              onChange={e => handleStateChange(e.target.value)}
              disabled={loadingMetadata}
              className="text-xs h-8 py-0.5 px-2"
            >
              <option value="">-- State निवडा --</option>
              {states.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="District (जिल्हा)">
            <Select
              value={selectedCity}
              onChange={e => handleCityChange(e.target.value)}
              disabled={loadingCities || !selectedState}
              className="text-xs h-8 py-0.5 px-2"
            >
              <option value="">-- District निवडा --</option>
              {cities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Loan Type (प्रकार)">
            <Select
              value={selectedProduct}
              onChange={e => handleProductChange(e.target.value)}
              disabled={loadingMetadata}
              className="text-xs h-8 py-0.5 px-2"
            >
              <option value="">-- Loan Type निवडा --</option>
              {products.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {seedFailed && (
          <p className="flex items-center gap-1.5 text-[11px] text-tone-warn-fg">
            <AlertCircle size={12} className="shrink-0" />
            <span className="truncate">
              {currentDistrictName(sourceDistrict)} साठी बँकर यादीत जिल्हा नाही — जवळचा
              District निवडा.
            </span>
          </p>
        )}

        {/* Dropdowns Row 2 */}
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <Field label="Lender / Bank (बँक नाव)">
              <Select
                value={selectedLender}
                onChange={e => handleLenderChange(e.target.value)}
                disabled={loadingLenders || !selectedProduct}
                className="text-xs h-8 py-0.5 px-2"
              >
                <option value="">-- Bank निवडा --</option>
                {lenders.map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <button
            onClick={handleGetDetails}
            disabled={!selectedState || !selectedCity || !selectedProduct || !selectedLender || isLoading}
            className="h-8 w-full rounded-admin-sm bg-admin-accent hover:bg-admin-accent-strong text-white disabled:opacity-50 text-admin-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {loadingBankers ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : null}
            Get Details
          </button>
        </div>

        {/* Bankers List Result */}
        <div className="pt-2 border-t border-admin-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-admin-xs text-admin-muted">
              <RefreshCw size={14} className="animate-spin text-admin-accent" />
              माहिती लोड होत आहे...
            </div>
          ) : hasFetched ? (
            bankers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-admin-muted uppercase tracking-wide">
                  बँकर्सचे संपर्क क्रमांक ({bankers.length}):
                </p>
                <div className="max-h-48 overflow-y-auto custom-scrollbar border border-admin-border rounded divide-y divide-admin-border bg-admin-surface">
                  {bankers.map((b, i) => (
                    <div key={i} className="p-2 flex items-center justify-between text-admin-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-admin-text block truncate">{b.name}</span>
                        <span className="text-[10px] text-admin-muted uppercase block truncate">
                          {b.lender}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="admin-num font-medium text-admin-text mr-1">
                          {b.contact}
                        </span>
                        <a
                          href={`tel:${b.contact}`}
                          className="p-1.5 rounded-admin-sm bg-admin-surface-2 border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-surface transition-colors"
                          title="Call Banker"
                        >
                          <Phone size={12} />
                        </a>
                        <a
                          href={`https://wa.me/91${b.contact.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-admin-sm bg-wa-header text-white hover:opacity-90 transition-opacity"
                          title="WhatsApp Banker"
                        >
                          <MessageSquare size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 gap-1.5 text-admin-xs text-tone-warn-fg">
                <AlertCircle size={14} />
                निवडलेल्या प्रकारासाठी बँकर उपलब्ध नाही.
              </div>
            )
          ) : selectedState && selectedCity && selectedProduct && selectedLender ? (
            <p className="text-center py-4 text-admin-xs text-admin-muted">
              बँकर पाहण्यासाठी “Get Details” बटणावर क्लिक करा.
            </p>
          ) : selectedState && selectedCity && selectedProduct ? (
            <p className="text-center py-4 text-admin-xs text-admin-muted">
              कृपया बँक नाव (Lender / Bank) निवडा.
            </p>
          ) : (
            <p className="text-center py-4 text-admin-xs text-admin-muted">
              कृपया बँकर पाहण्यासाठी State, District आणि Loan Type निवडा.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
