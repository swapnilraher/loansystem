"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  CreditCard,
  Shield,
  Bell,
  Globe,
  Lock,
  Smartphone,
  Users,
  MessageSquare,
  Clock,
  Save,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import {
  AdminButton,
  PageHeader,
  SkeletonRows,
  useToast,
} from "@/components/admin/ui"

export default function SettingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("Company Profile")
  const [loading, setLoading] = useState(true)

  // 1. Company Profile States
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "Techstar Money Solution",
    primaryEmail: "official@techstarsolution.in",
    defaultBranch: "Pune Regional Office",
    baseCurrency: "INR (₹)",
    autoAssignment: true,
  })
  const [savingCompany, setSavingCompany] = useState(false)

  // 2. Personal Notification Preferences States
  const [userSettings, setUserSettings] = useState({
    notifyLeads: true,
    notifyPartners: true,
  })

  // 3. System-Wide Notification Customization States (Admin Only)
  const [systemNotif, setSystemNotif] = useState({
    pushEnabled: true,
    delayMinutes: 2.5,
    leadTitle: "🌟 New Lead Received!",
    includeName: true,
    includeCity: true,
    includeMobile: true,
    includeType: true,
    includeAmount: true,
    includeSource: true,
    whatsappEnabled: true,
    whatsappAlertHeader: "🌟 New Lead Assigned!",
    whatsappIncludeName: true,
    whatsappIncludeCity: true,
    whatsappIncludeMobile: true,
    whatsappIncludeType: true,
    whatsappIncludeAmount: true,
  })
  const [savingSystemNotif, setSavingSystemNotif] = useState(false)

  // Load all settings on mount
  useEffect(() => {
    if (!user) return

    const loadAllSettings = async () => {
      setLoading(true)
      try {
        // Load Company Settings
        const compRef = doc(db, "system_settings", "company")
        const compSnap = await getDoc(compRef)
        if (compSnap.exists()) {
          setCompanyInfo(prev => ({ ...prev, ...compSnap.data() }))
        }

        // Load Personal User Notification Settings
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const uData = userSnap.data()
          setUserSettings({
            notifyLeads: uData.notifyLeads !== false,
            notifyPartners: uData.notifyPartners !== false,
          })
        }

        // Load System-Wide Notification Customizations
        const sysRef = doc(db, "system_settings", "notifications")
        const sysSnap = await getDoc(sysRef)
        if (sysSnap.exists()) {
          setSystemNotif(prev => ({ ...prev, ...sysSnap.data() }))
        }
      } catch (err) {
        console.error("Error loading settings:", err)
      } finally {
        setLoading(false)
      }
    }

    loadAllSettings()
  }, [user])

  // Save Company Profile Handler
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCompany(true)
    try {
      const compRef = doc(db, "system_settings", "company")
      await setDoc(compRef, {
        ...companyInfo,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "Admin",
      }, { merge: true })
      toast.push({ tone: "success", title: "Company profile updated successfully!" })
    } catch (err) {
      console.error("Error saving company profile:", err)
      toast.push({ tone: "danger", title: "Could not save company profile." })
    } finally {
      setSavingCompany(false)
    }
  }

  // Toggle Personal Setting Handler
  const toggleUserSetting = async (key: 'notifyLeads' | 'notifyPartners') => {
    if (!user) return
    const updatedValue = !userSettings[key]
    setUserSettings(prev => ({ ...prev, [key]: updatedValue }))
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { [key]: updatedValue })
      toast.push({ tone: "success", title: "Preference saved." })
    } catch (err) {
      console.error("Error saving user preference:", err)
      setUserSettings(prev => ({ ...prev, [key]: !updatedValue }))
      toast.push({ tone: "danger", title: "Could not save preference." })
    }
  }

  // Save Complete Notification Customizations (Admin Only)
  const handleSaveSystemNotif = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSystemNotif(true)
    try {
      const sysRef = doc(db, "system_settings", "notifications")
      await setDoc(sysRef, {
        ...systemNotif,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "Admin",
      }, { merge: true })
      toast.push({ tone: "success", title: "System Notification options saved!" })
    } catch (err) {
      console.error("Error saving notification customization:", err)
      toast.push({ tone: "danger", title: "Could not save notification options." })
    } finally {
      setSavingSystemNotif(false)
    }
  }

  const labelCls = "block text-admin-2xs font-semibold text-admin-subtle uppercase tracking-wide mb-1"
  const inputCls = "admin-focus w-full h-9 px-3 text-admin-sm font-medium text-admin-text bg-admin-bg border border-admin-border rounded-admin-sm outline-none transition-colors"
  const selectCls = "admin-focus w-full h-9 px-3 text-admin-sm font-medium text-admin-text bg-admin-bg border border-admin-border rounded-admin-sm outline-none transition-colors"

  return (
    <div className="space-y-3">
      <PageHeader
        title="Global System Settings"
        subtitle="Manage CRM company profile, branch routing, and complete notification customization rules."
        breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* ─── LEFT NAVIGATION SIDEBAR ─── */}
        <div className="lg:col-span-1 space-y-1.5">
          {[
            { name: "Company Profile", icon: Building2 },
            { name: "Notification Rules", icon: Bell },
            { name: "Subscription Plan", icon: CreditCard },
            { name: "Roles & Security", icon: Shield },
            { name: "Webhooks & API", icon: Globe },
            { name: "Mobile App (PWA)", icon: Smartphone },
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-admin-sm text-admin-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === item.name
                  ? "bg-admin-accent text-white shadow-xs"
                  : "bg-admin-surface text-admin-text hover:bg-admin-bg border border-admin-border"
              }`}
            >
              <item.icon size={16} />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>

        {/* ─── MAIN CONTENT AREA ─── */}
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <SkeletonRows rows={6} />
          ) : (
            <>
              {/* TAB 1: Company Profile */}
              {activeTab === "Company Profile" && (
                <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-admin-border">
                    <div className="w-8 h-8 rounded-admin-sm bg-admin-accent-soft flex items-center justify-center text-admin-accent">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h3 className="text-admin-sm font-semibold text-admin-text">Company Information</h3>
                      <p className="text-admin-2xs text-admin-subtle">General business identification and branch rules</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveCompany} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Company Name</label>
                        <input
                          type="text"
                          value={companyInfo.companyName}
                          onChange={e => setCompanyInfo(p => ({ ...p, companyName: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Primary Official Email *</label>
                        <input
                          type="email"
                          value={companyInfo.primaryEmail}
                          onChange={e => setCompanyInfo(p => ({ ...p, primaryEmail: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Default Branch *</label>
                        <select
                          value={companyInfo.defaultBranch}
                          onChange={e => setCompanyInfo(p => ({ ...p, defaultBranch: e.target.value }))}
                          className={selectCls}
                        >
                          <option value="Pune Regional Office">Pune Regional Office (Default)</option>
                          <option value="Chhatrapati Sambhajinagar Branch">Chhatrapati Sambhajinagar Branch</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Base Currency</label>
                        <input
                          type="text"
                          value={companyInfo.baseCurrency}
                          disabled
                          className="w-full h-9 px-3 text-admin-sm font-medium text-admin-muted bg-admin-surface-2 border border-admin-border rounded-admin-sm select-none"
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Auto-Assignment Engine</label>
                        <div className="flex items-center gap-2 h-9 px-3 bg-admin-bg border border-admin-border rounded-admin-sm text-admin-xs font-semibold text-admin-text">
                          <CheckCircle2 size={14} className="text-tone-success-fg" />
                          <span>Round-Robin Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-admin-border">
                      <AdminButton
                        variant="primary"
                        type="submit"
                        icon={Save}
                        loading={savingCompany}
                        className="text-admin-xs"
                      >
                        {savingCompany ? "Saving Company Info…" : "Save Company Profile"}
                      </AdminButton>
                    </div>
                  </form>
                </section>
              )}

              {/* TAB 2: Notification Rules (Full Customization) */}
              {activeTab === "Notification Rules" && (
                <div className="space-y-3">
                  {/* Card A: Personal Device Notifications */}
                  <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-admin-border">
                      <div className="w-8 h-8 rounded-admin-sm bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <Bell size={16} />
                      </div>
                      <div>
                        <h3 className="text-admin-sm font-semibold text-admin-text">My Device Push Alerts</h3>
                        <p className="text-admin-2xs text-admin-subtle">Toggle notifications on this device</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-admin-bg border border-admin-border rounded-admin-sm">
                        <div>
                          <h4 className="text-admin-sm font-semibold text-admin-text">New Lead Notifications</h4>
                          <p className="text-admin-2xs text-admin-subtle">Receive push alerts when new leads are created.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleUserSetting('notifyLeads')}
                          className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${userSettings.notifyLeads ? 'bg-admin-accent' : 'bg-admin-border'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${userSettings.notifyLeads ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-admin-bg border border-admin-border rounded-admin-sm">
                        <div>
                          <h4 className="text-admin-sm font-semibold text-admin-text">New DSA Registrations</h4>
                          <p className="text-admin-2xs text-admin-subtle">Receive alerts when new DSA partners sign up.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleUserSetting('notifyPartners')}
                          className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${userSettings.notifyPartners ? 'bg-admin-accent' : 'bg-admin-border'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${userSettings.notifyPartners ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Card B: Complete Admin Notification Customization Form */}
                  <form onSubmit={handleSaveSystemNotif} className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1 space-y-4 p-4">
                    <div className="flex items-center justify-between border-b border-admin-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-admin-sm bg-admin-accent-soft flex items-center justify-center text-admin-accent">
                          <Bell size={16} />
                        </div>
                        <div>
                          <h3 className="text-admin-sm font-semibold text-admin-text">System Notification Customization (Admin Only)</h3>
                          <p className="text-admin-2xs text-admin-subtle">Complete control over push & WhatsApp lead notification rules</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-admin-accent-soft text-admin-accent text-admin-2xs font-bold">
                        Admin Only
                      </span>
                    </div>

                    {/* Section 1: Push Notification Rules */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-admin-xs font-bold text-admin-text flex items-center gap-1.5">
                          <span>🌟 New Lead Push Notification Customizations</span>
                        </h4>
                        <label className="flex items-center gap-2 text-admin-xs font-semibold text-admin-text cursor-pointer">
                          <span>Enable Push Notifications</span>
                          <button
                            type="button"
                            onClick={() => setSystemNotif(p => ({ ...p, pushEnabled: !p.pushEnabled }))}
                            className={`w-9 h-5 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 ${systemNotif.pushEnabled ? 'bg-admin-accent' : 'bg-admin-border'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${systemNotif.pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Notification Delay / Timing</label>
                          <select
                            value={systemNotif.delayMinutes}
                            onChange={e => setSystemNotif(p => ({ ...p, delayMinutes: Number(e.target.value) }))}
                            className={selectCls}
                          >
                            <option value={0}>Immediate (0 minutes delay)</option>
                            <option value={1}>1 minute late</option>
                            <option value={2}>2 minutes late</option>
                            <option value={2.5}>2.5 minutes late (Default)</option>
                            <option value={3}>3 minutes late</option>
                            <option value={5}>5 minutes late</option>
                          </select>
                        </div>

                        <div>
                          <label className={labelCls}>Custom Notification Title</label>
                          <input
                            type="text"
                            value={systemNotif.leadTitle}
                            onChange={e => setSystemNotif(p => ({ ...p, leadTitle: e.target.value }))}
                            placeholder="e.g. 🌟 New Lead Received!"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-admin-bg border border-admin-border rounded-admin-sm space-y-2">
                        <p className={labelCls}>Push Notification Body Fields to Include:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-admin-xs font-semibold text-admin-text">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeName}
                              onChange={e => setSystemNotif(p => ({ ...p, includeName: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>Name</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeCity}
                              onChange={e => setSystemNotif(p => ({ ...p, includeCity: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>City / Location</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeMobile}
                              onChange={e => setSystemNotif(p => ({ ...p, includeMobile: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>Mobile</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeType}
                              onChange={e => setSystemNotif(p => ({ ...p, includeType: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>Loan Type</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeAmount}
                              onChange={e => setSystemNotif(p => ({ ...p, includeAmount: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>Loan Amount</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.includeSource}
                              onChange={e => setSystemNotif(p => ({ ...p, includeSource: e.target.checked }))}
                              className="rounded text-admin-accent focus:ring-admin-accent"
                            />
                            <span>Source</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: WhatsApp Notification Rules */}
                    <div className="space-y-3 pt-3 border-t border-admin-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-admin-xs font-bold text-admin-text flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                          <span>💬 WhatsApp Notification Customizations</span>
                        </h4>
                        <label className="flex items-center gap-2 text-admin-xs font-semibold text-admin-text cursor-pointer">
                          <span>Enable WhatsApp Alerts</span>
                          <button
                            type="button"
                            onClick={() => setSystemNotif(p => ({ ...p, whatsappEnabled: !p.whatsappEnabled }))}
                            className={`w-9 h-5 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 ${systemNotif.whatsappEnabled ? 'bg-emerald-600' : 'bg-admin-border'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${systemNotif.whatsappEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </label>
                      </div>

                      <div>
                        <label className={labelCls}>WhatsApp Alert Header</label>
                        <input
                          type="text"
                          value={systemNotif.whatsappAlertHeader}
                          onChange={e => setSystemNotif(p => ({ ...p, whatsappAlertHeader: e.target.value }))}
                          placeholder="e.g. 🌟 New Lead Assigned!"
                          className={inputCls}
                        />
                      </div>

                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-admin-sm space-y-2">
                        <p className={labelCls}>WhatsApp Message Body Fields to Include:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-admin-xs font-semibold text-admin-text">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.whatsappIncludeName}
                              onChange={e => setSystemNotif(p => ({ ...p, whatsappIncludeName: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Lead Name</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.whatsappIncludeCity}
                              onChange={e => setSystemNotif(p => ({ ...p, whatsappIncludeCity: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>City</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.whatsappIncludeMobile}
                              onChange={e => setSystemNotif(p => ({ ...p, whatsappIncludeMobile: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Mobile Number</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.whatsappIncludeType}
                              onChange={e => setSystemNotif(p => ({ ...p, whatsappIncludeType: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Loan Type</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemNotif.whatsappIncludeAmount}
                              onChange={e => setSystemNotif(p => ({ ...p, whatsappIncludeAmount: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Amount</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-admin-border">
                      <AdminButton
                        variant="primary"
                        type="submit"
                        icon={Save}
                        loading={savingSystemNotif}
                        className="text-admin-xs"
                      >
                        {savingSystemNotif ? "Saving Notification Options…" : "Save System Notification Rules"}
                      </AdminButton>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3+: Placeholder for SaaS / Security */}
              {activeTab !== "Company Profile" && activeTab !== "Notification Rules" && (
                <div className="bg-admin-surface border border-admin-border rounded-admin p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-admin-bg rounded-full flex items-center justify-center mx-auto text-admin-subtle">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-admin-base font-bold text-admin-text">{activeTab}</h3>
                    <p className="text-admin-xs text-admin-subtle mt-0.5">
                      This section is managed by the Main Super Admin account.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
