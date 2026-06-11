"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, ShieldAlert, Shield, Search, Loader2, RefreshCw } from "lucide-react";

interface AMCCustomer {
  id: string;
  full_name: string | null;
  phone: string | null;
  amc_status: string | null; // active, expiring, expired
  amc_expiry_date: string | null;
  amc_plan: string | null; // Gold, Silver, Platinum
  fleet_size: number | null;
  lifetime_value: number | null;
}

export default function AMCPage() {
  const supabase = createClient();
  const [contracts, setContracts] = useState<AMCCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, amc_status, amc_expiry_date, amc_plan, fleet_size, lifetime_value")
        .not("amc_status", "is", null);

      if (error) {
        if (error.code === "42703") {
          console.warn("AMC columns not found on customers table. Returning empty array.");
          setContracts([]);
        } else {
          throw error;
        }
      } else {
        setContracts(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch AMC contracts", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = contracts.filter((c) => c.amc_status === "active").length;
  const expiringCount = contracts.filter((c) => c.amc_status === "expiring").length;
  const expiredCount = contracts.filter((c) => c.amc_status === "expired").length;

  const filtered = contracts.filter((c) => {
    const nameMatch = (c.full_name || "").toLowerCase().includes(search.toLowerCase());
    const phoneMatch = (c.phone || "").includes(search);
    const planMatch = (c.amc_plan || "").toLowerCase().includes(search.toLowerCase());
    return nameMatch || phoneMatch || planMatch;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">AMC Contracts</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <button onClick={loadData} className="crm-btn-secondary crm-btn-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="crm-body">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#ECFDF5" }}>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="crm-stat-label">Active Contracts</span>
              <div className="crm-stat-value text-emerald-600">{activeCount}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FFFBEB" }}>
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="crm-stat-label">Expiring Soon</span>
              <div className="crm-stat-value text-amber-600">{expiringCount}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FEF2F2" }}>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <span className="crm-stat-label">Expired Contracts</span>
              <div className="crm-stat-value text-red-600">{expiredCount}</div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="crm-filter-bar mb-5 border rounded-lg">
          <div className="relative flex items-center max-w-xs w-full">
            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input pl-9 w-full outline-none"
            />
          </div>
        </div>

        {/* Table/Data Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching contract database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <Shield className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No AMC Contracts found</h4>
              <p className="crm-empty-desc">
                {search
                  ? "Try adjusting your search criteria."
                  : "No customer records currently mapped to an AMC protection plan."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow bg-white">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>AMC Plan</th>
                  <th>Expiry Date</th>
                  <th className="text-center">Fleet Size</th>
                  <th className="text-right">Lifetime Value</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const plan = (c.amc_plan || "Silver").toLowerCase();
                  let planBadge = "crm-badge-neutral";
                  if (plan === "platinum") planBadge = "crm-badge-purple";
                  else if (plan === "gold") planBadge = "crm-badge-warning";

                  return (
                    <tr key={c.id} className="crm-interactive">
                      <td className="font-semibold text-slate-900">{c.full_name || "—"}</td>
                      <td>
                        <div className="text-slate-800 text-xs">{c.phone || "—"}</div>
                      </td>
                      <td>
                        <span className={planBadge}>{c.amc_plan || "Silver"}</span>
                      </td>
                      <td className="text-slate-600 font-medium">
                        {c.amc_expiry_date
                          ? new Date(c.amc_expiry_date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="text-center font-bold text-slate-600">
                        {c.fleet_size || "—"}
                      </td>
                      <td className="text-right font-extrabold text-slate-900">
                        ₹{(c.lifetime_value ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        {c.amc_status === "active" && (
                          <span className="crm-badge-success">
                            <span className="crm-dot-success" />
                            Active
                          </span>
                        )}
                        {c.amc_status === "expiring" && (
                          <span className="crm-badge-warning">
                            <span className="crm-dot-warning" />
                            Expiring
                          </span>
                        )}
                        {c.amc_status === "expired" && (
                          <span className="crm-badge-danger">
                            <span className="crm-dot-danger" />
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {(c.amc_status === "expired" || c.amc_status === "expiring") ? (
                          <button className="crm-btn-primary crm-btn-sm py-1 px-2.5">
                            Renew Plan
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Nominal</span>
                        )}
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
