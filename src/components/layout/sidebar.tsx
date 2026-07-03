"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, ShieldCheck, Megaphone,
  Settings, CreditCard, BarChart3, TrendingUp, UserCog,
  MapPin, Cpu, ShieldAlert, FileText, Target, BookOpen,
  Zap, Users, MessageSquare, BellRing, ChevronRight, ChevronLeft, Building, Database, UserPlus
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
      { name: "Leads", href: "https://script.google.com/macros/s/AKfycbxGTJf3R74_6N21f_RhihHhzrJougKK12bUEKccQdF18iCJ-tCnt8KimORlyppzhqFY/exec", icon: UserPlus },
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
      { name: "Revenue Health", href: "/sales", icon: BarChart3 },
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
      { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
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

  // Avoid layout shift during server-side rendering
  const activeCollapse = mounted ? isCollapsed : false;

  return (
    <div 
      className={cn(
        "flex h-full flex-col bg-white border-r border-slate-200 shrink-0 transition-all duration-300 ease-in-out",
        activeCollapse ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div 
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-slate-200 gap-3 overflow-hidden",
          activeCollapse ? "px-0 justify-center" : "px-4 justify-start"
        )}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}
        >
          IV
        </div>
        {!activeCollapse && (
          <div className="animate-fade-in">
            <p className="text-[13px] font-bold text-slate-900 leading-tight">ICC</p>
            <p className="text-[10px] text-blue-600 font-medium">Integrated Command Center</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            {activeCollapse ? (
              <div className="border-t border-slate-100 my-2 mx-1" />
            ) : (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 truncate">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                const isExternal = item.href.startsWith("http");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item group relative",
                      isActive && "active",
                      activeCollapse && "justify-center px-0"
                    )}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-400"
                      )}
                    />
                    {!activeCollapse && (
                      <span className="flex-1 text-[13px] truncate">{item.name}</span>
                    )}
                    {isActive && !activeCollapse && (
                      <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />
                    )}

                    {/* Tooltip when collapsed */}
                    {activeCollapse && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-md shadow-lg whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
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

      {/* Footer / Toggle */}
      <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex flex-col gap-3">
          {!activeCollapse ? (
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">Admin User</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[10px] text-slate-500 truncate">Live · innovibemobility.com</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleToggleCollapse}
                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-3">
              <div 
                className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 relative group cursor-default"
              >
                A
                {/* Tooltip for avatar when collapsed */}
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-md shadow-lg whitespace-nowrap hidden group-hover:block pointer-events-none z-50">
                  Admin User (Live)
                </div>
              </div>
              <button
                onClick={handleToggleCollapse}
                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
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
