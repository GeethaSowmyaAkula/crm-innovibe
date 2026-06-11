"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Search, Loader2, Target, TrendingUp, Sparkles, Phone } from "lucide-react";
import { AddLeadButton } from "@/components/forms/add-lead-button";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  customer_type: string | null;
  score: number | null;
  status: string; // new, contacted, qualified, converted, lost
  created_at: string;
}

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data || []) as any);
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const total = leads.length;
  const hot = leads.filter((l) => (l.score || 0) >= 70).length;
  const warm = leads.filter((l) => (l.score || 0) >= 40 && (l.score || 0) < 70).length;
  const converted = leads.filter((l) => l.status === "converted").length;

  const filtered = leads.filter((l) => {
    const matchesSearch = 
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search) ||
      (l.source || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" ? true : l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Sales Leads</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <AddLeadButton />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-bar">
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads by name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-9 w-full outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="crm-select"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="crm-body">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="crm-stat-label">Total Leads</span>
              <div className="crm-stat-value text-slate-800">{total}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FEF2F2" }}>
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <span className="crm-stat-label">Hot Leads (Score ≥70)</span>
              <div className="crm-stat-value text-red-600">{hot}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FFFBEB" }}>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="crm-stat-label">Warm Leads (40-70)</span>
              <div className="crm-stat-value text-amber-600">{warm}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#ECFDF5" }}>
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="crm-stat-label">Converted</span>
              <div className="crm-stat-value text-emerald-600">{converted}</div>
            </div>
          </div>
        </div>

        {/* Data List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching leads register...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <Users className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No leads found</h4>
              <p className="crm-empty-desc">
                {search || statusFilter
                  ? "Try resetting your search query or filters."
                  : "No sales leads currently mapped in Supabase."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow bg-white">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Customer Type</th>
                  <th>Lead Score</th>
                  <th>Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const score = l.score ?? 0;
                  let scoreColor = "text-slate-600 font-semibold";
                  if (score >= 70) scoreColor = "text-red-600 font-bold";
                  else if (score >= 40) scoreColor = "text-amber-600 font-semibold";

                  return (
                    <tr key={l.id} className="crm-interactive">
                      <td className="font-semibold text-slate-900">{l.name}</td>
                      <td>
                        <div className="flex items-center gap-1 text-slate-700 text-xs">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {l.phone || "—"}
                        </div>
                        <div className="text-[11px] text-slate-400 ml-4">
                          {l.email || "—"}
                        </div>
                      </td>
                      <td>
                        <span className="crm-badge-neutral">{l.source || "Unknown"}</span>
                      </td>
                      <td className="text-slate-600 font-medium capitalize">
                        {l.customer_type || "Individual"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="crm-progress-track w-16">
                            <div
                              className="crm-progress-fill"
                              style={{ 
                                width: `${score}%`,
                                background: score >= 70 ? "red" : score >= 40 ? "orange" : "blue"
                              }}
                            />
                          </div>
                          <span className={`text-xs ${scoreColor}`}>{score}%</span>
                        </div>
                      </td>
                      <td>
                        {l.status === "new" && (
                          <span className="crm-badge-info">
                            <span className="crm-dot-info" />
                            New
                          </span>
                        )}
                        {l.status === "contacted" && (
                          <span className="crm-badge-warning">
                            <span className="crm-dot-warning" />
                            Contacted
                          </span>
                        )}
                        {l.status === "qualified" && (
                          <span className="crm-badge-purple">
                            <span className="crm-badge-dot bg-purple-500" />
                            Qualified
                          </span>
                        )}
                        {l.status === "converted" && (
                          <span className="crm-badge-success">
                            <span className="crm-dot-success" />
                            Converted
                          </span>
                        )}
                        {l.status === "lost" && (
                          <span className="crm-badge-danger">
                            <span className="crm-dot-danger" />
                            Lost
                          </span>
                        )}
                        {!["new", "contacted", "qualified", "converted", "lost"].includes(l.status) && (
                          <span className="crm-badge-neutral">
                            <span className="crm-dot-neutral" />
                            {l.status}
                          </span>
                        )}
                      </td>
                      <td className="text-slate-500">
                        {new Date(l.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
