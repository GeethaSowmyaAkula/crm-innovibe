"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, CalendarX, Plus, RefreshCw } from "lucide-react";
import { AddBookingButton } from "@/components/forms/add-booking-button";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  customer_id: string;
  vehicle_id: string;
  issue_type: string | null;
  status: string; // pending, confirmed, completed, cancelled
  preferred_slot: string | null;
  amount?: number | null;
  created_at: string;
  customers: {
    full_name: string | null;
    phone: string | null;
  } | null;
  vehicles: {
    registration_number: string | null;
    model: string | null;
  } | null;
}

interface Customer { id: string; full_name: string; }
interface Vehicle { id: string; registration_number: string; customer_id: string; }
interface Garage  { id: string; name: string; }
interface Tech    { id: string; name: string; }

const TABS = [
  { id: "all", label: "All Bookings" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [technicians, setTechnicians] = useState<Tech[]>([]);

  async function loadBookings() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function loadMetadata() {
    try {
      const supabase = createClient();
      const [custRes, vehRes, garRes, techRes] = await Promise.all([
        supabase.from("customers").select("id, full_name").order("full_name"),
        supabase.from("vehicles").select("id, registration_number, customer_id"),
        supabase.from("garages").select("id, name").order("name"),
        supabase.from("technicians").select("id, name").order("name")
      ]);
      
      if (custRes.data) setCustomers(custRes.data);
      if (vehRes.data) setVehicles(vehRes.data);
      if (garRes.data) setGarages(garRes.data);
      if (techRes.data) setTechnicians(techRes.data);
    } catch (err) {
      console.error("Failed to load booking metadata", err);
    }
  }

  useEffect(() => {
    loadBookings();
    loadMetadata();
  }, []);

  const filtered = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return b.status === activeTab;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Bookings</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <button onClick={loadBookings} className="crm-btn-secondary crm-btn-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <AddBookingButton
            customers={customers}
            vehicles={vehicles}
            garages={garages}
            technicians={technicians}
            onSuccess={loadBookings}
          />
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

      {/* Body */}
      <div className="crm-body">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching bookings register...</p>
          </div>
        ) : error ? (
          <div className="crm-alert-danger max-w-xl mx-auto mt-4">
            <p className="font-semibold">Failed to fetch bookings data</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <CalendarX className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No bookings found</h4>
              <p className="crm-empty-desc">
                {activeTab !== "all"
                  ? `There are no bookings currently marked as '${activeTab}'.`
                  : "No bookings recorded in Supabase."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="crm-interactive">
                    <td className="font-mono text-xs text-blue-600 font-semibold">
                      {b.id.substring(0, 8)}
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">
                        {b.customers?.full_name || "—"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {b.customers?.phone || "—"}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-800">
                        {b.vehicles?.model || "—"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {b.vehicles?.registration_number || "—"}
                      </div>
                    </td>
                    <td className="text-slate-700 font-medium">
                      {b.issue_type || "General Maintenance"}
                    </td>
                    <td>
                      {b.status === "completed" && (
                        <span className="crm-badge-success">
                          <span className="crm-dot-success" />
                          Completed
                        </span>
                      )}
                      {b.status === "pending" && (
                        <span className="crm-badge-warning">
                          <span className="crm-dot-warning" />
                          Pending
                        </span>
                      )}
                      {b.status === "confirmed" && (
                        <span className="crm-badge-info">
                          <span className="crm-dot-info" />
                          Confirmed
                        </span>
                      )}
                      {b.status === "cancelled" && (
                        <span className="crm-badge-danger">
                          <span className="crm-dot-danger" />
                          Cancelled
                        </span>
                      )}
                      {!["completed", "pending", "confirmed", "cancelled"].includes(b.status) && (
                        <span className="crm-badge-neutral">
                          <span className="crm-dot-neutral" />
                          {b.status || "Unknown"}
                        </span>
                      )}
                    </td>
                    <td>
                      {(b.preferred_slot || b.created_at)
                        ? new Date(b.preferred_slot || b.created_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="text-right font-bold text-slate-900">
                      {b.amount ? `₹${Number(b.amount).toLocaleString("en-IN")}` : "—"}
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
