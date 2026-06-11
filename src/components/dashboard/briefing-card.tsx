"use client";

import { useState } from "react";
import { Sparkles, Calendar, Clock, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface BriefItem {
  summary: string;
  revenue_summary: string;
  booking_summary: string;
  complaint_summary: string;
  goal_summary: string;
  alerts_summary: string;
  opps_summary: string;
}

interface BriefingCardProps {
  daily: BriefItem;
  weekly: BriefItem;
  monthly: BriefItem;
}

export function BriefingCard({ daily, weekly, monthly }: BriefingCardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const briefs = { daily, weekly, monthly };
  const current = briefs[activeTab];

  return (
    <Card className="border-l-4 border-l-blue-600 border border-slate-100 shadow-sm bg-gradient-to-r from-blue-50/20 to-indigo-50/10">
      <CardContent className="p-5 space-y-4">
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Executive Daily, Weekly &amp; Monthly Briefing</h3>
          </div>
          
          {/* Switcher pills */}
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 shadow-xs">
            {[
              { id: "daily", label: "Daily", icon: Clock },
              { id: "weekly", label: "Weekly", icon: Calendar },
              { id: "monthly", label: "Monthly", icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-3 animate-fadeIn">
          <p className="text-xs text-slate-800 leading-relaxed font-semibold">
            {current.summary}
          </p>

          {/* Grid sections for sub-summaries */}
          <div className="grid gap-4 sm:grid-cols-3 pt-3 text-[10px] text-slate-500 border-t border-slate-100">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Financial Audit</span>
              <p className="leading-relaxed">{current.revenue_summary}</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Operations &amp; Fulfilment</span>
              <p className="leading-relaxed">{current.booking_summary}</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Strategic Growth</span>
              <p className="leading-relaxed">{current.opps_summary}</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 pt-2 text-[10px] text-slate-400">
            <div>
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[8px]">Goal Progress</span>
              <p className="leading-relaxed">{current.goal_summary}</p>
            </div>
            <div>
              <span className="font-bold text-slate-500 block uppercase tracking-wider text-[8px]">Unresolved Issues</span>
              <p className="leading-relaxed">{current.complaint_summary} {current.alerts_summary}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
