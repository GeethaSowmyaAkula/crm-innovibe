"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Plus, Loader2, Wrench, Users, DollarSign, Activity } from "lucide-react";
import { AddGarageButton } from "@/components/forms/add-garage-button";

interface Garage {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  capacity: number;
  available_slots: number;
  created_at: string;
}

interface AggregatedGarage extends Garage {
  current_load: number;
  technician_count: number;
  revenue_this_month: number;
  status: string; // active, inactive
}

export default function GaragesPage() {
  const supabase = createClient();
  const [garages, setGarages] = useState<AggregatedGarage[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);

      // Fetch all garages, technicians, and bookings
      const [garagesRes, techsRes, bookingsRes] = await Promise.all([
        supabase.from("garages").select("*").order("name", { ascending: true }),
        supabase.from("technicians").select("id, garage_id"),
        supabase.from("bookings").select("id, assigned_garage_id, amount, status")
      ]);

      if (garagesRes.error) throw garagesRes.error;

      const baseGarages = (garagesRes.data || []) as Garage[];
      const techs = techsRes.data || [];
      const bookings = bookingsRes.data || [];

      // Aggregate
      const aggregated: AggregatedGarage[] = baseGarages.map((g) => {
        const garageTechs = techs.filter((t) => t.garage_id === g.id).length;
        
        // Calculate revenue from completed bookings at this garage
        const garageRevenue = bookings
          .filter((b) => b.assigned_garage_id === g.id && b.status === "completed")
          .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        const current_load = g.capacity > 0 
          ? Math.round(((g.capacity - g.available_slots) / g.capacity) * 100) 
          : 0;

        return {
          ...g,
          current_load: Math.max(0, Math.min(100, current_load)),
          technician_count: garageTechs,
          revenue_this_month: garageRevenue,
          status: g.available_slots > 0 ? "active" : "inactive"
        };
      });

      setGarages(aggregated);
    } catch (err) {
      console.error("Failed to load garages", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Garages &amp; Service Hubs</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {garages.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <AddGarageButton />
        </div>
      </div>

      {/* Body */}
      <div className="crm-body">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching service centers list...</p>
          </div>
        ) : garages.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <MapPin className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No garages found</h4>
              <p className="crm-empty-desc">
                Get started by creating a garage hub or synchronizing database assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {garages.map((g) => {
              const load = g.current_load;
              let progressColor = "bg-blue-600";
              if (load > 85) progressColor = "bg-red-500";
              else if (load > 60) progressColor = "bg-amber-500";

              return (
                <div key={g.id} className="crm-card bg-white p-5 crm-hover-glow flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate max-w-full">
                        {g.name}
                      </h3>
                      {g.available_slots > 0 ? (
                        <span className="crm-badge-success shrink-0">Active</span>
                      ) : (
                        <span className="crm-badge-danger shrink-0">Inactive</span>
                      )}
                    </div>

                    {/* Location Tag */}
                    <span className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {g.city ? `${g.city}, ` : ""}{g.address || "No Address registered"}
                    </span>

                    <div className="w-full border-t border-slate-100 my-4" />

                    {/* Capacity Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Capacity Load</span>
                        <span>{load}% ({g.capacity - g.available_slots}/{g.capacity} slots)</span>
                      </div>
                      <div className="crm-progress-track">
                        <div
                          className={`crm-progress-fill ${progressColor}`}
                          style={{ width: `${load}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Staff</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        {g.technician_count} Techs
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Est. Revenue</span>
                      <div className="flex items-center gap-0.5 font-bold text-slate-800 mt-0.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        ₹{g.revenue_this_month.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
