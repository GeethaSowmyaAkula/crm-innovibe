"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, ShieldCheck, Megaphone,
  Settings, CreditCard, BarChart3, TrendingUp, UserCog,
  MapPin, Cpu, ShieldAlert, FileText, Target, BookOpen,
  Zap, Users, MessageSquare, BellRing, ChevronRight, ChevronLeft, Building, Database, UserPlus, Handshake, Bot
} from "lucide-react";

const sections = [
  {
    title: "Executive Suite",
    items: [
      { name: "CEO", href: "/", icon: LayoutDashboard },
      { name: "Dashboard", href: "/ceo", icon: BarChart3 },
      { name: "TMS & HRMS", href: "https://office.innovibemobility.com/login", icon: Building },
      { name: "WhatsApp", href: "https://evdiagnostic.innovibemobility.com/dashboard/?tab=users", icon: MessageSquare },
      { name: "ERP", href: "/erp", icon: Database },
      { name: "Leads", href: "https://google-maps-lead-gen-production-e3d6.up.railway.app", icon: UserPlus },
    ],
  },
  {
    title: "Customers",
    items: [
      { name: "All Customers", href: "/customers", icon: Users },
      { name: "Bookings", href: "/bookings", icon: BellRing },
      { name: "Complaints", href: "/complaints", icon: MessageSquare },
      { name: "Feedback", href: "/feedback", icon: MessageSquare },
    ],
  },
  {
    title: "Partnerships",
    items: [
      { name: "Partnership Tracker", href: "/partnerships", icon: Handshake },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Operations", href: "/operations", icon: Zap },
      { name: "Technicians", href: "/technicians", icon: UserCog },
      { name: "Garages", href: "/garages", icon: MapPin },
    ],
  },
  {
    title: "Revenue",
    items: [
      { name: "AMC Contracts", href: "/amc", icon: ShieldCheck },
      { name: "Payments", href: "/transactions", icon: CreditCard },
    ],
  },
  {
    title: "Fleet & Hardware",
    items: [
      { name: "Fleet Dashboard", href: "/fleet", icon: Car },
      { name: "Telemetry Logs", href: "/hardware/telemetry", icon: Cpu },
      { name: "Vehicle Health", href: "/hardware/health", icon: ShieldAlert },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Strategy Center", href: "/strategy", icon: Target },
      { name: "Reports", href: "/sales", icon: FileText },
      { name: "Reminders", href: "/reminders", icon: BellRing },
      { name: "AI Assistant", href: "/chatbot", icon: Bot },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("sidebar_collapsed", String(newValue));
  };

  const activeCollapse = mounted ? isCollapsed : false;

  return (
    <div 
      className={cn(
        "flex h-full flex-col bg-white border-r border-slate-200/60 shrink-0 transition-all duration-300 ease-in-out relative z-30 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.03)]",
        activeCollapse ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div 
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-slate-100/80 gap-3 px-4 justify-between",
          activeCollapse && "justify-center px-0"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-extrabold shadow-md shadow-blue-500/10"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            IV
          </div>
          {!activeCollapse && (
            <div className="animate-fade-in min-w-0">
              <p className="text-sm font-black text-slate-900 tracking-tight leading-none">ICC</p>
              <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest mt-1">Innovibe Command Center</p>
            </div>
          )}
        </div>
        {!activeCollapse && (
          <button
            onClick={handleToggleCollapse}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 border border-slate-100 transition-all duration-200 shadow-sm"
            title="Collapse Menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {activeCollapse ? (
              <div className="border-t border-slate-100/80 my-3 mx-1" />
            ) : (
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-550 truncate">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                const isExternal = item.href.startsWith("http");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 font-semibold transition-all duration-200",
                      isActive && "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/10 font-bold active-pill-strip",
                      !isActive && "hover:bg-slate-50/70 hover:text-slate-900",
                      activeCollapse && "justify-center px-0"
                    )}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors duration-200",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                      )}
                    />
                    {!activeCollapse && (
                      <span className="flex-1 text-[13px] truncate tracking-tight">{item.name}</span>
                    )}
                    {isActive && !activeCollapse && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/80 shrink-0" />
                    )}

                    {/* Popover Tooltip when collapsed */}
                    {activeCollapse && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Section & Toggle */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex flex-col gap-3">
          {!activeCollapse ? (
            <div className="flex items-center justify-between gap-2.5 p-1 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 p-1">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-extrabold text-slate-800 truncate">Admin User</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <p className="text-[9px] font-bold text-slate-500 tracking-tight truncate">Live Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-3">
              <div 
                className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0 relative group cursor-default"
              >
                A
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
                  Admin User (System Active)
                </div>
              </div>
              <button
                onClick={handleToggleCollapse}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Expand Sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
