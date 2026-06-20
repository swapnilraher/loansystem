"use client"

import React, { useState, useEffect } from "react"
import { 
  Settings as SettingsIcon, 
  Building2, 
  CreditCard, 
  Shield, 
  Bell, 
  Globe,
  CheckCircle2,
  Lock,
  Smartphone,
  Users
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("Company Profile")
  
  // Notification States
  const [settings, setSettings] = useState({
    notifyLeads: true,
    notifyPartners: true
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load user settings on mount
  useEffect(() => {
    if (!user) return
    
    const loadSettings = async () => {
      setLoadingSettings(true)
      try {
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const data = snap.data()
          setSettings({
            notifyLeads: data.notifyLeads !== false, // default true
            notifyPartners: data.notifyPartners !== false // default true
          })
        }
      } catch (err) {
        console.error("Error loading notification settings:", err)
      } finally {
        setLoadingSettings(false)
      }
    }
    
    loadSettings()
  }, [user])

  // Toggle settings handler
  const toggleSetting = async (key: 'notifyLeads' | 'notifyPartners') => {
    if (!user) return
    
    const updatedValue = !settings[key]
    const updatedSettings = {
      ...settings,
      [key]: updatedValue
    }
    
    setSettings(updatedSettings)
    setSaving(true)
    setSaved(false)
    
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        [key]: updatedValue
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Error updating notification setting:", err)
      // Rollback UI state on error
      setSettings(prev => ({
        ...prev,
        [key]: !updatedValue
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Global Settings</h2>
          <p className="text-slate-500 font-medium tracking-tight">Manage your CRM company profile, billing, and system workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Settings Nav */}
        <div className="hidden lg:flex flex-col lg:col-span-1 space-y-2">
          {[
            { name: 'Company Profile', icon: Building2 },
            { name: 'Subscription Plan', icon: CreditCard },
            { name: 'Roles & Security', icon: Shield },
            { name: 'Notification Rules', icon: Bell },
            { name: 'Webhooks & API', icon: Globe },
            { name: 'Mobile App (PWA)', icon: Smartphone },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === item.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100 hover:text-secondary'}`}
            >
              <item.icon size={18} />
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile Horizontal Settings Nav */}
        <div className="lg:hidden flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth shrink-0 -mx-4 px-4">
          {[
            { name: 'Company Profile', icon: Building2 },
            { name: 'Subscription Plan', icon: CreditCard },
            { name: 'Roles & Security', icon: Shield },
            { name: 'Notification Rules', icon: Bell },
            { name: 'Webhooks & API', icon: Globe },
            { name: 'Mobile App (PWA)', icon: Smartphone },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeTab === item.name ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-100 hover:text-secondary'}`}
            >
              <item.icon size={14} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'Company Profile' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xl font-black text-secondary mb-2">Company Information</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">General business identification</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input type="text" defaultValue="Techstar Money Solution" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email</label>
                  <input type="email" defaultValue="admin@techstar.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Branch</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none">
                    <option>Mumbai Head Office</option>
                    <option>Pune Regional Office</option>
                    <option>Bangalore Sales Branch</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
                  <input type="text" defaultValue="INR (₹)" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auto-Assignment</label>
                  <div className="flex items-center gap-3 h-full pt-2">
                    <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 italic">Round-Robin Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notification Rules' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-xl font-black text-secondary mb-2">Notification Preferences</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your real-time browser push notifications</p>
              </div>

              {loadingSettings ? (
                <div className="py-8 text-center text-slate-400 font-bold text-sm animate-pulse">
                  Loading preferences...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Toggle 1: Leads */}
                  <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100/85 rounded-3xl transition-all hover:bg-slate-100/50">
                    <div className="space-y-1 pr-4">
                      <h4 className="text-sm font-extrabold text-secondary">New Lead Notifications</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-md">Receive background alerts when a customer applies for a loan or submits contact details.</p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('notifyLeads')}
                      className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyLeads ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifyLeads ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 2: Partners */}
                  <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100/85 rounded-3xl transition-all hover:bg-slate-100/50">
                    <div className="space-y-1 pr-4">
                      <h4 className="text-sm font-extrabold text-secondary">New DSA Registrations</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-md">Receive alerts when a new DSA partner registers on the platform.</p>
                    </div>
                    <button 
                      onClick={() => toggleSetting('notifyPartners')}
                      className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 focus:outline-none ${settings.notifyPartners ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.notifyPartners ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {saving && (
                <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest animate-pulse ml-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  <span>Saving preferences...</span>
                </div>
              )}
              {!saving && saved && (
                <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest ml-2">
                  <CheckCircle2 size={16} />
                  <span>Preferences Auto-saved!</span>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'Company Profile' && activeTab !== 'Notification Rules' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center py-16 space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-secondary">{activeTab}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">This section is managed by the Main Super Admin account.</p>
              </div>
            </div>
          )}

          {/* SaaS Plan Card (Shown on Company Profile / general settings) */}
          {(activeTab === 'Company Profile' || activeTab === 'Subscription Plan') && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <div className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg w-fit mb-4">Current Plan</div>
                  <h3 className="text-3xl font-black mb-2 italic">Enterprise SaaS</h3>
                  <p className="text-slate-400 font-medium">Full access to multi-branch automation & custom APIs.</p>
                  <div className="flex items-center gap-6 mt-8">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-primary" />
                      <span className="text-sm font-bold">50 Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-primary" />
                      <span className="text-sm font-bold">10 Branches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={18} className="text-primary" />
                      <span className="text-sm font-bold">256-bit Encryption</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] text-center backdrop-blur-md">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Next Billing Date</p>
                  <p className="text-2xl font-black mb-4 tracking-tight">August 15, 2026</p>
                  <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Manage Billing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

