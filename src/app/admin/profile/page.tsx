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
  Award,
  Users
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, onSnapshot } from "firebase/firestore"
import { useLeads } from "@/lib/hooks/useLeads"

export default function ProfilePage() {
  const { user, adminRole } = useAuth()
  const { leads } = useLeads()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings] = useState(false)
  const [activities, setActivities] = useState<any[]>([])

  // Profile data states
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "Staff",
    status: "Active"
  })

  // Notification settings states
  const [settings, setSettings] = useState({
    notifyLeads: true,
    notifyPartners: true
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

        if (snap.exists()) {
          const data = snap.data()
          nameVal = data.displayName || data.name || nameVal
          phoneVal = data.mobileNumber || data.phone || ""
          leadsVal = data.notifyLeads !== false
          partnersVal = data.notifyPartners !== false
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
          notifyPartners: partnersVal
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
    setSavedProfile(false)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        displayName: profileData.name,
        name: profileData.name,
        mobileNumber: profileData.phone,
        phone: profileData.phone
      })
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    } catch (err) {
      console.error("Error updating profile details:", err)
    } finally {
      setSavingProfile(false)
    }
  }

  // Toggle notification setting handler
  const toggleSetting = async (key: 'notifyLeads' | 'notifyPartners') => {
    if (!user) return
    const updatedValue = !settings[key]
    setSettings(prev => ({ ...prev, [key]: updatedValue }))
    setSavingSettings(true)
    setSavedSettings(false)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        [key]: updatedValue
      })
      setSavedSettings(true)
      setTimeout(() => setSavedSettings(false), 3000)
    } catch (err) {
      console.error("Error updating setting:", err)
      // Rollback on error
      setSettings(prev => ({ ...prev, [key]: !updatedValue }))
    } finally {
      setSavingSettings(false)
    }
  }

  // Filter activities logged by the current admin user
  const currentUserName = profileData.name || user?.displayName || user?.email || ""
  const userActivities = activities.filter(act => {
    return act.userName && currentUserName && act.userName.toLowerCase().includes(currentUserName.toLowerCase())
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Calculate some performance metrics
  const conversionRate = leads.length > 0 
    ? Math.round((leads.filter(l => l.status === 'Disbursed' || l.status === 'Converted').length / leads.length) * 100) 
    : 85 // Fallback score if no leads exist

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-secondary tracking-tight">My Profile & Settings</h2>
        <p className="text-slate-500 font-medium">Manage your personal details, monitor performance metrics, and configure notification rules.</p>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center py-24 text-slate-400 font-bold text-sm animate-pulse">
          Loading profile dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID COLUMN: Personal Details & Notification Rules */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Details Form */}
            <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-secondary mb-1">Personal Details</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update your profile parameters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      placeholder="Enter mobile number"
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={profileData.email} 
                      disabled
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-450 focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={profileData.role} 
                      disabled
                      className="w-full pl-12 pr-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-450 focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                  <div className="relative flex items-center h-12 pl-2">
                    <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-full">
                      {profileData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="px-8 py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/95 hover:shadow-primary/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Details"}
                </button>
                {savedProfile && (
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest animate-in fade-in duration-300">
                    <CheckCircle2 size={16} />
                    <span>Profile Saved!</span>
                  </div>
                )}
              </div>
            </form>

            {/* Notification Rules */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-secondary mb-1">Notification Preferences</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toggle real-time push notification rules</p>
              </div>

              <div className="space-y-4">
                {/* Leads Toggle */}
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/30 transition-colors">
                  <div className="pr-4 space-y-1">
                    <h4 className="text-sm font-extrabold text-secondary">New Lead Notifications</h4>
                    <p className="text-xs font-bold text-slate-400 leading-normal max-w-md">Receive device push alerts when new loan application leads are generated.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => toggleSetting('notifyLeads')}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyLeads ? 'bg-primary' : 'bg-slate-350'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${settings.notifyLeads ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Partners Toggle */}
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/30 transition-colors">
                  <div className="pr-4 space-y-1">
                    <h4 className="text-sm font-extrabold text-secondary">New DSA Registrations</h4>
                    <p className="text-xs font-bold text-slate-400 leading-normal max-w-md">Receive device push alerts when new DSA partners sign up on the platform.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => toggleSetting('notifyPartners')}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyPartners ? 'bg-primary' : 'bg-slate-350'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${settings.notifyPartners ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {savingSettings && (
                <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest animate-pulse ml-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  <span>Saving preferences...</span>
                </div>
              )}
              {!savingSettings && savedSettings && (
                <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest ml-2">
                  <CheckCircle2 size={16} />
                  <span>Preferences Saved!</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Performance Metrics & Activity Log */}
          <div className="space-y-8">
            
            {/* Performance Stats Cards */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[90px] rounded-full pointer-events-none" />
              
              <div>
                <h3 className="text-lg font-black italic tracking-wide">Performance Metrics</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time statistics overview</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Metric 1 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Index</p>
                    <p className="text-lg font-black italic mt-0.5">{conversionRate}%</p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions Logged</p>
                    <p className="text-lg font-black italic mt-0.5">{userActivities.length}</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Leads</p>
                    <p className="text-lg font-black italic mt-0.5">{leads.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-secondary">My Activity Log</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent actions recorded in CRM</p>
              </div>

              <div className="max-h-[310px] overflow-y-auto pr-1 space-y-3 no-scrollbar scroll-smooth">
                {userActivities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-bold text-xs">
                    No recent activities recorded.
                  </div>
                ) : (
                  userActivities.map((act, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 hover:bg-slate-100/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700 leading-normal">{act.details || act.text || "Updated Lead Status"}</p>
                        <Clock className="text-slate-400 shrink-0 mt-0.5" size={10} />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <span>Lead ID: {act.leadId?.substring(0, 8) || "N/A"}</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
