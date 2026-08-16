"use client"

import React, { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Lock,
  Save,
  Key,
  MessageSquare,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, onSnapshot } from "firebase/firestore"
import { useLeads } from "@/lib/hooks/useLeads"
import {
  AdminButton,
  PageHeader,
  SkeletonRows,
  StatCard,
  useToast,
} from "@/components/admin/ui"

export default function ProfilePage() {
  const { user, adminRole } = useAuth()
  const { leads } = useLeads()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [activities, setActivities] = useState<any[]>([])

  // Profile data states
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "Staff",
    status: "Active"
  })

  // Password change state
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passForm.newPassword.length < 6) {
      toast.push({ tone: "danger", title: "New password must be at least 6 characters." })
      return
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.push({ tone: "danger", title: "New passwords do not match." })
      return
    }

    setUpdatingPassword(true)
    try {
      const idToken = user ? await user.getIdToken() : ""
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Password update failed.")
      }

      toast.push({ tone: "success", title: "Password updated successfully!" })
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast.push({ tone: "danger", title: err.message || "Password update failed." })
    } finally {
      setUpdatingPassword(false)
    }
  }

  // Notification settings states
  const [settings, setSettings] = useState({
    notifyLeads: true,
    notifyPartners: true,
    notifyWhatsappLeads: true,
    notifyWhatsappUpdates: true,
  })

  // Fetch activities on mount
  useEffect(() => {
    const q = query(collection(db, "lead_activities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // Load user profile & notification settings
  useEffect(() => {
    if (!user) return

    const loadProfileAndSettings = async () => {
      setLoading(true)
      try {
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)

        let nameVal = user.displayName || ""
        let phoneVal = ""
        let leadsVal = true
        let partnersVal = true
        let waLeadsVal = true
        let waUpdatesVal = true

        if (snap.exists()) {
          const data = snap.data()
          nameVal = data.displayName || data.name || nameVal
          phoneVal = data.mobileNumber || data.phone || ""
          leadsVal = data.notifyLeads !== false
          partnersVal = data.notifyPartners !== false
          waLeadsVal = data.notifyWhatsappLeads !== false
          waUpdatesVal = data.notifyWhatsappUpdates !== false
        }

        setProfileData({
          name: nameVal,
          phone: phoneVal,
          email: user.email || "",
          role: adminRole || "Staff",
          status: "Active"
        })

        setSettings({
          notifyLeads: leadsVal,
          notifyPartners: partnersVal,
          notifyWhatsappLeads: waLeadsVal,
          notifyWhatsappUpdates: waUpdatesVal,
        })
      } catch (err) {
        console.error("Error loading profile:", err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileAndSettings()
  }, [user, adminRole])

  // Save profile changes handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        displayName: profileData.name,
        name: profileData.name,
        mobileNumber: profileData.phone,
        phone: profileData.phone
      })
      toast.push({ tone: "success", title: "Profile updated successfully!" })
    } catch (err) {
      console.error("Error updating profile details:", err)
      toast.push({ tone: "danger", title: "Could not update profile." })
    } finally {
      setSavingProfile(false)
    }
  }

  // Toggle notification setting handler
  const toggleSetting = async (key: 'notifyLeads' | 'notifyPartners' | 'notifyWhatsappLeads' | 'notifyWhatsappUpdates') => {
    if (!user) return
    const updatedValue = !settings[key]
    setSettings(prev => ({ ...prev, [key]: updatedValue }))
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, { [key]: updatedValue })
      toast.push({ tone: "success", title: "Preference saved." })
    } catch (err) {
      console.error("Error updating setting:", err)
      setSettings(prev => ({ ...prev, [key]: !updatedValue }))
      toast.push({ tone: "danger", title: "Could not save preference." })
    }
  }

  // Filter activities logged by the current admin user
  const currentUserName = profileData.name || user?.displayName || user?.email || ""
  const userActivities = activities.filter(act => {
    return act.userName && currentUserName && act.userName.toLowerCase().includes(currentUserName.toLowerCase())
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Calculate some performance metrics
  const disbursedCount = leads.filter(l => l.status === 'Disbursed' || l.status === 'Converted').length
  const conversionRate = leads.length > 0
    ? Math.round((disbursedCount / leads.length) * 100)
    : 0

  const labelCls = "block text-admin-2xs font-semibold text-admin-subtle uppercase tracking-wide mb-1"
  const inputCls = "admin-focus w-full h-9 px-3 pl-9 text-admin-sm font-medium text-admin-text bg-admin-bg border border-admin-border rounded-admin-sm focus:border-admin-accent outline-none transition-colors"
  const readOnlyCls = "w-full h-9 px-3 pl-9 text-admin-sm font-medium text-admin-muted bg-admin-surface-2 border border-admin-border rounded-admin-sm select-none"

  return (
    <div className="space-y-3">
      <PageHeader
        title="My Profile"
        subtitle="Manage personal details, security credentials, notification preferences, and track your performance."
        breadcrumbs={[{ label: "System" }, { label: "Profile" }]}
      />

      {loading ? (
        <SkeletonRows rows={8} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* ─── LEFT COLUMN: DETAILS + SECURITY + NOTIFICATIONS ─── */}
          <div className="lg:col-span-2 space-y-3">

            {/* ▸ Personal Details Card */}
            <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-admin-border">
                <div className="w-8 h-8 rounded-admin-sm bg-admin-accent-soft flex items-center justify-center text-admin-accent">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-admin-sm font-semibold text-admin-text">Personal Details</h3>
                  <p className="text-admin-2xs text-admin-subtle">Edit your identity credentials</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                        required
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="Enter mobile number"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input type="email" value={profileData.email} disabled className={readOnlyCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Access Role</label>
                    <div className="relative">
                      <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input type="text" value={profileData.role} disabled className={readOnlyCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Account Status</label>
                    <div className="flex items-center h-9">
                      <span className="inline-flex items-center gap-1.5 rounded-admin-sm bg-tone-success-soft px-2.5 py-1 text-admin-2xs font-bold text-tone-success-fg border border-tone-success-fg/20">
                        <CheckCircle2 size={12} />
                        {profileData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-admin-border">
                  <AdminButton
                    variant="primary"
                    type="submit"
                    icon={Save}
                    loading={savingProfile}
                    className="text-admin-xs"
                  >
                    {savingProfile ? "Saving…" : "Update Details"}
                  </AdminButton>
                </div>
              </form>
            </section>

            {/* ▸ Security & Password Card */}
            <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-admin-border">
                <div className="w-8 h-8 rounded-admin-sm bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-admin-sm font-semibold text-admin-text">Security & Password</h3>
                  <p className="text-admin-2xs text-admin-subtle">Change your account password anytime</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Current Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input
                        type="password"
                        required
                        placeholder="Current password"
                        value={passForm.currentPassword}
                        onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>New Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={passForm.newPassword}
                        onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-subtle" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-type new password"
                        value={passForm.confirmPassword}
                        onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-admin-border">
                  <AdminButton
                    variant="primary"
                    type="submit"
                    icon={Key}
                    loading={updatingPassword}
                    className="text-admin-xs bg-amber-600 hover:bg-amber-700 border-amber-600"
                  >
                    {updatingPassword ? "Updating…" : "Change Password"}
                  </AdminButton>
                </div>
              </form>
            </section>

            {/* ▸ Notification Preferences Card */}
            <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-admin-border">
                <div className="w-8 h-8 rounded-admin-sm bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-admin-sm font-semibold text-admin-text">Notification Preferences</h3>
                  <p className="text-admin-2xs text-admin-subtle">Manage real-time browser push notifications</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Lead Notifications Toggle */}
                <div className="flex items-center justify-between p-3 bg-admin-bg border border-admin-border rounded-admin-sm">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-admin-sm font-semibold text-admin-text">New Lead Notifications</h4>
                    <p className="text-admin-2xs text-admin-subtle mt-0.5">Receive browser push alerts when customer applications are created.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('notifyLeads')}
                    className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${settings.notifyLeads ? 'bg-admin-accent' : 'bg-admin-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.notifyLeads ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Partner Notifications Toggle */}
                <div className="flex items-center justify-between p-3 bg-admin-bg border border-admin-border rounded-admin-sm">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-admin-sm font-semibold text-admin-text">New DSA Registrations</h4>
                    <p className="text-admin-2xs text-admin-subtle mt-0.5">Receive browser alerts when new DSA partners sign up on the connector portal.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('notifyPartners')}
                    className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${settings.notifyPartners ? 'bg-admin-accent' : 'bg-admin-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.notifyPartners ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* WhatsApp Lead Alerts Toggle */}
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-admin-sm">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                      <h4 className="text-admin-sm font-semibold text-admin-text">WhatsApp Lead Alerts</h4>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">WhatsApp</span>
                    </div>
                    <p className="text-admin-2xs text-admin-subtle mt-0.5">Receive instant WhatsApp messages on your mobile when a new lead is assigned.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('notifyWhatsappLeads')}
                    className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${settings.notifyWhatsappLeads ? 'bg-emerald-600' : 'bg-admin-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.notifyWhatsappLeads ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* WhatsApp Status Updates Toggle */}
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-admin-sm">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                      <h4 className="text-admin-sm font-semibold text-admin-text">WhatsApp Status & Activity Updates</h4>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">WhatsApp</span>
                    </div>
                    <p className="text-admin-2xs text-admin-subtle mt-0.5">Receive WhatsApp updates when assigned leads change stage or undergo key updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('notifyWhatsappUpdates')}
                    className={`w-11 h-6 rounded-full relative p-0.5 transition-colors duration-200 shrink-0 focus:outline-none cursor-pointer ${settings.notifyWhatsappUpdates ? 'bg-emerald-600' : 'bg-admin-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${settings.notifyWhatsappUpdates ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ─── RIGHT COLUMN: STATS + ACTIVITY LOG ─── */}
          <div className="space-y-3">

            {/* ▸ Performance Stats */}
            <div className="grid grid-cols-1 gap-3">
              <StatCard
                label="Conversion Rate"
                value={`${conversionRate}%`}
                hint={`${leads.length} total leads`}
                icon={TrendingUp}
                tone="success"
                loading={false}
              />
              <StatCard
                label="Actions Logged"
                value={String(userActivities.length)}
                hint="CRM operations"
                icon={Activity}
                tone="info"
                loading={false}
              />
              <StatCard
                label="Total Leads"
                value={String(leads.length)}
                hint={`${disbursedCount} disbursed`}
                icon={Users}
                tone="violet"
                loading={false}
              />
            </div>

            {/* ▸ Activity Log Card */}
            <section className="bg-admin-surface border border-admin-border rounded-admin shadow-admin-1">
              <div className="flex items-center justify-between px-4 py-3 border-b border-admin-border">
                <div>
                  <h3 className="text-admin-sm font-semibold text-admin-text">My Activity Log</h3>
                  <p className="text-admin-2xs text-admin-subtle">Recent CRM operations</p>
                </div>
                <div className="w-7 h-7 bg-admin-bg rounded-admin-sm flex items-center justify-center text-admin-subtle">
                  <Activity size={14} />
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto p-3 space-y-2">
                {userActivities.length === 0 ? (
                  <div className="py-12 text-center text-admin-subtle">
                    <AlertCircle size={20} className="mx-auto mb-2 text-admin-muted" />
                    <p className="text-admin-xs font-medium">No operations logged yet.</p>
                  </div>
                ) : (
                  userActivities.slice(0, 20).map((act, index) => {
                    const isStatusChange = act.details?.toLowerCase().includes("status")
                    const isNote = act.details?.toLowerCase().includes("note")

                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-admin-sm border space-y-1 transition-colors hover:bg-admin-bg ${
                          isStatusChange
                            ? 'border-l-2 border-l-tone-success-fg border-admin-border bg-tone-success-soft/30'
                            : isNote
                              ? 'border-l-2 border-l-amber-500 border-admin-border bg-amber-500/5'
                              : 'border-l-2 border-l-admin-accent border-admin-border'
                        }`}
                      >
                        <p className="text-admin-xs font-medium text-admin-text leading-relaxed">
                          {act.details || act.text}
                        </p>
                        <div className="flex items-center justify-between text-admin-2xs text-admin-subtle">
                          <span className="admin-num">ID: {act.leadId?.substring(0, 8) || "System"}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
