"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserCog, Search, Plus, Loader2, Star, Phone, Briefcase,
  TrendingUp, Trophy, Target, Zap, AlertTriangle, RefreshCw,
  BarChart2, ChevronUp, ChevronDown, Minus, Award, Clock,
  CheckCircle2, XCircle, IndianRupee, Users, Activity
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Technician {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  rating: number | null;
  jobs_completed: number | null;
  specialty: string | null;
  garage_id: string | null;
  created_at: string;
}

interface TechnicianMetric {
  id: string;
  name: string;
  specialty: string | null;
  status: string | null;
  rating: number;
  jobs_completed: number;
  jobs_assigned: number;
  jobs_pending: number;
  jobs_cancelled: number;
  revenue_generated: number;
  completion_rate: number;
  productivity_score: number;
  performance_label: "Elite" | "High" | "Average" | "Needs Attention";
  performance_color: "green" | "blue" | "yellow" | "red";
  rank: number;
}

interface FleetSummary {
  period: "today" | "week" | "month";
  total_technicians: number;
  active_technicians: number;
  fleet_avg_score: number;
  fleet_completion_rate: number;
  total_jobs_completed: number;
  total_jobs_assigned: number;
  total_revenue: number;
  top_performer: string | null;
  ai_insight: string;
  technicians: TechnicianMetric[];
}

type Period = "today" | "week" | "month";
type SortKey = "rank" | "productivity_score" | "jobs_completed" | "completion_rate" | "revenue_generated" | "rating";
type SortDir = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERFORMANCE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200" },
  blue:   { bg: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200"    },
  yellow: { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200"   },
  red:    { bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200"     },
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  busy:      "bg-amber-100 text-amber-700",
  offline:   "bg-slate-100 text-slate-500",
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  const barColor =
    color === "green" ? "bg-emerald-500" :
    color === "blue"  ? "bg-blue-500"    :
    color === "yellow"? "bg-amber-500"   : "bg-red-500";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full">
      <Trophy className="w-4 h-4 text-amber-600" />
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
      <span className="text-sm font-bold text-slate-500">#2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
      <span className="text-sm font-bold text-orange-600">#3</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="text-sm font-semibold text-slate-400">#{rank}</span>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, color
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TechniciansPage() {
  const supabase = createClient();

  // ── List tab state ──
  const [technicians, setTechnicians]   = useState<Technician[]>([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [isAdding, setIsAdding]         = useState(false);
  const [newTech, setNewTech]           = useState({ name: "", phone: "", specialty: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Productivity tab state ──
  const [activeTab, setActiveTab]       = useState<"list" | "productivity">("list");
  const [period, setPeriod]             = useState<Period>("week");
  const [productivity, setProductivity] = useState<FleetSummary | null>(null);
  const [loadingProd, setLoadingProd]   = useState(false);
  const [prodError, setProdError]       = useState<string | null>(null);
  const [sortKey, setSortKey]           = useState<SortKey>("rank");
  const [sortDir, setSortDir]           = useState<SortDir>("asc");
  const [searchProd, setSearchProd]     = useState("");

  // ─── Load technicians list ────────────────────────────────────────────────

  const loadTechnicians = useCallback(async () => {
    try {
      setLoadingList(true);
      const { data } = await supabase
        .from("technicians")
        .select("*")
        .order("name", { ascending: true });
      if (data) setTechnicians(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadTechnicians(); }, [loadTechnicians]);

  // ─── Load productivity data ───────────────────────────────────────────────

  const loadProductivity = useCallback(async (p: Period) => {
    try {
      setLoadingProd(true);
      setProdError(null);
      const res = await fetch(`/api/technician-productivity?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FleetSummary = await res.json();
      setProductivity(data);
    } catch (err: any) {
      setProdError(err.message || "Failed to load productivity data");
    } finally {
      setLoadingProd(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "productivity") {
      loadProductivity(period);
    }
  }, [activeTab, period, loadProductivity]);

  // ─── Add technician ───────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!newTech.name || !newTech.phone) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newTech.name,
          phone: newTech.phone,
          skills: [newTech.specialty || "General Service"],
          availability: "available",
          current_assignments: 0,
          garage_id: null,
        }),
      });
      if (res.ok) {
        setIsAdding(false);
        setNewTech({ name: "", phone: "", specialty: "" });
        loadTechnicians();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── List helpers ─────────────────────────────────────────────────────────

  const specialties = Array.from(new Set(technicians.map((t) => t.specialty).filter(Boolean)));

  const filteredList = technicians.filter((t) => {
    const matchSearch = (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchSpec   = !specialtyFilter || t.specialty === specialtyFilter;
    return matchSearch && matchStatus && matchSpec;
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  // ─── Productivity sort ────────────────────────────────────────────────────

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const sortedTechs = [...(productivity?.technicians ?? [])]
    .filter((t) => t.name.toLowerCase().includes(searchProd.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] > b[sortKey] ? 1 : -1) * mul;
    });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="crm-page">

      {/* ── Toolbar ── */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Technicians</h1>
          {!loadingList && (
            <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {technicians.length}
            </span>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "list"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Team List
            </span>
          </button>
          <button
            onClick={() => setActiveTab("productivity")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "productivity"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Productivity
            </span>
          </button>
        </div>

        {activeTab === "list" && (
          <button
            onClick={() => setIsAdding(true)}
            className="crm-btn-primary flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Technician
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — TEAM LIST
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "list" && (
        <>
          {/* Add form */}
          {isAdding && (
            <div className="mx-6 mt-4 mb-2 p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-blue-700">Name *</label>
                <input
                  className="crm-input text-sm"
                  placeholder="Full name"
                  value={newTech.name}
                  onChange={(e) => setNewTech((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-blue-700">Phone *</label>
                <input
                  className="crm-input text-sm"
                  placeholder="+91 XXXXX XXXXX"
                  value={newTech.phone}
                  onChange={(e) => setNewTech((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-blue-700">Specialty</label>
                <input
                  className="crm-input text-sm"
                  placeholder="e.g. Battery, Motor"
                  value={newTech.specialty}
                  onChange={(e) => setNewTech((p) => ({ ...p, specialty: e.target.value }))}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !newTech.name || !newTech.phone}
                className="crm-btn-primary"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="crm-btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="crm-filters">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="crm-search w-full"
                placeholder="Search by name or specialty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="crm-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
            {specialties.length > 0 && (
              <select
                className="crm-select"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              >
                <option value="">All Specialties</option>
                {specialties.map((s) => (
                  <option key={s!} value={s!}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cards */}
          <div className="crm-content">
            {loadingList ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <UserCog className="h-10 w-10 opacity-30" />
                <p className="text-sm">No technicians found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredList.map((tech) => (
                  <div
                    key={tech.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {getInitials(tech.name || "?")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{tech.name || "—"}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Briefcase className="w-3 h-3" />
                          {tech.specialty || "General Service"}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${STATUS_STYLES[tech.status || "offline"] ?? STATUS_STYLES["offline"]}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
                      {(tech.status || "offline").charAt(0).toUpperCase() + (tech.status || "offline").slice(1)}
                    </span>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">Jobs Done</p>
                        <p className="text-base font-bold text-slate-700">{tech.jobs_completed ?? 0}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400">Rating</p>
                        <p className="text-base font-bold text-amber-500 flex items-center justify-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {tech.rating?.toFixed(1) ?? "—"}
                        </p>
                      </div>
                    </div>

                    {tech.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-3">
                        <Phone className="w-3 h-3" /> {tech.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — PRODUCTIVITY DASHBOARD
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "productivity" && (
        <div className="crm-content space-y-6">

          {/* Period selector + refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
              {(["today", "week", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                    period === p
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
            <button
              onClick={() => loadProductivity(period)}
              disabled={loadingProd}
              className="crm-btn-secondary flex items-center gap-1.5 text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingProd ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Loading / Error */}
          {loadingProd && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm">Computing productivity metrics…</p>
              </div>
            </div>
          )}

          {prodError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{prodError}</p>
            </div>
          )}

          {!loadingProd && !prodError && productivity && (
            <>
              {/* ── KPI Stat Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Fleet Avg Score"
                  value={`${productivity.fleet_avg_score}/100`}
                  sub="Composite score"
                  icon={Activity}
                  color="bg-blue-100 text-blue-700"
                />
                <StatCard
                  label="Completion Rate"
                  value={`${productivity.fleet_completion_rate}%`}
                  sub={`${productivity.total_jobs_completed} of ${productivity.total_jobs_assigned} jobs`}
                  icon={CheckCircle2}
                  color="bg-emerald-100 text-emerald-700"
                />
                <StatCard
                  label="Total Revenue"
                  value={`₹${productivity.total_revenue.toLocaleString("en-IN")}`}
                  sub="From completed jobs"
                  icon={IndianRupee}
                  color="bg-violet-100 text-violet-700"
                />
                <StatCard
                  label="Top Performer"
                  value={productivity.top_performer ?? "—"}
                  sub="Highest productivity score"
                  icon={Trophy}
                  color="bg-amber-100 text-amber-700"
                />
              </div>

              {/* ── AI Insight Banner ── */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">AI Insight</p>
                  <p className="text-sm text-blue-900 leading-relaxed">{productivity.ai_insight}</p>
                </div>
              </div>

              {/* ── Top 3 Podium ── */}
              {sortedTechs.length >= 2 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Top Performers
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {productivity.technicians.slice(0, 3).map((tech, i) => {
                      const styles = PERFORMANCE_STYLES[tech.performance_color];
                      return (
                        <div
                          key={tech.id}
                          className={`relative rounded-xl border p-4 ${styles.bg} ${styles.border} ${i === 0 ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
                        >
                          {i === 0 && (
                            <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              #1
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {tech.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${styles.text}`}>{tech.name}</p>
                              <p className="text-xs text-slate-500">{tech.specialty || "General Service"}</p>
                            </div>
                          </div>
                          <ScoreBar score={tech.productivity_score} color={tech.performance_color} />
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                            <div>
                              <p className="text-slate-400">Jobs Done</p>
                              <p className="font-bold text-slate-700">{tech.jobs_completed}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Completion</p>
                              <p className="font-bold text-slate-700">{tech.completion_rate}%</p>
                            </div>
                          </div>
                          <div className={`mt-2 inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${styles.text} ${styles.border} bg-white`}>
                            {tech.performance_label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Full Leaderboard Table ── */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" /> Full Leaderboard
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      className="crm-search pl-8 text-sm"
                      placeholder="Filter technician…"
                      value={searchProd}
                      onChange={(e) => setSearchProd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {[
                            { key: "rank" as SortKey,                label: "Rank"        },
                            { key: null,                             label: "Technician"  },
                            { key: "productivity_score" as SortKey,  label: "Score"       },
                            { key: "jobs_completed" as SortKey,      label: "Completed"   },
                            { key: "completion_rate" as SortKey,     label: "Rate %"      },
                            { key: "revenue_generated" as SortKey,   label: "Revenue ₹"  },
                            { key: "rating" as SortKey,              label: "Rating"      },
                            { key: null,                             label: "Status"      },
                            { key: null,                             label: "Label"       },
                          ].map(({ key, label }, i) => (
                            <th
                              key={i}
                              onClick={() => key && toggleSort(key)}
                              className={`px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap ${key ? "cursor-pointer hover:text-blue-600 select-none" : ""}`}
                            >
                              <span className="flex items-center gap-1">
                                {label}
                                {key && <SortIcon col={key} />}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedTechs.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                              No technicians found
                            </td>
                          </tr>
                        ) : (
                          sortedTechs.map((tech) => {
                            const styles = PERFORMANCE_STYLES[tech.performance_color];
                            return (
                              <tr
                                key={tech.id}
                                className="hover:bg-blue-50/30 transition-colors"
                              >
                                {/* Rank */}
                                <td className="px-4 py-3">
                                  <RankBadge rank={tech.rank} />
                                </td>

                                {/* Name */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                      {tech.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800">{tech.name}</p>
                                      <p className="text-xs text-slate-400">{tech.specialty || "General"}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Score */}
                                <td className="px-4 py-3 min-w-[120px]">
                                  <ScoreBar score={tech.productivity_score} color={tech.performance_color} />
                                </td>

                                {/* Jobs completed */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="font-semibold text-slate-700">{tech.jobs_completed}</span>
                                    {tech.jobs_pending > 0 && (
                                      <span className="text-xs text-slate-400">({tech.jobs_pending} pending)</span>
                                    )}
                                  </div>
                                </td>

                                {/* Completion rate */}
                                <td className="px-4 py-3">
                                  <span className={`font-bold ${tech.completion_rate >= 80 ? "text-emerald-600" : tech.completion_rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                                    {tech.completion_rate}%
                                  </span>
                                </td>

                                {/* Revenue */}
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-700">
                                    ₹{tech.revenue_generated.toLocaleString("en-IN")}
                                  </span>
                                </td>

                                {/* Rating */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="font-semibold text-slate-700">{tech.rating.toFixed(1)}</span>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[tech.status || "offline"] ?? STATUS_STYLES["offline"]}`}>
                                    {(tech.status || "offline").charAt(0).toUpperCase() + (tech.status || "offline").slice(1)}
                                  </span>
                                </td>

                                {/* Performance label */}
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${styles.text} ${styles.border} ${styles.bg}`}>
                                    {tech.performance_label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {sortedTechs.length} technician{sortedTechs.length !== 1 ? "s" : ""}
                      {searchProd && ` matching "${searchProd}"`}
                    </span>
                    <span>
                      {productivity.active_technicians} active · Period: {period === "today" ? "Today" : period === "week" ? "This Week" : "This Month"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Score Breakdown Legend ── */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Productivity Score Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold text-slate-700 mb-1">40% — Completion Rate</p>
                    <p className="text-slate-400">Jobs completed vs. assigned</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold text-slate-700 mb-1">30% — Job Volume</p>
                    <p className="text-slate-400">Relative to fleet maximum</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold text-slate-700 mb-1">20% — Star Rating</p>
                    <p className="text-slate-400">Customer satisfaction score</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold text-slate-700 mb-1">10% — Revenue</p>
                    <p className="text-slate-400">Revenue contribution vs. fleet max</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "Elite", range: "80–100", color: "green" },
                    { label: "High",  range: "60–79",  color: "blue"  },
                    { label: "Average", range: "40–59", color: "yellow" },
                    { label: "Needs Attention", range: "0–39", color: "red" },
                  ].map(({ label, range, color }) => {
                    const s = PERFORMANCE_STYLES[color];
                    return (
                      <span key={label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.text} ${s.border} ${s.bg}`}>
                        {label} <span className="opacity-60">{range}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
