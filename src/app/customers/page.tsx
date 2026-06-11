"use client";

import { useEffect, useState } from "react";
import { Users, Search, Plus, Loader2, UserMinus } from "lucide-react";

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  amc_status: string | null;
  health_score: number | null;
  lifetime_value: number | null;
  last_booking_date: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [amcFilter, setAmcFilter] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setCustomers(data);
      } catch (err: any) {
        setError(err.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const nameMatch = (c.full_name || "").toLowerCase().includes(search.toLowerCase());
    const phoneMatch = (c.phone || "").includes(search);
    const emailMatch = (c.email || "").toLowerCase().includes(search.toLowerCase());
    const textMatch = nameMatch || phoneMatch || emailMatch;

    const amcMatch = amcFilter === "" ? true : c.amc_status === amcFilter;

    return textMatch && amcMatch;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">All Customers</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <button className="crm-btn-primary">
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-bar">
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-9 w-full outline-none"
          />
        </div>
        <select
          value={amcFilter}
          onChange={(e) => setAmcFilter(e.target.value)}
          className="crm-select"
        >
          <option value="">All AMC Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Body */}
      <div className="crm-body">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching customer records...</p>
          </div>
        ) : error ? (
          <div className="crm-alert-danger max-w-xl mx-auto mt-4">
            <p className="font-semibold">Failed to fetch customer data</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <UserMinus className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No customers found</h4>
              <p className="crm-empty-desc">
                {search || amcFilter
                  ? "Try resetting your search filters or check your input."
                  : "Get started by adding a customer or triggering database synchronization."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Info</th>
                  <th>AMC Status</th>
                  <th>Health Score</th>
                  <th className="text-right">Lifetime Value</th>
                  <th>Last Booking</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const health = c.health_score ?? 0;
                  let healthClass = "text-slate-600 font-semibold";
                  if (health > 70) healthClass = "text-emerald-600 font-semibold";
                  else if (health >= 40) healthClass = "text-amber-600 font-semibold";
                  else if (health > 0) healthClass = "text-red-600 font-semibold";

                  return (
                    <tr key={c.id} className="crm-interactive">
                      <td className="font-semibold text-slate-900">{c.full_name || "—"}</td>
                      <td>
                        <div className="text-slate-800 text-xs">{c.phone || "—"}</div>
                        <div className="text-slate-400 text-[11px]">{c.email || "—"}</div>
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
                        {!c.amc_status && (
                          <span className="crm-badge-neutral">
                            <span className="crm-dot-neutral" />
                            No AMC
                          </span>
                        )}
                      </td>
                      <td className={healthClass}>
                        {health > 0 ? `${health}/100` : "—"}
                      </td>
                      <td className="text-right font-bold text-slate-900">
                        ₹{(c.lifetime_value ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        {c.last_booking_date
                          ? new Date(c.last_booking_date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="text-slate-500">
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
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
