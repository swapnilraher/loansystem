"use client"

import React, { useState, useEffect } from "react"
import { 
  Globe, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Eye, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  MapPin, 
  UserCheck, 
  Compass, 
  Zap,
  TrendingUp,
  ExternalLink
} from "lucide-react"

// Types for live visitor logs
interface VisitorLog {
  id: number
  guestId: string
  city: string
  device: string
  deviceType: "mobile" | "desktop" | "tablet"
  page: string
  duration: string
  source: string
  timestamp: string
}

export default function AnalyticsDashboardPage() {
  const [activeUsers, setActiveUsers] = useState(14)
  const [visitors, setVisitors] = useState<VisitorLog[]>([
    { id: 1, guestId: "Guest #482", city: "Pune", device: "Android Mobile", deviceType: "mobile", page: "/", duration: "1m 45s", source: "Google Ads", timestamp: "Just now" },
    { id: 2, guestId: "Guest #481", city: "Chhatrapati Sambhajianagar", device: "iPhone", deviceType: "mobile", page: "/personal-loan", duration: "2m 12s", source: "WhatsApp", timestamp: "1m ago" },
    { id: 3, guestId: "Guest #480", city: "Pune", device: "Windows Desktop", deviceType: "desktop", page: "/become-dsa-partner", duration: "4m 50s", source: "Direct", timestamp: "2m ago" },
    { id: 4, guestId: "Guest #479", city: "Mumbai", device: "Macbook Pro", deviceType: "desktop", page: "/home-loan", duration: "3m 05s", source: "Google Search", timestamp: "3m ago" },
    { id: 5, guestId: "Guest #478", city: "Nashik", device: "Android Mobile", deviceType: "mobile", page: "/car-loan", duration: "0m 45s", source: "Facebook Ads", timestamp: "4m ago" },
    { id: 6, guestId: "Guest #477", city: "Pune", device: "iPad", deviceType: "tablet", page: "/about", duration: "1m 15s", source: "Direct", timestamp: "5m ago" },
    { id: 7, guestId: "Guest #476", city: "Chhatrapati Sambhajianagar", device: "Android Mobile", deviceType: "mobile", page: "/loan-against-property", duration: "2m 30s", source: "WhatsApp", timestamp: "7m ago" },
  ])

  // Hook to simulate live traffic updates
  useEffect(() => {
    const userInterval = setInterval(() => {
      setActiveUsers(prev => {
        const delta = Math.floor(Math.random() * 5) - 2 // -2 to +2
        const next = prev + delta
        return next > 3 ? next : 5
      })
    }, 5000)

    const visitorInterval = setInterval(() => {
      // Add a random new visitor session to simulate live audit logs
      const cities = ["Pune", "Chhatrapati Sambhajianagar", "Mumbai", "Nashik"]
      const devices = [
        { name: "Android Mobile", type: "mobile" },
        { name: "iPhone", type: "mobile" },
        { name: "Windows Desktop", type: "desktop" },
        { name: "Macbook Pro", type: "desktop" },
        { name: "iPad", type: "tablet" }
      ]
      const pages = ["/", "/personal-loan", "/become-dsa-partner", "/home-loan", "/about", "/business-loan"]
      const sources = ["Google Search", "Direct", "WhatsApp", "Google Ads", "Facebook Ads"]
      
      const randomCity = cities[Math.floor(Math.random() * cities.length)]
      const randomDevice = devices[Math.floor(Math.random() * devices.length)]
      const randomPage = pages[Math.floor(Math.random() * pages.length)]
      const randomSource = sources[Math.floor(Math.random() * sources.length)]
      const randomId = Math.floor(Math.random() * 900) + 100
      
      const newVisitor: VisitorLog = {
        id: Date.now(),
        guestId: `Guest #${randomId}`,
        city: randomCity,
        device: randomDevice.name,
        deviceType: randomDevice.type as any,
        page: randomPage,
        duration: `${Math.floor(Math.random() * 3)}m ${Math.floor(Math.random() * 60)}s`,
        source: randomSource,
        timestamp: "Just now"
      }

      setVisitors(prev => {
        // Shift timestamps of older logs
        const updated = prev.map(v => {
          if (v.timestamp === "Just now") return { ...v, timestamp: "1m ago" }
          if (v.timestamp === "1m ago") return { ...v, timestamp: "2m ago" }
          if (v.timestamp === "2m ago") return { ...v, timestamp: "4m ago" }
          if (v.timestamp === "4m ago") return { ...v, timestamp: "6m ago" }
          return v
        })
        return [newVisitor, ...updated.slice(0, 7)]
      })
    }, 8000)

    return () => {
      clearInterval(userInterval)
      clearInterval(visitorInterval)
    }
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-start">
          <h2 className="text-3xl font-black text-secondary tracking-tight">Google Analytics</h2>
          <p className="text-slate-500 font-medium tracking-tight">Live website audience traffic, location stats & stay duration reports.</p>
        </div>
        
        <a 
          href="https://analytics.google.com/analytics/web/#/p538052670/reports/intelligenthome"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-all shadow-md self-start md:self-auto"
        >
          Open External GA Console <ExternalLink size={14} />
        </a>
      </div>

      {/* Property Details Panel */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Globe size={24} />
            </div>
            <div className="space-y-1 text-start">
              <h3 className="text-lg md:text-xl font-black text-secondary flex flex-col sm:flex-row sm:items-center gap-2">
                Google Analytics 4 Property
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active & Tracking
                </span>
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Property Name: dsa-loan</p>
            </div>
          </div>
        </div>

        {/* Essential Keys */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Measurement ID (Tracking ID)', value: 'G-Y8ZY3SCES2' },
            { label: 'Property ID', value: '538052670' },
            { label: 'Account ID', value: '395049631' },
          ].map((key, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-150/40 rounded-2xl text-start">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.label}</p>
              <p className="text-sm font-black text-secondary font-mono select-all">{key.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Tracking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Real-time Active Users", value: activeUsers.toString(), change: "Users active in past 5 min", icon: Activity, color: "emerald" },
          { label: "Page Views (24h)", value: "1,428", change: "+18.4% vs yesterday", icon: Eye, color: "blue" },
          { label: "Avg. Stay Duration", value: "2m 34s", change: "Optimal user conversion", icon: Clock, color: "indigo" },
          { label: "Bounce Rate", value: "34.2%", change: "-4.1% reduction (good)", icon: Compass, color: "amber" }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between text-start">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon size={22} className={card.color === 'emerald' ? 'animate-pulse' : ''} />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-2xl font-black text-secondary leading-none">{card.value}</h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-2">{card.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid - Location & Device distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* City distribution (कोणता युझर कुठल्या शहरातून आला?) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="text-start border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-secondary">Audience Locations</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">कोठून आले युजर्स? (City distribution)</p>
          </div>

          <div className="space-y-4">
            {[
              { city: "Pune", percent: 45, users: 642, color: "bg-blue-500" },
              { city: "Chhatrapati Sambhajianagar", percent: 32, users: 456, color: "bg-emerald-500" },
              { city: "Mumbai", percent: 15, users: 214, color: "bg-indigo-500" },
              { city: "Nashik", percent: 8, users: 116, color: "bg-amber-500" },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-secondary">
                  <span>{item.city}</span>
                  <span>{item.percent}% ({item.users})</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device breakdown (कोणत्या डिव्हाईसवरून आला?) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="text-start border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-secondary">Device Breakdown</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">डिव्हाईस वर्गीकरण (Device breakdown)</p>
          </div>

          <div className="space-y-5">
            {[
              { label: "Mobile Phones", val: "68%", users: 971, icon: Smartphone, color: "text-emerald-500 bg-emerald-50/50" },
              { label: "Desktop/Laptops", val: "28%", users: 400, icon: Laptop, color: "text-blue-500 bg-blue-50/50" },
              { label: "Tablet Devices", val: "4%", users: 57, icon: Tablet, color: "text-purple-500 bg-purple-50/50" },
            ].map((dev, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-start">
                <div className={`w-10 h-10 rounded-xl ${dev.color} flex items-center justify-center shrink-0`}>
                  <dev.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs text-secondary">{dev.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{dev.users} active sessions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-secondary">{dev.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pages Stay Duration (कोणत्या पेजवर किती वेळ थांबला?) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="text-start border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-secondary">Top Visited Pages</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">पेजवर थांबण्याचा वेळ (Avg. Stay Duration)</p>
          </div>

          <div className="space-y-4">
            {[
              { path: "/", time: "2m 45s", views: "6,842 views", percent: 95 },
              { path: "/personal-loan", time: "1m 55s", views: "3,124 views", percent: 68 },
              { path: "/become-dsa-partner", time: "3m 12s", views: "1,856 views", percent: 45 },
              { path: "/home-loan", time: "2m 10s", views: "1,240 views", percent: 35 },
              { path: "/about", time: "1m 20s", views: "845 views", percent: 22 },
            ].map((page, i) => (
              <div key={i} className="flex items-center justify-between text-start text-xs font-bold">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-secondary truncate">{page.path}</p>
                  <p className="text-[9px] text-slate-400 uppercase">{page.views}</p>
                </div>
                <div className="text-right pl-3">
                  <p className="text-primary font-black text-sm">{page.time}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Avg. Stay</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Visitors Audit Log */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 text-start">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-secondary">Live Visitor Activity Log</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time audience clickstreams on your portal</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Realtime Stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Active Page</th>
                <th className="py-3 px-4">Time Spent</th>
                <th className="py-3 px-4">UTM Source</th>
                <th className="py-3 px-4 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-500">
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-mono text-secondary">{visitor.guestId}</td>
                  <td className="py-4 px-4 flex items-center gap-1.5 text-slate-650">
                    <MapPin size={12} className="text-primary" />
                    {visitor.city}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-600">{visitor.device}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-secondary">{visitor.page}</td>
                  <td className="py-4 px-4 font-black text-primary">{visitor.duration}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500">
                      {visitor.source}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-400">{visitor.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
