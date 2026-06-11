"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserCog, Search, Plus, Loader2, Star, Phone, Briefcase } from "lucide-react";

interface Technician {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null; // available, busy, offline
  rating: number | null;
  jobs_completed: number | null;
  specialty: string | null;
  garage_id: string | null;
  created_at: string;
}

export default function TechniciansPage() {
  const supabase = createClient();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  async function loadTechnicians() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .order("name", { ascending: true });
      if (data) setTechnicians(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTechnicians();
  }, []);

  const specialties = Array.from(
    new Set(technicians.map((t) => t.specialty).filter(Boolean))
  );

  const filtered = technicians.filter((t) => {
    const matchesSearch = (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" ? true : t.status === statusFilter;
    const matchesSpecialty = specialtyFilter === "" ? true : t.specialty === specialtyFilter;
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Technicians</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <button className="crm-btn-primary crm-btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Add Technician
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="crm-filter-bar">
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search technicians..."
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
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </select>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="crm-select"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s!}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="crm-body">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching technicians roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <UserCog className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No technicians found</h4>
              <p className="crm-empty-desc">
                {search || statusFilter || specialtyFilter
                  ? "Try resetting your search filters."
                  : "No technicians recorded in Supabase."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((t) => {
              const status = (t.status || "offline").toLowerCase();
              return (
                <div key={t.id} className="crm-card crm-hover-glow bg-white p-5 flex flex-col items-center text-center">
                  {/* Initials Avatar */}
                  <div className="crm-avatar h-14 w-14 text-sm tracking-wider mb-3">
                    {t.name ? getInitials(t.name) : "?"}
                  </div>
                  
                  {/* Name & Specialty */}
                  <h3 className="font-bold text-slate-900 text-sm truncate max-w-full">
                    {t.name || "Unnamed Technician"}
                  </h3>
                  <span className="text-slate-400 text-xs mt-0.5 font-medium flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {t.specialty || "General Service"}
                  </span>

                  {/* Status Badge */}
                  <div className="mt-3">
                    {status === "available" && (
                      <span className="crm-badge-success">
                        <span className="crm-dot-success" />
                        Available
                      </span>
                    )}
                    {status === "busy" && (
                      <span className="crm-badge-warning">
                        <span className="crm-dot-warning" />
                        Busy
                      </span>
                    )}
                    {status === "offline" && (
                      <span className="crm-badge-neutral">
                        <span className="crm-dot-neutral" />
                        Offline
                      </span>
                    )}
                  </div>

                  <div className="w-full border-t border-slate-100 my-4" />

                  {/* Stats & Metadata */}
                  <div className="grid grid-cols-2 w-full gap-2 text-left text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Rating</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800 mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                        {t.rating ? Number(t.rating).toFixed(1) : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jobs Completed</span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        {t.jobs_completed ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 py-2 rounded-md border border-slate-100">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <span>{t.phone || "No Phone Contact"}</span>
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
