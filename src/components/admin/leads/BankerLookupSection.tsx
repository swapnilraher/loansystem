"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Building2, Phone, Mail, MapPin, Search, Plus, RefreshCw, MessageSquare, Loader2 } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/admin/ui"
import { Select } from "./fields"
import { lookupPincode } from "@/lib/pincode"
import type { Lead } from "@/lib/hooks/useLeads"

export interface BankerContact {
  id?: string
  bankName?: string
  bankerName?: string
  lender?: string
  name?: string
  phone?: string
  contact?: string
  email?: string
  city?: string
  district?: string
  state?: string
  products?: string[]
  branch?: string
  active?: boolean
}

interface BankerLookupSectionProps {
  lead: Lead
  onUpdateLocationDetails?: (details: { pincode: string; city: string; district: string; state: string; address: string }) => Promise<void>
}

export function BankerLookupSection({ lead, onUpdateLocationDetails }: BankerLookupSectionProps) {
  const toast = useToast()
  const [pincodeInput, setPincodeInput] = useState(lead.pincode || "")
  const [lookingUp, setLookingUp] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Location fields from lead
  const initialCity = lead.city || (lead as any).district || ""
  const initialState = lead.state || "Maharashtra"
  const pincode = lead.pincode || ""
  const address = (lead as any).address || ""

  // Cascading state & filters
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [lenders, setLenders] = useState<string[]>([])

  const [selectedState, setSelectedState] = useState<string>("Maharashtra")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedLender, setSelectedLender] = useState<string>("")
  const [search, setSearch] = useState("")

  // Lazy loaded bankers result
  const [bankers, setBankers] = useState<BankerContact[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingLenders, setLoadingLenders] = useState(false)
  const [loadingBankers, setLoadingBankers] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Sync pincode input if lead changes
  useEffect(() => {
    setPincodeInput(lead.pincode || "")
  }, [lead.pincode])

  // Add new banker modal state
  const [newBanker, setNewBanker] = useState({
    bankName: "",
    bankerName: "",
    phone: "",
    email: "",
    city: initialCity || "Pune",
    district: initialCity || "Pune",
    state: initialState || "Maharashtra",
    branch: ""
  })

  // 1. Load metadata (States)
  useEffect(() => {
    let cancelled = false
    async function fetchMetadata() {
      try {
        const res = await fetch("/api/admin/bankers?action=metadata")
        const json = await res.json()
        if (cancelled || !json.success) return
        setStates(json.states || [])
        if (initialState && json.states?.includes(initialState)) {
          setSelectedState(initialState)
        } else {
          setSelectedState("Maharashtra")
        }
      } catch (err) {
        console.error("Failed to fetch banker metadata:", err)
      }
    }
    fetchMetadata()
    return () => { cancelled = true }
  }, [initialState])

  // 2. Load cities ONLY for selected State
  useEffect(() => {
    if (!selectedState) return
    let cancelled = false
    async function fetchCities() {
      setLoadingCities(true)
      try {
        const res = await fetch(`/api/admin/bankers?action=cities&state=${encodeURIComponent(selectedState)}`)
        const json = await res.json()
        if (cancelled || !json.success) return
        const cityList: string[] = json.cities || []
        setCities(cityList)
        // Auto select lead's city if available in cityList for this state
        if (initialCity && cityList.includes(initialCity)) {
          setSelectedCity(initialCity)
        } else if (cityList.length > 0 && !cityList.includes(selectedCity)) {
          setSelectedCity("")
        }
      } catch (err) {
        console.error("Failed to load cities:", err)
      } finally {
        if (!cancelled) setLoadingCities(false)
      }
    }
    fetchCities()
    return () => { cancelled = true }
  }, [selectedState, initialCity])

  // 3. Load lenders ONLY for selected State + City
  useEffect(() => {
    if (!selectedState || !selectedCity) {
      setLenders([])
      setSelectedLender("")
      return
    }
    let cancelled = false
    async function fetchLenders() {
      setLoadingLenders(true)
      try {
        const res = await fetch(`/api/admin/bankers?action=lenders&state=${encodeURIComponent(selectedState)}&city=${encodeURIComponent(selectedCity)}`)
        const json = await res.json()
        if (cancelled || !json.success) return
        setLenders(json.lenders || [])
      } catch (err) {
        console.error("Failed to load lenders:", err)
      } finally {
        if (!cancelled) setLoadingLenders(false)
      }
    }
    fetchLenders()
    return () => { cancelled = true }
  }, [selectedState, selectedCity])

  // Reset lazy fetched result on filter changes
  const handleStateChange = (val: string) => {
    setSelectedState(val)
    setSelectedCity("")
    setSelectedLender("")
    setBankers([])
    setHasFetched(false)
  }

  const handleCityChange = (val: string) => {
    setSelectedCity(val)
    setSelectedLender("")
    setBankers([])
    setHasFetched(false)
  }

  const handleLenderChange = (val: string) => {
    setSelectedLender(val)
    setBankers([])
    setHasFetched(false)
  }

  // 4. API Lazy loading on "Get Details"
  const handleGetDetails = async () => {
    if (!selectedState || !selectedCity) return
    setLoadingBankers(true)
    try {
      const lenderQuery = selectedLender ? `&lender=${encodeURIComponent(selectedLender)}` : ""
      const productQuery = lead.type ? `&product=${encodeURIComponent(lead.type)}` : ""
      const res = await fetch(`/api/admin/bankers?state=${encodeURIComponent(selectedState)}&city=${encodeURIComponent(selectedCity)}${productQuery}${lenderQuery}`)
      const json = await res.json()
      if (json.success) {
        setBankers(json.bankers || [])
        setHasFetched(true)
      }
    } catch (err) {
      console.error("Failed to fetch banker details:", err)
      toast.push({ tone: "danger", title: "Failed to load banker details" })
    } finally {
      setLoadingBankers(false)
    }
  }

  // Filter fetched bankers by text search if provided
  const matchedBankers = useMemo(() => {
    if (!search.trim()) return bankers
    const q = search.trim().toLowerCase()
    return bankers.filter(b => {
      const name = b.name || b.bankerName || ""
      const bank = b.lender || b.bankName || ""
      const contact = b.contact || b.phone || ""
      const branch = b.branch || ""
      return (
        name.toLowerCase().includes(q) ||
        bank.toLowerCase().includes(q) ||
        contact.includes(q) ||
        branch.toLowerCase().includes(q)
      )
    })
  }, [bankers, search])

  // Auto pincode lookup when staff inputs a 6-digit pincode
  const handlePincodeChange = async (val: string) => {
    setPincodeInput(val)
    const clean = val.replace(/\D/g, "")
    if (clean.length === 6 && clean !== pincode) {
      setLookingUp(true)
      const result = await lookupPincode(clean)
      setLookingUp(false)

      if (result) {
        toast.push({ tone: "success", title: `Location Found: ${result.city}, ${result.district}, ${result.state}` })
        if (onUpdateLocationDetails) {
          await onUpdateLocationDetails(result)
        }
      } else {
        toast.push({ tone: "warn", title: "Invalid or Unknown Pincode." })
      }
    }
  }

  const handleAddBankerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBanker.bankName || !newBanker.bankerName || !newBanker.phone) {
      toast.push({ tone: "danger", title: "Please fill required fields (Bank, Name, Phone)" })
      return
    }

    try {
      await addDoc(collection(db, "bankers"), {
        ...newBanker,
        active: true,
        createdAt: serverTimestamp()
      })
      toast.push({ tone: "success", title: "Banker contact saved successfully!" })
      setShowAddModal(false)
      setNewBanker({
        bankName: "",
        bankerName: "",
        phone: "",
        email: "",
        city: initialCity || "Pune",
        district: initialCity || "Pune",
        state: initialState || "Maharashtra",
        branch: ""
      })
    } catch (err) {
      console.error(err)
      toast.push({ tone: "danger", title: "Failed to save banker contact" })
    }
  }

  return (
    <div className="space-y-3 border border-admin-border rounded-admin p-3 bg-admin-surface">
      <div className="flex items-center justify-between gap-2 border-b border-admin-border pb-2">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-admin-accent" />
          <h4 className="text-admin-sm font-semibold text-admin-text">
            Location Banker Contacts (बँकर संपर्क)
          </h4>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-admin-xs font-semibold text-admin-accent hover:underline cursor-pointer"
        >
          <Plus size={14} /> Add Banker
        </button>
      </div>

      {/* Location Details & Pincode Edit Bar */}
      <div className="bg-admin-bg p-2.5 rounded-admin-sm border border-admin-border space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-admin-xs">
          <div className="flex items-center gap-1.5 font-medium text-admin-muted min-w-0 flex-1">
            <MapPin size={14} className="text-admin-accent shrink-0" />
            <span>Customer Location:</span>
            <span className="font-bold text-admin-text truncate">
              {initialCity || "City Not Set"}{initialState ? `, ${initialState}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-admin-muted font-medium">Pincode:</span>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={pincodeInput}
                onChange={e => handlePincodeChange(e.target.value)}
                placeholder="411001"
                title="Type 6-digit pincode to change location"
                className="w-24 h-7 px-2 bg-admin-surface border border-admin-border rounded text-admin-xs font-bold text-admin-text outline-none focus:border-admin-accent"
              />
              {lookingUp && (
                <Loader2 size={12} className="animate-spin absolute right-1.5 top-2 text-admin-accent" />
              )}
            </div>
          </div>
        </div>

        {address && (
          <div className="text-[11px] text-admin-muted truncate font-mono">
            📍 Address: {address}
          </div>
        )}
      </div>

      {/* Cascading Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="relative">
          <Select
            value={selectedState}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStateChange(e.target.value)}
            className="w-full h-8 text-admin-xs"
          >
            <option value="Maharashtra">Maharashtra (Default)</option>
            {states.filter(s => s !== "Maharashtra").map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </Select>
        </div>

        <div className="relative">
          <Select
            value={selectedCity}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCityChange(e.target.value)}
            disabled={loadingCities || !selectedState}
            className="w-full h-8 text-admin-xs"
          >
            <option value="">-- City/District निवडा --</option>
            {cities.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </Select>
        </div>

        <div className="relative">
          <Select
            value={selectedLender}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLenderChange(e.target.value)}
            disabled={loadingLenders || !selectedCity}
            className="w-full h-8 text-admin-xs"
          >
            <option value="">-- All Banks/Lenders --</option>
            {lenders.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGetDetails}
            disabled={!selectedState || !selectedCity || loadingBankers}
            className="h-8 w-full rounded-admin-sm bg-admin-accent hover:bg-admin-accent-strong text-white disabled:opacity-50 text-admin-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {loadingBankers ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : null}
            Get Details
          </button>
        </div>
      </div>

      {/* Text Search inside results */}
      {hasFetched && (
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-admin-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search within fetched bankers..."
            className="w-full h-8 pl-8 pr-2.5 bg-admin-surface border border-admin-border rounded-admin-sm text-admin-xs text-admin-text outline-none focus:border-admin-accent"
          />
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-[11px] text-admin-muted px-0.5">
        <span>
          Showing <b>{matchedBankers.length}</b> banker contacts for <b>{selectedCity || "selected area"}</b> ({selectedState})
        </span>
      </div>

      {/* Bankers List Container */}
      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
        {!hasFetched ? (
          <div className="text-center py-4 text-admin-xs text-admin-muted">
            बँकर संपर्क पाहण्यासाठी State आणि City/District निवडून <b>“Get Details”</b> बटणावर क्लिक करा.
          </div>
        ) : matchedBankers.length === 0 ? (
          <div className="text-center py-4 text-admin-xs text-admin-muted">
            No banker contacts found for <b>{selectedCity || "this area"}</b>.
            <button
              onClick={() => setShowAddModal(true)}
              className="block mx-auto mt-1 text-admin-accent underline font-semibold cursor-pointer"
            >
              Add a Banker for {selectedCity || "this location"}
            </button>
          </div>
        ) : (
          matchedBankers.map((banker, idx) => {
            const name = banker.name || banker.bankerName || "Banker"
            const bank = banker.lender || banker.bankName || "Bank"
            const phone = banker.contact || banker.phone || ""
            return (
              <div
                key={banker.id || idx}
                className="p-2.5 bg-admin-surface border border-admin-border rounded-admin-sm hover:border-admin-accent/50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-admin-sm text-admin-text">{name}</span>
                    <span className="px-1.5 py-0.5 bg-admin-accent-soft text-admin-accent text-[10px] font-bold rounded">
                      {bank}
                    </span>
                    {banker.branch && (
                      <span className="text-[10px] text-admin-muted font-medium">({banker.branch})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-admin-muted flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-admin-text">
                      <MapPin size={11} className="text-admin-accent" /> {selectedCity}, {selectedState}
                    </span>
                    {phone && (
                      <span className="font-mono text-admin-text font-bold">+91 {phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {phone && (
                    <>
                      <a
                        href={`tel:${phone}`}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-admin-xs transition-colors"
                        title={`Call ${name}`}
                      >
                        <Phone size={13} />
                      </a>
                      <a
                        href={`https://wa.me/91${phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-admin-xs transition-colors"
                        title={`WhatsApp ${name}`}
                      >
                        <MessageSquare size={13} />
                      </a>
                    </>
                  )}
                  {banker.email && (
                    <a
                      href={`mailto:${banker.email}`}
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-admin-xs transition-colors"
                      title={`Email ${banker.email}`}
                    >
                      <Mail size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Banker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-admin-surface border border-admin-border rounded-admin max-w-md w-full p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-admin-border pb-2">
              <h3 className="text-admin-sm font-bold text-admin-text">Add Location Banker Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-admin-muted hover:text-admin-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBankerSubmit} className="space-y-2.5 text-admin-xs">
              <div>
                <label className="block font-semibold mb-1 text-admin-text">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={newBanker.bankName}
                  onChange={e => setNewBanker({ ...newBanker, bankName: e.target.value })}
                  className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-admin-text">Banker Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newBanker.bankerName}
                  onChange={e => setNewBanker({ ...newBanker, bankerName: e.target.value })}
                  className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-admin-text">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="98220XXXXX"
                    value={newBanker.phone}
                    onChange={e => setNewBanker({ ...newBanker, phone: e.target.value })}
                    className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-admin-text">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune, Nashik, etc."
                    value={newBanker.city}
                    onChange={e => setNewBanker({ ...newBanker, city: e.target.value, district: e.target.value })}
                    className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-admin-text">Branch (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FC Road Branch"
                  value={newBanker.branch}
                  onChange={e => setNewBanker({ ...newBanker, branch: e.target.value })}
                  className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-admin-text">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="banker@bank.com"
                  value={newBanker.email}
                  onChange={e => setNewBanker({ ...newBanker, email: e.target.value })}
                  className="w-full h-8 px-2.5 bg-admin-bg border border-admin-border rounded text-admin-text outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-admin-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-admin-bg text-admin-muted rounded text-admin-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-admin-accent text-white rounded text-admin-xs font-semibold cursor-pointer"
                >
                  Save Banker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
