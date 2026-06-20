"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { db, getMessagingClient } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, arrayUnion } from "firebase/firestore"
import { getToken, onMessage } from "firebase/messaging"
import { motion, AnimatePresence } from "framer-motion"

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
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    body: string;
    type: 'lead' | 'partner';
  } | null>(null)

  // Auto-dismiss in-app notification toast after 8 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  // Real-time browser push notifications for new leads and new DSA partners via FCM
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !user || !adminRole) return;

    let unsubscribe: (() => void) | null = null;

    const setupMessaging = async () => {
      try {
        const messagingInstance = await getMessagingClient();
        if (!messagingInstance) {
          console.log("Firebase Messaging not supported/initialized in this browser.");
          return;
        }

        // Register service worker for mobile notifications compatibility and FCM background
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("FCM Service Worker registered:", reg.scope);

          const acquireToken = async () => {
            try {
              const currentToken = await getToken(messagingInstance, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: reg
              });
              if (currentToken) {
                console.log("FCM Token retrieved.");
                // Save token to admin user document
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                  fcmTokens: arrayUnion(currentToken)
                });
              } else {
                console.log("No registration token available. Request permission to generate one.");
              }
            } catch (err) {
              console.error("An error occurred while retrieving token:", err);
            }
          };

          // If permission is already granted, fetch token
          if (Notification.permission === "granted") {
            await acquireToken();
          } else if (Notification.permission === "default") {
            // Ask for permission and acquire token immediately if granted
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await acquireToken();
            }
          }

          // Listen for foreground messages
          unsubscribe = onMessage(messagingInstance, (payload) => {
            console.log("Message received. ", payload);
            const title = payload.notification?.title || "New Notification";
            const body = payload.notification?.body || "";
            const type = payload.data?.type === 'partner' ? 'partner' : 'lead';
            
            // Trigger premium in-app toast
            setActiveNotification({
              id: Math.random().toString(),
              title,
              body,
              type
            });
            
            // Play notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-200.mp3");
              audio.volume = 0.4;
              audio.play();
            } catch (e) {
              console.log("Audio play blocked by browser autoplay policy");
            }
          });
        }
      } catch (err) {
        console.error("FCM setup failed in layout:", err);
      }
    };

    setupMessaging();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, adminRole]);

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
        <main className="px-2 py-3 md:p-8 pb-24 lg:pb-8">
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

      {/* Real-time In-App Notification Toast */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 right-6 z-[9999] w-[320px] sm:w-[360px] overflow-hidden rounded-2xl border bg-slate-900/95 dark:bg-slate-950/95 text-white p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md"
            style={{
              borderColor: activeNotification.type === 'lead' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                activeNotification.type === 'lead' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {activeNotification.type === 'lead' ? '🌟' : '🤝'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold tracking-wide">{activeNotification.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-1 whitespace-pre-line">{activeNotification.body}</p>
                
                <div className="flex items-center gap-3 mt-3.5">
                  <button
                    onClick={() => {
                      if (activeNotification.type === 'lead') {
                        router.push('/admin/leads');
                      } else {
                        router.push('/admin/partners');
                      }
                      setActiveNotification(null);
                    }}
                    style={{
                      background: activeNotification.type === 'lead' ? '#10B981' : '#3B82F6',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setActiveNotification(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
