"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  TrendingUp, 
  Bell, 
  Settings, 
  LogOut, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Gift,
  Search,
  Plus,
  Moon,
  Sun,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Building2,
  CreditCard,
  Briefcase,
  ChevronRight,
  AlertCircle,
  Copy,
  Users,
  Trophy,
  Coins,
  Upload,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore"

export default function UserDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [darkMode, setDarkMode] = useState(false)
  const { user, profile, logout, updateProfile, loading } = useAuth()
  const [uploading, setUploading] = useState<string | null>(null)
  const [showNewApp, setShowNewApp] = useState(false)
  const [userApplications, setUserApplications] = useState<any[]>([])
  const [appLoading, setAppLoading] = useState(true)
  const [referrals, setReferrals] = useState<any[]>([])
  const [referralsLoading, setReferralsLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/?login=true")
    }
  }, [user, loading, router])

  useEffect(() => {
    return () => { isMounted.current = false }
  }, [])

  // Referral Code Generation
  useEffect(() => {
    if (user && profile && !profile.referralCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'TS-';
      for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); }
      updateProfile({ referralCode: code, walletBalance: 0, points: 0 });
    }
  }, [user, profile]);

  // Data Fetching (Optimized to avoid Firestore Index requirement temporarily)
  useEffect(() => {
    if (!user) return;
    
    // Removing orderBy to avoid Index requirement. We'll sort client-side.
    const q = query(
      collection(db, "leads"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (s) => {
      if (!isMounted.current) return;
      
      const apps = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side sorting
      apps.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setUserApplications(apps);
      setAppLoading(false);
    }, (error) => {
      console.error("Firestore leads error:", error);
      if (isMounted.current) setAppLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!profile?.referralCode) return;
    
    // Removing orderBy to avoid Index requirement.
    const q = query(
      collection(db, "users"), 
      where("referredBy", "==", profile.referralCode)
    );

    const unsubscribe = onSnapshot(q, (s) => {
      if (!isMounted.current) return;
      
      const refs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side sorting
      refs.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setReferrals(refs);
      setReferralsLoading(false);
    }, (error) => {
      console.error("Firestore referrals error:", error);
      if (isMounted.current) setReferralsLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.referralCode]);

  const menuItems = [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "applications", label: "Loans", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
    { id: "documents", label: "Vault", icon: ShieldCheck },
    { id: "rewards", label: "Rewards", icon: Gift },
  ]

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-sm font-bold text-slate-400">Loading Account...</p>
        </div>
      </div>
    )
  }

  const userName = profile?.panName || user?.displayName?.split(" ")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 12);
    const parts = value.match(/.{1,4}/g);
    e.target.value = parts ? parts.join(' ') : value;
  };

  const handleNewApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const profileUpdates: any = {};
      const fields = ['panNumber', 'aadharNumber', 'bankName', 'accountHolder', 'mobile', 'panName', 'city'];
      fields.forEach(f => { if (data[f] && !profile?.[f]) profileUpdates[f] = data[f]; });
      if (Object.keys(profileUpdates).length > 0) await updateProfile(profileUpdates);

      await addDoc(collection(db, "leads"), {
        ...data,
        userId: user.uid,
        status: "New Lead",
        source: "User Dashboard",
        category: "Portal",
        phone: data.mobile || profile?.mobile || "",
        email: data.email || profile?.email || user.email || "",
        createdAt: serverTimestamp(),
        fullName: data.panName || profile?.panName || user.displayName || "",
        bankName: data.bankName || profile?.bankName || "",
        accountHolder: data.accountHolder || profile?.accountHolder || ""
      });

      alert("Application submitted successfully!");
      setShowNewApp(false);
      setActiveTab("applications");
    } catch (error) {
      console.error(error);
      alert("Failed to submit.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "rewards":
        return (
          <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {[
                { label: "Wallet Balance", value: `₹${profile?.walletBalance || 0}`, icon: IndianRupee, color: "bg-emerald-500" },
                { label: "Reward Points", value: profile?.points || 0, icon: Coins, color: "bg-amber-500" },
                { label: "Total Referrals", value: referrals.length, icon: Users, color: "bg-blue-500" },
              ].map((stat, i) => (
                <div key={i} className={`p-6 lg:p-8 rounded-[2rem] border shadow-lg ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 lg:mb-6 shadow-lg shadow-blue-900/5`}><stat.icon size={24} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-2xl lg:text-3xl font-black">{stat.value}</h3>
                </div>
              ))}
            </div>
            <div className="bg-primary p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[120px] rounded-full -mr-20 -mt-20" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl lg:text-3xl font-black italic text-white">Invite Friends & Earn</h3>
                <p className="text-blue-100 font-medium max-w-md text-sm lg:text-base">Share your unique code with friends. Earn ₹500 for every successful loan disbursal by your referral.</p>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 p-2 rounded-2xl w-full lg:w-fit">
                   <span className="flex-1 pl-4 font-mono font-black text-lg lg:text-xl tracking-widest">{profile?.referralCode || '...'}</span>
                   <button onClick={() => { navigator.clipboard.writeText(profile?.referralCode || ""); alert("Copied!"); }} className="p-3 bg-white text-primary rounded-xl hover:bg-blue-50 transition-all"><Copy size={18} /></button>
                </div>
              </div>
              <div className="relative z-10 hidden lg:block absolute right-12 bottom-12"><Trophy size={120} className="text-white/20 animate-bounce duration-[3000ms]" /></div>
            </div>
            <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border shadow-xl ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">My Referrals</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{referrals.length} Joined</span>
              </div>
              <div className="space-y-3">
                {referrals.map((ref) => (
                  <div key={ref.id} className={`p-4 rounded-2xl border flex items-center justify-between ${darkMode ? "border-slate-800 bg-slate-800/30" : "border-slate-50 bg-slate-50/50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs uppercase">{(ref.panName || ref.displayName || "U").substring(0,1)}</div>
                      <div>
                        <p className="font-bold text-xs">{ref.panName || ref.displayName || "Anonymous"}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined {ref.createdAt ? (new Date(ref.createdAt)).toLocaleDateString() : 'Today'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
                       <p className="hidden md:block font-black text-xs text-primary">₹0</p>
                    </div>
                  </div>
                ))}
                {referrals.length === 0 && <p className="text-center py-8 text-slate-400 font-bold italic text-sm">No referrals yet. Share your code to start earning!</p>}
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl uppercase">{userInitials}</div>
              <div><h2 className="text-xl lg:text-2xl font-black">Profile Information</h2><p className="text-muted-foreground text-xs lg:text-sm font-medium">Auto-formats enabled for PAN and Aadhar.</p></div>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await updateProfile(Object.fromEntries(formData));
              alert("Profile Updated Successfully!");
            }}>
              <div className="md:col-span-2"><h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Personal Details</h3></div>
              {[
                { label: "Full Name (as per PAN)", name: "panName", value: profile?.panName || user?.displayName || "", icon: User },
                { label: "Email Address", name: "email", value: profile?.email || user?.email || "", icon: Mail },
                { label: "Mobile Number", name: "mobile", value: profile?.mobile || "", icon: Phone },
                { label: "City", name: "city", value: profile?.city || "", icon: MapPin },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{field.label}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"><field.icon size={16} /></div>
                    <input name={field.name} defaultValue={field.value} className={`w-full h-12 lg:h-14 pl-12 pr-4 outline-none border-2 border-transparent rounded-xl lg:rounded-2xl font-bold transition-all ${darkMode ? "bg-slate-800 focus:border-primary text-white" : "bg-slate-50 focus:border-primary"}`} />
                  </div>
                </div>
              ))}
              
              <div className="md:col-span-2 mt-4"><h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Identification & Banking</h3></div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PAN Number</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="panNumber" defaultValue={profile?.panNumber} onChange={(e) => e.target.value = e.target.value.toUpperCase()} maxLength={10} className={`w-full h-12 lg:h-14 pl-12 pr-4 outline-none border-2 border-transparent rounded-xl lg:rounded-2xl font-bold uppercase transition-all ${darkMode ? "bg-slate-800 focus:border-primary text-white" : "bg-slate-50 focus:border-primary"}`} placeholder="ABCDE1234F" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aadhar Number</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="aadharNumber" defaultValue={profile?.aadharNumber} onChange={handleAadharChange} maxLength={14} className={`w-full h-12 lg:h-14 pl-12 pr-4 outline-none border-2 border-transparent rounded-xl lg:rounded-2xl font-bold transition-all ${darkMode ? "bg-slate-800 focus:border-primary text-white" : "bg-slate-50 focus:border-primary"}`} placeholder="XXXX XXXX XXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bank Name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="bankName" defaultValue={profile?.bankName} className={`w-full h-12 lg:h-14 pl-12 pr-4 outline-none border-2 border-transparent rounded-xl lg:rounded-2xl font-bold transition-all ${darkMode ? "bg-slate-800 focus:border-primary text-white" : "bg-slate-50 focus:border-primary"}`} placeholder="e.g. HDFC Bank" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Holder Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="accountHolder" defaultValue={profile?.accountHolder} className={`w-full h-12 lg:h-14 pl-12 pr-4 outline-none border-2 border-transparent rounded-xl lg:rounded-2xl font-bold transition-all ${darkMode ? "bg-slate-800 focus:border-primary text-white" : "bg-slate-50 focus:border-primary"}`} placeholder="As per Bank Records" />
                </div>
              </div>

              <div className="md:col-span-2 pt-4"><Button type="submit" className="w-full lg:w-fit h-14 lg:h-16 px-10 rounded-xl lg:rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Save Profile Changes</Button></div>
            </form>
          </div>
        );

      case "applications":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
            <div className="flex justify-between items-center">
              <h2 className={`text-xl lg:text-2xl font-black ${darkMode ? "text-white" : ""}`}>My Loan Applications</h2>
              {!showNewApp && <Button onClick={() => setShowNewApp(true)} className="bg-primary text-white flex gap-2 h-11 lg:h-12 rounded-xl text-sm font-black"><Plus size={16} /> New Application</Button>}
            </div>

            {showNewApp ? (
              <div className={`p-6 lg:p-8 rounded-[2rem] shadow-xl border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black italic text-primary">Start New Application</h3>
                  <button onClick={() => setShowNewApp(false)} className="text-slate-400 hover:text-rose-500 uppercase text-[10px] font-black tracking-widest">Cancel</button>
                </div>
                
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8" onSubmit={handleNewApplication}>
                  <div className="md:col-span-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-2"><h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><IndianRupee size={16} /> Loan Requirements</h4></div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Product</label>
                    <select name="product" required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`}>
                      <option>Personal Loan</option><option>Business Loan</option><option>Home Loan</option><option>Credit Card</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Required Amount</label>
                    <input name="amount" type="number" required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="e.g. 500000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employment Type</label>
                    <select name="employmentType" required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`}>
                      <option>Salaried</option><option>Business Owner</option><option>Self Employed Professional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Net Income</label>
                    <input name="income" type="number" required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="Enter amount" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Name as per PAN</label>
                    <input name="panName" defaultValue={profile?.panName || user?.displayName || ""} required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="Enter Full Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">PAN Number</label>
                    <input name="panNumber" defaultValue={profile?.panNumber} required onChange={(e) => e.target.value = e.target.value.toUpperCase()} maxLength={10} className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold uppercase border-2 border-transparent focus:border-primary transition-all`} placeholder="ABCDE1234F" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Aadhar Number</label>
                    <input name="aadharNumber" defaultValue={profile?.aadharNumber} required onChange={handleAadharChange} maxLength={14} className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="XXXX XXXX XXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Mobile Number</label>
                    <input name="mobile" defaultValue={profile?.mobile} required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="10 Digit Number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary">Email Address</label>
                    <input name="email" defaultValue={profile?.email || user?.email || ""} required className={`w-full h-12 lg:h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl lg:rounded-2xl font-bold border-2 border-transparent focus:border-primary transition-all`} placeholder="example@mail.com" />
                  </div>

                  <div className="md:col-span-2 border-b border-slate-100 dark:border-slate-800 pb-4 mt-4 mb-2"><h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><User size={16} /> Verification Information</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Please provide missing details.</p></div>
                  {!profile?.mobile && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">Mobile Number</label>
                      <input name="mobile" required className="w-full h-12 lg:h-14 px-4 bg-rose-50/20 border-2 border-rose-100 rounded-xl lg:rounded-2xl font-bold" placeholder="10 Digit Number" />
                    </div>
                  )}
                  {!profile?.bankName && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">Bank Name</label>
                      <input name="bankName" required className="w-full h-12 lg:h-14 px-4 bg-rose-50/20 border-2 border-rose-100 rounded-xl lg:rounded-2xl font-bold" placeholder="e.g. ICICI Bank" />
                    </div>
                  )}
                  {!profile?.accountHolder && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">Account Holder Name</label>
                      <input name="accountHolder" required className="w-full h-12 lg:h-14 px-4 bg-rose-50/20 border-2 border-rose-100 rounded-xl lg:rounded-2xl font-bold" placeholder="As per Bank Records" />
                    </div>
                  )}
                  {!profile?.city && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">City</label>
                      <input name="city" required className="w-full h-12 lg:h-14 px-4 bg-rose-50/20 border-2 border-rose-100 rounded-xl lg:rounded-2xl font-bold" placeholder="Your City Name" />
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-4 mt-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2"><Upload size={16} /> Required Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['PAN Card', 'Aadhar Front', 'Salary Slip', 'Bank Statement'].map((docName) => (
                        <div key={docName} className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-primary transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all"><FileText size={16} /></div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{docName}</span>
                           </div>
                           <input type="file" id={`app-doc-${docName}`} className="hidden" />
                           <label htmlFor={`app-doc-${docName}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all">Choose</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6"><Button type="submit" className="w-full h-14 lg:h-16 bg-primary text-white font-black text-lg rounded-xl lg:rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all">Submit Loan Application</Button></div>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                {appLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : userApplications.length === 0 ? (
                  <div className={`p-12 text-center rounded-[2rem] border border-dashed ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                    <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="font-bold text-slate-400 tracking-tight text-sm">No applications found. Start your first application now!</p>
                  </div>
                ) : (
                  userApplications.map((app) => (
                    <div key={app.id} className={`p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border transition-all flex flex-col md:flex-row items-center justify-between gap-4 group ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0"><FileText size={20} /></div>
                        <div>
                          <h4 className="font-black text-sm lg:text-lg">{app.product}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.id.substring(0,8).toUpperCase()} • {app.createdAt?.toDate?.()?.toLocaleDateString() || 'Today'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                        <p className="font-black text-sm lg:text-base text-primary">₹{parseInt(app.amount).toLocaleString()}</p>
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'Approved' ? 'bg-green-50 text-green-600' : app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                          {app.status}
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-primary transition-colors hidden md:block" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );

      case "documents":
        return (
          <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
             <div className="flex justify-between items-center mb-8">
               <div><h2 className="text-xl lg:text-2xl font-black">Document Vault</h2><p className="text-muted-foreground text-xs font-medium">Your verified and pending documents.</p></div>
               <Button className="h-10 lg:h-12 rounded-xl bg-primary text-white font-black text-xs uppercase"><Plus size={16} /> Upload</Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { name: "PAN Card", status: profile?.docs?.pan ? "Verified" : "Missing", icon: ShieldCheck, type: "Identification" },
                  { name: "Aadhar Card", status: profile?.docs?.aadharFront ? "Verified" : "Missing", icon: CreditCard, type: "Address Proof" },
                  { name: "Salary Slips", status: profile?.docs?.salarySlips ? "Verified" : "Missing", icon: FileText, type: "Income Proof" },
                  { name: "Bank Statement", status: "Missing", icon: Building2, type: "Banking" }
                ].map((doc) => (
                  <div key={doc.name} className={`p-5 rounded-2xl border-2 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-white"} space-y-4 transition-all hover:border-primary group hover:bg-white dark:hover:bg-slate-900`}>
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all"><doc.icon size={20} /></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${doc.status === "Verified" ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"}`}>{doc.status}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{doc.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.type}</p>
                    </div>
                    <button className="w-full h-10 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Upload Now</button>
                  </div>
                ))}
             </div>
          </div>
        );

      default:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0 space-y-6 lg:space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { label: "Total Applications", value: userApplications.length, icon: FileText, color: "bg-blue-500", trend: "Live Tracking" },
                { label: "Credit Score", value: "785", icon: TrendingUp, color: "bg-emerald-500", trend: "Excellent" },
                { label: "Referral Earn", value: `₹${profile?.walletBalance || 0}`, icon: Gift, color: "bg-amber-500", trend: "Withdraw Ready" },
                { label: "Active Loans", value: "₹5,00,000", icon: IndianRupee, color: "bg-rose-500", trend: "1 Active EMI" },
              ].map((stat, i) => (
                <div key={i} className={`p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-xl border transition-all ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 hover:-translate-y-1"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-lg`}><stat.icon size={20} /></div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h3 className="text-xl lg:text-2xl font-black mb-1">{stat.value}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{stat.trend}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className={`lg:col-span-2 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg lg:text-xl font-black italic">Recent Activity</h3>
                  <button className="text-[10px] font-black text-primary uppercase" onClick={() => setActiveTab("applications")}>View All</button>
                </div>
                <div className="space-y-3">
                  {userApplications.slice(0, 3).map((app) => (
                    <div key={app.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${darkMode ? "border-slate-800 bg-slate-800/30" : "border-slate-50 bg-slate-50/50"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText size={18} /></div>
                        <div><p className="font-bold text-xs">{app.product}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{app.status}</p></div>
                      </div>
                      <p className="font-black text-xs text-primary">₹{parseInt(app.amount).toLocaleString()}</p>
                    </div>
                  ))}
                  {userApplications.length === 0 && <p className="text-center py-6 text-slate-400 text-sm font-medium italic">No recent applications found.</p>}
                </div>
              </div>
              <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"}`}>
                 <h3 className="text-lg lg:text-xl font-black mb-6">Verification Status</h3>
                 <div className="space-y-4">
                   {[{ name: "PAN Card", status: profile?.docs?.pan ? "Verified" : "Missing", color: profile?.docs?.pan ? "text-green-500" : "text-rose-500" }, { name: "Aadhar Card", status: profile?.docs?.aadharFront ? "Verified" : "Missing", color: profile?.docs?.aadharFront ? "text-green-500" : "text-rose-500" }, { name: "Bank Info", status: profile?.bankName ? "Linked" : "Missing", color: profile?.bankName ? "text-blue-500" : "text-rose-500" }].map((doc, i) => (
                     <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">{doc.name}</span>
                        <span className={`font-black uppercase tracking-tighter ${doc.color}`}>{doc.status}</span>
                     </div>
                   ))}
                   <div className="pt-4"><Button onClick={() => setActiveTab("documents")} className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 text-[9px] font-black uppercase hover:bg-slate-50 transition-all">Go to Document Vault</Button></div>
                 </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className={`min-h-screen flex flex-col lg:flex-row ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-secondary"}`}>
      {/* Desktop Sidebar */}
      <aside className={`w-72 hidden lg:flex flex-col border-r sticky top-0 h-screen p-8 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
        <div className="flex items-center gap-3 mb-12"><div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={24} /></div><span className="text-2xl font-black italic">TechStar</span></div>
        <nav className="flex-1 space-y-2">{menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setShowNewApp(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-xl shadow-primary/20" : `hover:bg-primary/5 ${darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-primary"}`}`}><item.icon size={20} />{item.label}</button>
          ))}</nav>
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">{darkMode ? <Sun size={20} /> : <Moon size={20} />}{darkMode ? "Light Mode" : "Dark Mode"}</button>
          <button onClick={() => logout()} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all"><LogOut size={20} />Sign Out</button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className={`lg:hidden flex items-center justify-between p-4 sticky top-0 z-30 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"} border-b`}>
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><ShieldCheck size={18} /></div><span className="text-lg font-black italic">TechStar</span></div>
        <div className="flex items-center gap-3">
           <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
           <button onClick={() => logout()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 transition-colors" title="Logout"><LogOut size={18} /></button>
           <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs overflow-hidden">{user?.photoURL ? <img src={user.photoURL} alt={userName} className="w-full h-full object-cover" /> : userInitials}</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <header className="hidden lg:flex justify-between items-center mb-10">
          <div><h1 className="text-3xl font-black italic">Welcome, {userName}</h1><p className="text-muted-foreground font-medium">Dashboard Overview</p></div>
          <div className="flex items-center gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search..." className={`pl-10 pr-4 h-11 rounded-xl outline-none border transition-all w-64 ${darkMode ? "bg-slate-900 border-slate-800 focus:border-primary text-white" : "bg-white border-slate-100 focus:border-primary shadow-sm"}`} /></div>
            <button className="w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800"><Bell size={20} /></button>
          </div>
        </header>

        {/* Mobile Welcome Title */}
        <div className="lg:hidden mb-6">
           <h1 className="text-2xl font-black italic">Hello, {userName} 👋</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your financial overview</p>
        </div>

        {renderContent()}
      </div>

      {/* Mobile Bottom Navigation (Native App Style) */}
      <nav className={`lg:hidden fixed bottom-4 left-4 right-4 h-16 rounded-[1.5rem] flex items-center justify-around px-4 z-40 border shadow-2xl backdrop-blur-xl ${darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        {menuItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id); setShowNewApp(false); }}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === item.id ? "text-primary scale-110" : "text-slate-400"}`}
          >
            <item.icon size={activeTab === item.id ? 22 : 20} className={activeTab === item.id ? "stroke-[2.5px]" : ""} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}
