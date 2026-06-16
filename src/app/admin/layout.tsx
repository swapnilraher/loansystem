"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"

import { Loader2, ShieldCheck, LayoutDashboard, Briefcase, Network, Menu } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, adminRole, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Real-time browser push notifications for new leads and new DSA partners
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || pathname === "/admin/login" || !user || !adminRole) return;

    // Request notification permission if not yet granted
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const sendPushNotification = (title: string, body: string) => {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/img/logo.jpeg",
        });
        
        // Play notification sound
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-200.mp3");
          audio.volume = 0.4;
          audio.play();
        } catch (e) {
          console.log("Audio play blocked by browser autoplay policy");
        }
      }
    };

    const sessionStartTime = Date.now();
    let leadsInitial = true;
    let partnersInitial = true;

    // 1. Listen to new leads
    const qLeads = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      if (leadsInitial) {
        leadsInitial = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Safety check for creation time to avoid duplicate notifications on local writes/initial sync
          const createdAt = data.createdAt;
          const docTime = createdAt?.toMillis ? createdAt.toMillis() : (createdAt?.seconds ? createdAt.seconds * 1000 : Date.now());
          if (docTime > sessionStartTime - 5000) {
            sendPushNotification(
              "🌟 नवीन लीड दाखल!",
              `नाव: ${data.name || "अपरिचित"}\nकर्ज प्रकार: ${data.type || "N/A"}\nरक्कम: ₹${data.amount || "0"}`
            );
          }
        }
      });
    }, (err) => {
      console.error("Error listening to leads for notifications:", err);
    });

    // 2. Listen to new DSA partners
    const qPartners = query(collection(db, "users"), where("role", "==", "partner"));
    const unsubPartners = onSnapshot(qPartners, (snapshot) => {
      if (partnersInitial) {
        partnersInitial = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const data = change.doc.data();
          const id = change.doc.id;
          const updatedAt = data.updatedAt;
          const docTime = updatedAt?.toMillis ? updatedAt.toMillis() : (updatedAt?.seconds ? updatedAt.seconds * 1000 : Date.now());
          
          if (docTime > sessionStartTime - 5000) {
            const partnerName = data.kycData?.name || data.panData?.name || data.name || "नवीन भागीदार";
            const step = data.onboardingStep;
            
            // Prevent duplicate alerts in the current session
            const sessionKey = `${id}_step_${step}`;
            if (!(window as any)._notifiedSteps) {
              (window as any)._notifiedSteps = new Set();
            }
            if ((window as any)._notifiedSteps.has(sessionKey)) return;
            (window as any)._notifiedSteps.add(sessionKey);

            if (step === 1) {
              sendPushNotification(
                "🤝 DSA नोंदणी: मोबाईल पडताळणी!",
                `नाव: ${partnerName}\nमोबाईल: ${data.mobileNumber || "N/A"}\nटप्पा १ यशस्वीरित्या पूर्ण केला.`
              );
            } else if (step === 2) {
              sendPushNotification(
                "🛡️ DSA नोंदणी: आधार KYC!",
                `नाव: ${partnerName}\nमोबाईल: ${data.mobileNumber || "N/A"}\nटप्पा २ (आधार) यशस्वीरित्या पूर्ण केला.`
              );
            } else if (step === 3) {
              sendPushNotification(
                "💳 DSA नोंदणी: पॅन पडताळणी!",
                `नाव: ${partnerName}\nमोबाईल: ${data.mobileNumber || "N/A"}\nटप्पा ३ (पॅन) यशस्वीरित्या पूर्ण केला.`
              );
            } else if (step === 4 || data.dsaStatus === "Active") {
              sendPushNotification(
                "🎉 नवीन DSA भागीदार नोंदणी पूर्ण!",
                `नाव: ${partnerName}\nDSA कोड: ${data.dsaCode || "N/A"}\nमोबाईल: ${data.mobileNumber || "N/A"}\nनोंदणी यशस्वीरित्या पूर्ण झाली!`
              );
            }
          }
        }
      });
    }, (err) => {
      console.error("Error listening to partners for notifications:", err);
    });

    return () => {
      unsubLeads();
      unsubPartners();
    };
  }, [user, adminRole, pathname]);

  useEffect(() => {
    if (!loading && pathname !== "/admin/login") {
      if (!user) {
        // Not logged in at all, redirect to admin login page
        router.push("/admin/login")
      } else if (!adminRole) {
        // Logged in but not an authorized admin, redirect to homepage
        router.push("/")
      }
    }
  }, [user, adminRole, loading, router, pathname])

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-slate-50 flex flex-col justify-center">{children}</div>
  }

  // Permission verification check
  if (loading || (!adminRole && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-bold gap-4 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={54} />
          <ShieldCheck className="text-primary absolute" size={24} />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-slate-450 animate-pulse">Verifying Permissions...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-[-10]" />
      <div className="absolute bottom-0 left-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none z-[-10]" />

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[190] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Removed relative z-10 to allow fixed modals inside children to stack on top of bottom navigation bar */}
      <div className="min-w-0 ml-0 lg:ml-72 h-screen overflow-y-auto custom-scrollbar relative">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Sticky Mobile Bottom Navigation Bar - adjusted z-index to z-[100] to sit below dialogs/modals */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around z-[100] lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
        <Link 
          href="/admin" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname === "/admin" ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <LayoutDashboard size={20} className={pathname === "/admin" ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">Overview</span>
        </Link>

        <Link 
          href="/admin/leads" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname.startsWith("/admin/leads") ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <Briefcase size={20} className={pathname.startsWith("/admin/leads") ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">Leads</span>
        </Link>

        <Link 
          href="/admin/partners" 
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            pathname.startsWith("/admin/partners") ? "text-primary font-black scale-105" : "text-slate-400 font-bold"
          }`}
        >
          <Network size={20} className={pathname.startsWith("/admin/partners") ? "text-primary" : "text-slate-400"} />
          <span className="text-[10px] tracking-tight">DSA</span>
        </Link>

        <button 
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl text-slate-400 font-bold transition-all hover:text-slate-650 cursor-pointer active:scale-95"
        >
          <Menu size={20} />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </div>
  )
}
