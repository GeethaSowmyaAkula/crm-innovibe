"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, ShieldCheck, Megaphone,
  Settings, CreditCard, BarChart3, TrendingUp, UserCog,
  MapPin, Cpu, ShieldAlert, FileText, Target, BookOpen,
  Zap, Users, MessageSquare, BellRing, ChevronRight
} from "lucide-react";

const sections = [
  {
    title: "Executive Suite",
    items: [
      { name: "CEO Cockpit", href: "/", icon: LayoutDashboard },
      { name: "Dashboard", href: "/ceo", icon: BarChart3 },
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
      { name: "Leads", href: "/leads", icon: TrendingUp },
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

  return (
    <div className="flex h-full w-60 flex-col bg-white border-r border-slate-200 shrink-0">

      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-4 border-b border-slate-200 gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}
        >
          IV
        </div>
        <div>
          <p className="text-[13px] font-bold text-slate-900 leading-tight">InnoVibe Care.EV</p>
          <p className="text-[10px] text-blue-600 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item",
                      isActive && "active"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-400"
                      )}
                    />
                    <span className="flex-1 text-[13px]">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate">Admin User</p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] text-slate-500">Live · innovibemobility.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
