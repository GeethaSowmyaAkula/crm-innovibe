import { createClient } from "@/lib/supabase/server";
import { getBookings, getTransactions } from "@/lib/laravel/api";
import { getDynamicKPIs } from "./kpi";
import { generateWithFallback } from "@/lib/ai/ai-client";
import { z } from "zod";

const BriefingAISchema = z.object({
  summary: z.string(),
  revenue_summary: z.string(),
  booking_summary: z.string(),
  complaint_summary: z.string(),
  goal_summary: z.string(),
  alerts_summary: z.string(),
  opps_summary: z.string(),
});


export interface ExecutiveBriefing {
  id?: string;
  type: "daily" | "weekly" | "monthly";
  period_key: string;
  date?: string;
  summary: string;
  revenue_summary: string;
  booking_summary: string;
  complaint_summary: string;
  goal_summary: string;
  alerts_summary: string;
  opps_summary: string;
  created_at?: string;
}

// Backwards compatibility alias
export type DailyBriefing = ExecutiveBriefing;

/**
 * Computes calendar keys for Daily, Weekly, and Monthly tracking
 */
export function getPeriodKeys() {
  const now = new Date();
  const dailyKey = now.toISOString().split("T")[0];
  
  // Weekly key calculation: YYYY-Www
  const target = new Date(now.valueOf());
  const dayNumber = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const weeklyKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  
  // Monthly key calculation: YYYY-MM
  const monthlyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return { dailyKey, weeklyKey, monthlyKey };
}

/**
 * Compiles and caches executive briefings for Daily, Weekly, or Monthly operational intervals.
 */
export async function getOrCreateExecutiveBriefing(
  type: "daily" | "weekly" | "monthly",
  preFetchedTxns?: any[],
  preFetchedBookings?: any[]
): Promise<ExecutiveBriefing> {
  const supabase = await createClient();
  const keys = getPeriodKeys();
  
  let periodKey = keys.dailyKey;
  let filterDays = 1;
  
  if (type === "weekly") {
    periodKey = keys.weeklyKey;
    filterDays = 7;
  } else if (type === "monthly") {
    periodKey = keys.monthlyKey;
    filterDays = 30;
  }

  // 1. Try to load cached briefing
  const { data: cached } = await supabase
    .from("daily_briefings") // maps to daily_briefings table
    .select("*")
    .eq("type", type)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (cached) return cached;

  // 2. Fetch live metrics
  const cutoffDate = new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000);

  // A. Transactions
  let totalRevenue = 0;
  let successfulTxns = 0;
  let failedTxns = 0;
  try {
    const txns = preFetchedTxns || await getTransactions().catch(() => []);
    const filteredTxns = txns.filter((t: any) => new Date(t.created_at || t.timestamp) >= cutoffDate);
    const successList = filteredTxns.filter((t: any) => t.status === "success");
    
    totalRevenue = successList.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    successfulTxns = successList.length;
    failedTxns = filteredTxns.length - successfulTxns;
  } catch (e) {
    totalRevenue = 0;
    successfulTxns = 0;
    failedTxns = 0;
  }

  // B. Bookings
  let totalBookings = 0;
  let completedBookings = 0;
  let activeBookings = 0;
  try {
    const bookings = preFetchedBookings || await getBookings().catch(() => []);
    const filteredBookings = bookings.filter((b: any) => new Date(b.created_at) >= cutoffDate);
    
    totalBookings = filteredBookings.length;
    completedBookings = filteredBookings.filter((b: any) => ["booking.completed", "completed"].includes(b.status)).length;
    activeBookings = filteredBookings.filter((b: any) => ["pending", "assigned", "in_progress"].includes(b.status)).length;
  } catch (e) {
    totalBookings = 0;
    completedBookings = 0;
    activeBookings = 0;
  }

  // C. Unresolved Complaints count
  let activeComplaints = 0;
  try {
    const { count } = await supabase
      .from("complaints")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    activeComplaints = count || 0;
  } catch (e) {
    activeComplaints = 0;
  }

  // D. Telemetry warnings
  let activeAlerts = 0;
  try {
    const { count } = await supabase
      .from("device_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    activeAlerts = count || 0;
  } catch (e) {
    activeAlerts = 0;
  }

  // E. Strategic Opportunities count
  let opportunityCount = 0;
  try {
    const { count } = await supabase
      .from("strategy_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    opportunityCount = count || 0;
  } catch (e) {
    opportunityCount = 0;
  }

  // F. Fetch dynamic KPIs
  const kpis = await getDynamicKPIs(preFetchedTxns);
  const progressText = kpis
    .map(k => `${k.name}: ${k.current_value}/${k.target} (${k.trend.toUpperCase()})`)
    .join(" · ");

  // 3. Compile summaries
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Date().toLocaleDateString("en-IN", dateOptions);
  
  const now = new Date();
  let label = `Daily Brief for ${formattedDate}`;
  if (type === "weekly") label = `Weekly Brief for Week ${keys.weeklyKey.split("-W")[1]} (${now.getFullYear()})`;
  if (type === "monthly") label = `Monthly Brief for ${now.toLocaleString("en-IN", { month: 'long', year: 'numeric' })}`;

  let revenue_summary = `Revenue is ₹${totalRevenue.toLocaleString("en-IN")} from ${successfulTxns} cleared payments. ${failedTxns} transactions failed in this ${type.replace("ly", "")} window.`;
  let booking_summary = `Total Bookings processed: ${totalBookings} (${completedBookings} completed, ${activeBookings} currently active).`;
  let complaint_summary = `Active unresolved customer complaints: ${activeComplaints} tickets pending in queue.`;
  let goal_summary = `Goal Performance: ${progressText || "No active targets"}.`;
  let alerts_summary = `Active telemetry alerts detected: ${activeAlerts} hardware alerts operational.`;
  let opps_summary = `${opportunityCount} open business growth opportunities detected. Expected potential revenue: ₹${(opportunityCount * 250).toLocaleString("en-IN")}.`;
  let summary = `CEO Operating System ${label}. Overall business status is stable. Period revenue totals ₹${totalRevenue.toLocaleString("en-IN")}. There are ${activeBookings} active bookings under execution, ${activeComplaints} unresolved complaints, and ${activeAlerts} system alerts requiring attention.`;

  try {
    const systemPrompt = `You are the InnoVibe Executive Briefing AI. Your role is to analyze raw operational and financial metrics for InnoVibe (a high-growth smart mobility CRM startup) and draft highly professional, narrative-driven, and insightful summaries for the CEO dashboard. 
Your summaries must be based strictly on the provided real metrics without inventing any fake statistics or placeholders. Keep the tone highly analytical, executive, objective, and direct.`;

    const userPrompt = `Generate the daily/weekly/monthly briefing summaries for type "${type}" (${label}) with the following operational data:
- Revenue: ₹${totalRevenue} from ${successfulTxns} successful transactions (${failedTxns} failed).
- Bookings: ${totalBookings} total (${completedBookings} completed, ${activeBookings} active).
- Unresolved Customer Complaints: ${activeComplaints} open tickets.
- Goal Performance (KPIs): ${progressText || "None active"}.
- Active Hardware Telemetry Alerts: ${activeAlerts} alerts active.
- Strategic Growth Opportunities: ${opportunityCount} open opportunities.

Requirements for each summary field:
1. summary: A cohesive high-level operational overview of the business performance during this period. Keep it under 2 sentences.
2. revenue_summary: An analytical summary of revenue and payment performance, highlighting successful vs failed transaction ratios.
3. booking_summary: An analysis of booking and service delivery progression (completed vs active).
4. complaint_summary: A summary of unresolved customer issues and their operational urgency.
5. goal_summary: A professional assessment of strategic KPI target progress.
6. alerts_summary: An evaluation of hardware health and pending telemetry system alerts.
7. opps_summary: A strategic assessment of growth opportunities and their revenue potential.

Ensure the output is a valid JSON object matching the requested schema.`;

    const aiBrief = await generateWithFallback(systemPrompt, userPrompt, BriefingAISchema);
    
    summary = aiBrief.summary;
    revenue_summary = aiBrief.revenue_summary;
    booking_summary = aiBrief.booking_summary;
    complaint_summary = aiBrief.complaint_summary;
    goal_summary = aiBrief.goal_summary;
    alerts_summary = aiBrief.alerts_summary;
    opps_summary = aiBrief.opps_summary;
  } catch (error) {
    console.warn("Failed to generate AI executive briefing, falling back to heuristics:", error);
  }

  // 4. Save to database
  const newBrief: ExecutiveBriefing = {
    type,
    period_key: periodKey,
    date: type === "daily" ? keys.dailyKey : undefined,
    summary,
    revenue_summary,
    booking_summary,
    complaint_summary,
    goal_summary,
    alerts_summary,
    opps_summary
  };

  const { data: inserted, error: insertError } = await supabase
    .from("daily_briefings")
    .insert(newBrief)
    .select()
    .single();

  if (insertError) {
    console.error(`Failed to cache ${type} briefing:`, insertError.message);
    return newBrief;
  }

  return inserted;
}

// Wrapper to keep backwards compatibility
export async function getOrCreateDailyBriefing(): Promise<DailyBriefing> {
  return getOrCreateExecutiveBriefing("daily");
}
