"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Search, Loader2, ClipboardList } from "lucide-react";
import { AddComplaintButton } from "@/components/forms/add-complaint-button";

interface Complaint {
  id: string;
  category: string | null;
  description: string | null;
  severity: string | null; // Low, Medium, High, Critical
  status: string; // open, investigating, resolved, closed
  customer_id: string;
  created_at: string;
  customers: {
    full_name: string | null;
  } | null;
}

const TABS = [
  { id: "all", label: "All Complaints" },
  { id: "open", label: "Open" },
  { id: "investigating", label: "Investigating" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export default function ComplaintsPage() {
  const supabase = createClient();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  async function loadData() {
    try {
      setLoading(true);
      
      const [complaintsRes, customersRes] = await Promise.all([
        supabase
          .from("complaints")
          .select("*, customers(full_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("customers")
          .select("id, full_name")
          .order("full_name")
      ]);

      if (complaintsRes.data) setComplaints(complaintsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
    } catch (err) {
      console.error("Failed to load complaints data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = complaints.filter((c) => {
    // Search
    const customerName = c.customers?.full_name || "";
    const categoryName = c.category || "";
    const desc = c.description || "";
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      customerName.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      desc.toLowerCase().includes(searchLower);

    // Tab
    const matchesTab = activeTab === "all" ? true : c.status === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Complaints</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <AddComplaintButton customers={customers} />
        </div>
      </div>

      {/* Tabs */}
      <div className="crm-tabs">
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`crm-tab ${activeTab === t.id ? "active" : ""}`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="crm-filter-bar">
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-9 w-full outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <div className="crm-body">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching complaints record...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <ClipboardList className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No complaints found</h4>
              <p className="crm-empty-desc">
                {search || activeTab !== "all"
                  ? "Try resetting your search query or switching tabs."
                  : "Excellent! No customer complaints currently active."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sev = (c.severity || "medium").toLowerCase();
                  let severityBadge = "crm-badge-neutral";
                  if (sev === "critical") severityBadge = "crm-badge-danger";
                  else if (sev === "high") severityBadge = "crm-badge-warning";
                  else if (sev === "medium") severityBadge = "crm-badge-info";

                  return (
                    <tr key={c.id} className="crm-interactive">
                      <td className="font-mono text-xs text-blue-600 font-semibold">
                        {c.id.substring(0, 8)}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {c.customers?.full_name || "—"}
                      </td>
                      <td className="text-slate-800 font-medium">{c.category || "General"}</td>
                      <td className="max-w-[250px] truncate text-slate-600" title={c.description || ""}>
                        {c.description || "—"}
                      </td>
                      <td>
                        <span className={severityBadge}>
                          <span className={
                            sev === "critical" 
                              ? "crm-dot-danger" 
                              : sev === "high" 
                                ? "crm-dot-warning" 
                                : "crm-dot-info"
                          } />
                          {c.severity || "Medium"}
                        </span>
                      </td>
                      <td>
                        {c.status === "open" && (
                          <span className="crm-badge-danger">
                            <span className="crm-dot-danger" />
                            Open
                          </span>
                        )}
                        {c.status === "investigating" && (
                          <span className="crm-badge-warning">
                            <span className="crm-dot-warning" />
                            Investigating
                          </span>
                        )}
                        {c.status === "resolved" && (
                          <span className="crm-badge-success">
                            <span className="crm-dot-success" />
                            Resolved
                          </span>
                        )}
                        {c.status === "closed" && (
                          <span className="crm-badge-neutral">
                            <span className="crm-dot-neutral" />
                            Closed
                          </span>
                        )}
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
