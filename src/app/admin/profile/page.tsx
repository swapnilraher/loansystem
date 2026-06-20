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
  Users,
  Briefcase,
  AlertCircle
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
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 relative overflow-hidden pb-12">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-primary/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-[10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-blue-500/5 rounded-full blur-[80px] md:blur-[130px] pointer-events-none z-0" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent italic">
            My Profile & Preferences
          </h2>
          <p className="text-slate-500 font-semibold text-xs md:text-sm mt-1 leading-normal">
            Update personal info, monitor processing activities, and customize notification rules.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm text-center py-24 text-slate-400 font-bold text-sm animate-pulse">
          Loading profile dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
          
          {/* LEFT/MID COLUMN: Personal Details & Notification Rules */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* Details Form Card */}
            <form onSubmit={handleSaveProfile} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 md:space-y-8 transition-all hover:shadow-md duration-300">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <User size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-md md:text-lg font-black text-secondary">Personal Details</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Edit system identity credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full pl-11 pr-5 py-3 bg-slate-50/80 border border-slate-100 hover:bg-slate-50 focus:bg-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/45 transition-all outline-none" 
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      placeholder="Enter mobile number"
                      className="w-full pl-11 pr-5 py-3 bg-slate-50/80 border border-slate-100 hover:bg-slate-50 focus:bg-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/45 transition-all outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Email (Read-Only) */}
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      value={profileData.email} 
                      disabled
                      className="w-full pl-11 pr-5 py-3 bg-slate-100/60 border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-slate-450 focus:outline-none select-none" 
                    />
                  </div>
                </div>
                
                {/* Role (Read-Only) */}
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={profileData.role} 
                      disabled
                      className="w-full pl-11 pr-5 py-3 bg-slate-100/60 border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-slate-450 focus:outline-none select-none" 
                    />
                  </div>
                </div>
                
                {/* Status (Read-Only) */}
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                  <div className="flex items-center h-[46px] pl-1">
                    <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-emerald-100">
                      {profileData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="w-full sm:w-fit px-8 py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  {savingProfile ? "Saving Details..." : "Update Details"}
                </button>
                {savedProfile && (
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest animate-in fade-in duration-300">
                    <CheckCircle2 size={16} className="stroke-[2.5]" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}
              </div>
            </form>

            {/* Notification Rules Card */}
            <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 md:space-y-8 transition-all hover:shadow-md duration-300">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Bell size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-md md:text-lg font-black text-secondary">Notification preferences</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manage real-time browser push notifications</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Leads Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/30 transition-all gap-4 sm:gap-0">
                  <div className="space-y-1 pr-0 sm:pr-4">
                    <h4 className="text-xs md:text-sm font-extrabold text-secondary">New Lead Notifications</h4>
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 leading-relaxed max-w-md">Receive background alerts on your device when customer applications are created.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => toggleSetting('notifyLeads')}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyLeads ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifyLeads ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Partners Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/30 transition-all gap-4 sm:gap-0">
                  <div className="space-y-1 pr-0 sm:pr-4">
                    <h4 className="text-xs md:text-sm font-extrabold text-secondary">New DSA Registrations</h4>
                    <p className="text-[11px] md:text-xs font-bold text-slate-400 leading-relaxed max-w-md">Receive alerts when new DSA partners sign up on the connector portal.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => toggleSetting('notifyPartners')}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyPartners ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifyPartners ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Status indicator bar */}
              {(savingSettings || savedSettings) && (
                <div className="pt-2 border-t border-slate-50 flex items-center justify-end">
                  {savingSettings && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                      <span>Saving preferences...</span>
                    </div>
                  )}
                  {!savingSettings && savedSettings && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <CheckCircle2 size={14} className="stroke-[2.5]" />
                      <span>Preferences saved!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Performance Metrics & Activity Log */}
          <div className="space-y-6 md:space-y-8">
            
            {/* Performance Stats Cards */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden space-y-6 md:space-y-8 border border-white/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none z-0" />
              
              <div className="relative z-10">
                <h3 className="text-base md:text-lg font-black italic tracking-wide">Accomplishments</h3>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time statistics deck</p>
              </div>

              <div className="grid grid-cols-1 gap-4 relative z-10">
                {/* Metric 1 */}
                <div className="p-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl md:rounded-2xl flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <TrendingUp size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-450 uppercase tracking-widest">Conversion Index</p>
                    <p className="text-base md:text-lg font-black italic mt-0.5">{conversionRate}%</p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl md:rounded-2xl flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                    <Activity size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-450 uppercase tracking-widest">Actions Logged</p>
                    <p className="text-base md:text-lg font-black italic mt-0.5">{userActivities.length}</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl md:rounded-2xl flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-450 shadow-inner">
                    <Users size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-450 uppercase tracking-widest">System Leads</p>
                    <p className="text-base md:text-lg font-black italic mt-0.5">{leads.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log Card */}
            <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 transition-all hover:shadow-md duration-300">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <h3 className="text-sm md:text-base font-black text-secondary">My Activity Log</h3>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Recent CRM operations</p>
                </div>
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                  <Activity size={14} />
                </div>
              </div>

              {/* Scrollable list */}
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                {userActivities.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={20} className="text-slate-350" />
                    <span>No operations logged yet.</span>
                  </div>
                ) : (
                  userActivities.map((act, index) => {
                    const isStatusChange = act.details?.toLowerCase().includes("status")
                    const isNote = act.details?.toLowerCase().includes("note")
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3.5 border rounded-xl space-y-2 transition-all hover:translate-x-0.5 duration-200 ${
                          isStatusChange 
                            ? 'bg-emerald-50/20 border-emerald-100/50 border-l-4 border-l-emerald-500' 
                            : isNote
                              ? 'bg-amber-50/20 border-amber-100/50 border-l-4 border-l-amber-500'
                              : 'bg-slate-50/50 border-slate-100 border-l-4 border-l-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{act.details || act.text}</p>
                        </div>
                        <div className="flex items-center justify-between text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          <span>ID: {act.leadId?.substring(0, 8) || "System"}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={8} />
                            {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
