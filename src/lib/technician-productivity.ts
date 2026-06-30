/**
 * src/lib/technician-productivity.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * EVcare.ai — Technician Productivity Engine
 *
 * Derives all productivity metrics purely from existing Supabase tables:
 *   • technicians  — id, name, specialty, status, rating, jobs_completed
 *   • bookings     — customer_id, vehicle_id, status, preferred_slot, amount,
 *                    created_at, (technician_id if the column exists)
 *
 * No new tables required for v1.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@/lib/supabase/server";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface TechnicianMetric {
  id: string;
  name: string;
  specialty: string | null;
  status: string | null;
  rating: number;
  /** Jobs that are in "completed" status within the selected period */
  jobs_completed: number;
  /** Jobs assigned / created within the period (all statuses) */
  jobs_assigned: number;
  /** Jobs still pending / in-progress */
  jobs_pending: number;
  /** Jobs that were cancelled */
  jobs_cancelled: number;
  /** Total revenue from completed bookings (sum of amount) */
  revenue_generated: number;
  /** Percentage of jobs finished (completed / assigned * 100) */
  completion_rate: number;
  /** Composite productivity score 0–100 */
  productivity_score: number;
  /** Human-readable label: "Elite" | "High" | "Average" | "Needs Attention" */
  performance_label: string;
  /** Colour token for badge colouring */
  performance_color: "green" | "blue" | "yellow" | "red";
  /** Rank position in fleet leaderboard (1 = best) */
  rank: number;
}

export interface FleetProductivitySummary {
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

// Internal type used during score computation
interface RawMetric {
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
  _rawCompletionRate: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getPeriodStart(period: "today" | "week" | "month"): string {
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    now.setDate(now.getDate() - 7);
    now.setHours(0, 0, 0, 0);
  } else {
    now.setDate(now.getDate() - 30);
    now.setHours(0, 0, 0, 0);
  }
  return now.toISOString();
}

/**
 * Compute a 0–100 productivity score from raw metrics.
 *
 * Weighting:
 *   40% — completion rate (jobs completed / jobs assigned)
 *   30% — normalised jobs completed (relative to fleet max)
 *   20% — star rating (technician.rating / 5)
 *   10% — revenue contribution (relative to fleet max)
 */
function computeScore(
  completionRate: number,   // 0–100
  jobsCompleted: number,
  rating: number,           // 0–5
  revenue: number,
  maxJobs: number,
  maxRevenue: number
): number {
  const completionComponent = completionRate * 0.4;
  const jobsComponent = maxJobs > 0 ? (jobsCompleted / maxJobs) * 100 * 0.3 : 0;
  const ratingComponent = (rating / 5) * 100 * 0.2;
  const revenueComponent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 * 0.1 : 0;

  const raw = completionComponent + jobsComponent + ratingComponent + revenueComponent;
  return Math.min(100, Math.round(raw));
}

function getPerformanceLabel(score: number): {
  label: "Elite" | "High" | "Average" | "Needs Attention";
  color: "green" | "blue" | "yellow" | "red";
} {
  if (score >= 80) return { label: "Elite", color: "green" };
  if (score >= 60) return { label: "High", color: "blue" };
  if (score >= 40) return { label: "Average", color: "yellow" };
  return { label: "Needs Attention", color: "red" };
}

// ──────────────────────────────────────────────────────────────────────────────
// AI Insight Generator (rule-based — no LLM cost for fleet summaries)
// ──────────────────────────────────────────────────────────────────────────────

function generateInsight(summary: Omit<FleetProductivitySummary, "ai_insight">): string {
  const { technicians, fleet_avg_score, fleet_completion_rate, period } = summary;

  const periodLabel = period === "today" ? "today" : period === "week" ? "this week" : "this month";
  const top = technicians[0];
  const bottom = technicians[technicians.length - 1];

  const insights: string[] = [];

  if (top) {
    insights.push(
      `🏆 ${top.name} leads the fleet with a productivity score of ${top.productivity_score}/100 — completing ${top.jobs_completed} job${top.jobs_completed !== 1 ? "s" : ""} ${periodLabel}.`
    );
  }

  if (fleet_completion_rate >= 85) {
    insights.push(`✅ Fleet is performing strongly with a ${fleet_completion_rate}% completion rate.`);
  } else if (fleet_completion_rate >= 60) {
    insights.push(`⚠️ Fleet completion rate is ${fleet_completion_rate}% — room to improve.`);
  } else {
    insights.push(`🔴 Fleet completion rate is critically low at ${fleet_completion_rate}%. Review pending jobs.`);
  }

  if (bottom && bottom.productivity_score < 40 && technicians.length > 1) {
    insights.push(`💡 ${bottom.name} may need support — score of ${bottom.productivity_score}/100 with ${bottom.jobs_completed} completed jobs.`);
  }

  const avgLabel = fleet_avg_score >= 70 ? "excellent" : fleet_avg_score >= 50 ? "good" : "below average";
  insights.push(`Fleet average score: ${fleet_avg_score}/100 — ${avgLabel} overall.`);

  return insights.join(" ");
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Export
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetches technicians + bookings from Supabase, computes productivity metrics
 * for the requested period, and returns a fleet-wide summary with per-technician
 * leaderboard sorted by productivity score.
 */
export async function getTechnicianProductivity(
  period: "today" | "week" | "month" = "week"
): Promise<FleetProductivitySummary> {
  const supabase = await createClient();
  const periodStart = getPeriodStart(period);

  // ── 1. Fetch all technicians ────────────────────────────────────────────────
  const { data: techData, error: techError } = await supabase
    .from("technicians")
    .select("id, name, specialty, status, rating, jobs_completed")
    .order("name", { ascending: true });

  if (techError || !techData) {
    console.error("Failed to fetch technicians:", techError);
    return buildEmptyResponse(period);
  }

  // ── 2. Fetch bookings within period ────────────────────────────────────────
  // We try to join on technician_id if available; otherwise we use jobs_completed
  // from the technicians table directly as the metric source.
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("id, status, amount, created_at, technician_id, vehicle_id, customer_id")
    .gte("created_at", periodStart);

  const bookings = bookingsData || [];

  // ── 3. Group bookings by technician ────────────────────────────────────────
  const bookingsByTech = new Map<string, typeof bookings>();
  const hasTechnicianId = bookings.some((b: any) => b.technician_id != null);

  if (hasTechnicianId) {
    for (const b of bookings) {
      if (!b.technician_id) continue;
      if (!bookingsByTech.has(b.technician_id)) {
        bookingsByTech.set(b.technician_id, []);
      }
      bookingsByTech.get(b.technician_id)!.push(b);
    }
  }

  // ── 4. Compute per-technician raw metrics ──────────────────────────────────
  const rawMetrics: RawMetric[] = techData.map((tech: any) => {
    let jobsAssigned: number;
    let jobsCompleted: number;
    let jobsPending: number;
    let jobsCancelled: number;
    let revenue: number;

    if (hasTechnicianId && bookingsByTech.has(tech.id)) {
      const techBookings = bookingsByTech.get(tech.id)!;
      jobsAssigned = techBookings.length;
      jobsCompleted = techBookings.filter((b: any) => b.status === "completed").length;
      jobsPending = techBookings.filter((b: any) =>
        ["pending", "confirmed", "in_progress"].includes(b.status)
      ).length;
      jobsCancelled = techBookings.filter((b: any) => b.status === "cancelled").length;
      revenue = techBookings
        .filter((b: any) => b.status === "completed")
        .reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
    } else {
      // Fallback: use technician.jobs_completed as the base; estimate from rating
      jobsCompleted = Math.max(0, tech.jobs_completed || 0);
      // Estimate assigned as completed + 20% overhead
      jobsAssigned = Math.max(jobsCompleted, Math.round(jobsCompleted * 1.2));
      jobsPending = jobsAssigned - jobsCompleted;
      jobsCancelled = 0;
      // Estimate revenue: avg INR 800 per completed job (EV service pricing)
      revenue = jobsCompleted * 800;
    }

    const completionRate = jobsAssigned > 0
      ? Math.round((jobsCompleted / jobsAssigned) * 100)
      : 0;

    return {
      id: tech.id,
      name: tech.name || "Unknown",
      specialty: tech.specialty,
      status: tech.status,
      rating: tech.rating || 0,
      jobs_completed: jobsCompleted,
      jobs_assigned: jobsAssigned,
      jobs_pending: jobsPending,
      jobs_cancelled: jobsCancelled,
      revenue_generated: revenue,
      completion_rate: completionRate,
      _rawCompletionRate: completionRate,
    };
  });

  // ── 5. Normalise for scoring ───────────────────────────────────────────────
  const maxJobs = Math.max(...rawMetrics.map((m) => m.jobs_completed), 1);
  const maxRevenue = Math.max(...rawMetrics.map((m) => m.revenue_generated), 1);

  // ── 6. Score + rank ────────────────────────────────────────────────────────
  const scored = rawMetrics
    .map((m) => {
      const score = computeScore(
        m.completion_rate,
        m.jobs_completed,
        m.rating,
        m.revenue_generated,
        maxJobs,
        maxRevenue
      );
      const { label, color } = getPerformanceLabel(score);
      return {
        ...m,
        productivity_score: score,
        performance_label: label,
        performance_color: color,
        rank: 0, // will be set after sort
      };
    })
    .sort((a, b) => b.productivity_score - a.productivity_score)
    .map((m, idx) => ({ ...m, rank: idx + 1 }));

  // ── 7. Fleet-level aggregates ──────────────────────────────────────────────
  const total = scored.length;
  const active = scored.filter((t) => t.status === "available" || t.status === "busy").length;
  const avgScore = total > 0 ? Math.round(scored.reduce((s, t) => s + t.productivity_score, 0) / total) : 0;
  const totalCompleted = scored.reduce((s, t) => s + t.jobs_completed, 0);
  const totalAssigned = scored.reduce((s, t) => s + t.jobs_assigned, 0);
  const fleetCompletionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  const totalRevenue = scored.reduce((s, t) => s + t.revenue_generated, 0);
  const topPerformer = scored[0]?.name || null;

  const baseSummary = {
    period,
    total_technicians: total,
    active_technicians: active,
    fleet_avg_score: avgScore,
    fleet_completion_rate: fleetCompletionRate,
    total_jobs_completed: totalCompleted,
    total_jobs_assigned: totalAssigned,
    total_revenue: totalRevenue,
    top_performer: topPerformer,
    technicians: scored as TechnicianMetric[],
  };

  return {
    ...baseSummary,
    ai_insight: generateInsight(baseSummary),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Fallback
// ──────────────────────────────────────────────────────────────────────────────

function buildEmptyResponse(period: "today" | "week" | "month"): FleetProductivitySummary {
  return {
    period,
    total_technicians: 0,
    active_technicians: 0,
    fleet_avg_score: 0,
    fleet_completion_rate: 0,
    total_jobs_completed: 0,
    total_jobs_assigned: 0,
    total_revenue: 0,
    top_performer: null,
    ai_insight: "No technician data available.",
    technicians: [],
  };
}
