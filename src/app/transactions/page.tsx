"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Search, Loader2, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";

interface Transaction {
  id: string;
  txnid: string | null;
  amount: number;
  status: string; // success, pending, failed
  payment_method: string | null;
  gateway: string | null;
  booking_id: string | null;
  customer_id: string | null;
  created_at: string;
  customers: {
    full_name: string | null;
  } | null;
}

const TABS = [
  { id: "all", label: "All Transactions" },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

export default function TransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  async function loadData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*, customers(full_name)")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST205") {
          console.warn("Transactions table not found in Supabase. Returning empty array.");
          setTransactions([]);
        } else {
          throw error;
        }
      } else {
        setTransactions((data || []) as any);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalCollected = transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const failedCount = transactions.filter((t) => t.status === "failed").length;
  const failedSum = transactions
    .filter((t) => t.status === "failed")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filtered = transactions.filter((t) => {
    const customerName = t.customers?.full_name || "";
    const method = t.payment_method || "";
    const txid = t.txnid || t.id || "";
    const matchesSearch = 
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      method.toLowerCase().includes(search.toLowerCase()) ||
      txid.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === "all" ? true : t.status === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Payments &amp; Transactions</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-250 px-3 py-1.5 rounded-lg">
            <DollarSign className="h-4 w-4" />
            <span>Total Collected: </span>
            <span className="font-extrabold">₹{totalCollected.toLocaleString("en-IN")}</span>
          </div>
          <button onClick={loadData} className="crm-btn-secondary crm-btn-sm py-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
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
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-9 w-full outline-none"
          />
        </div>
      </div>

      <div className="crm-body">
        {/* Revenue Leakage Banner */}
        {failedCount > 0 && (
          <div className="crm-alert-warning mb-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-800">Revenue Leakage Detected</h4>
              <p className="text-xs text-amber-700 mt-1">
                There are <span className="font-bold">{failedCount} failed transactions</span> totaling{" "}
                <span className="font-bold">₹{failedSum.toLocaleString("en-IN")}</span>. 
                Follow up with customers to recover outstanding balances.
              </p>
            </div>
          </div>
        )}

        {/* Data Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching transaction ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <CreditCard className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No transactions found</h4>
              <p className="crm-empty-desc">
                {search || activeTab !== "all"
                  ? "Try resetting your search query or switching tabs."
                  : "No billing records found in Supabase."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow bg-white">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th className="text-right">Amount</th>
                  <th>Method</th>
                  <th>Gateway</th>
                  <th>Booking ID</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="crm-interactive">
                    <td className="font-mono text-xs text-blue-600 font-semibold">
                      {t.txnid || t.id.substring(0, 8)}
                    </td>
                    <td className="font-semibold text-slate-900">
                      {t.customers?.full_name || "—"}
                    </td>
                    <td className="text-right font-extrabold text-slate-900">
                      ₹{Number(t.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="text-slate-700 font-medium capitalize">
                      {t.payment_method || "UPI"}
                    </td>
                    <td className="text-slate-600 font-medium capitalize">
                      {t.gateway || "Razorpay"}
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {t.booking_id ? t.booking_id.substring(0, 8) : "—"}
                    </td>
                    <td>
                      {t.status === "success" && (
                        <span className="crm-badge-success">
                          <span className="crm-dot-success" />
                          Success
                        </span>
                      )}
                      {t.status === "pending" && (
                        <span className="crm-badge-warning">
                          <span className="crm-dot-warning" />
                          Pending
                        </span>
                      )}
                      {t.status === "failed" && (
                        <span className="crm-badge-danger">
                          <span className="crm-dot-danger" />
                          Failed
                        </span>
                      )}
                      {!["success", "pending", "failed"].includes(t.status) && (
                        <span className="crm-badge-neutral">
                          <span className="crm-dot-neutral" />
                          {t.status || "Unknown"}
                        </span>
                      )}
                    </td>
                    <td className="text-slate-500">
                      {new Date(t.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
