"use client";

import { Bell, Search, ChevronDown, Settings, LogOut, User } from "lucide-react";
import { useState } from "react";

export function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Search */}
      <div className="flex flex-1">
        <div className="relative flex items-center w-full max-w-xs">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search CRM..."
            className="h-8 w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
          />
          <span className="absolute right-2.5 text-[10px] text-slate-400 font-medium hidden lg:block">⌘K</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
          >
            <Bell className="h-4 w-4" />
            {/* unread dot */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-[13px] font-semibold text-slate-800">Notifications</span>
                <span className="text-[11px] text-blue-600 cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {[
                  { icon: "🔴", title: "Critical Alert", desc: "Revenue leakage detected — ₹3,200 at risk", time: "2m ago" },
                  { icon: "🟡", title: "Booking Pending", desc: "MH-12-EQ-4821 service due in 3 days", time: "18m ago" },
                  { icon: "🟢", title: "AMC Renewal", desc: "Fleet customer Rajesh renewed AMC contract", time: "1h ago" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors">
                    <span className="text-base shrink-0 mt-0.5">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{n.desc}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <span className="text-[12px] text-blue-600 cursor-pointer hover:underline">View all notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-blue-50 transition-all duration-150"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
              A
            </div>
            <span className="hidden lg:block text-[13px] font-medium text-slate-700">Admin User</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden lg:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-slate-800">Admin User</p>
                <p className="text-[11px] text-slate-500">admin@innovibemobility.com</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: "Profile" },
                  { icon: Settings, label: "Settings" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop to close dropdowns */}
      {(notifOpen || userOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setNotifOpen(false); setUserOpen(false); }}
        />
      )}
    </div>
  );
}
