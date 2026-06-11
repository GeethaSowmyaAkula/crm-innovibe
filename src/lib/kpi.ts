import { createClient } from "@/lib/supabase/server";
import { getTransactions, getBookings } from "@/lib/laravel/api";

export interface KPIDefinition {
  name: string;
  formula: string;
  target: number;
  owner_department: string;
  current_value: number;
  trend: "up" | "down" | "stable";
}

/**
 * Calculates corporate KPIs dynamically on-the-fly from live database and API sources.
 */
export async function getDynamicKPIs(preFetchedTxns?: any[]): Promise<KPIDefinition[]> {
  const supabase = await createClient();

  // 1. Fetch definitions from kpi_registry
  const { data: dbKPIs, error } = await supabase
    .from("kpi_registry")
    .select("*");

  const kpis = dbKPIs || [];

  // 2. Perform live computations
  // A. Monthly Revenue (Live Laravel Transactions API)
  let totalRevenue = 0;
  try {
    const txns = preFetchedTxns || await getTransactions();
    totalRevenue = txns
      .filter((t: any) => t.status === "success")
      .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
  } catch (e) {
    console.error("KPI Revenue calculation failed:", e);
    totalRevenue = 0; // Fallback to 0 if failed
  }

  // B. Active Bookings (Supabase Bookings Cache)
  let activeBookings = 0;
  try {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "assigned", "in_progress"]);
    activeBookings = count || 0;
  } catch (e) {
    activeBookings = 0;
  }

  // C. Customer Satisfaction (Supabase Feedback Queue)
  let avgCsat = 0.0;
  try {
    const { data: feedbackData } = await supabase
      .from("feedback_queue")
      .select("feedback_rating")
      .not("feedback_rating", "is", null);

    if (feedbackData && feedbackData.length > 0) {
      const sum = feedbackData.reduce((acc: number, curr: any) => acc + Number(curr.feedback_rating), 0);
      avgCsat = Number((sum / feedbackData.length).toFixed(2));
    } else {
      avgCsat = 0.0; // Default
    }
  } catch (e) {
    avgCsat = 0.0;
  }

  // D. System Sync Success Rate (failed_sync_records)
  let syncSuccessRate = 100.0;
  try {
    const { count: failedCount } = await supabase
      .from("failed_sync_records")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed");

    const { count: totalSyncs } = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "RUN_MASTER_SYNC");

    const total = totalSyncs || 10;
    const failed = failedCount || 0;
    syncSuccessRate = Number((Math.max(0, 100 - (failed / total * 100))).toFixed(1));
  } catch (e) {
    syncSuccessRate = 100.0;
  }

  // E. AMC Subscription Rate
  let amcRate = 0;
  try {
    const { data: totalVehicles } = await supabase
      .from("vehicles")
      .select("amc_status");

    if (totalVehicles && totalVehicles.length > 0) {
      const activeAmc = totalVehicles.filter((v: any) => v.amc_status === "active").length;
      amcRate = Math.round((activeAmc / totalVehicles.length) * 100);
    } else {
      amcRate = 0; // Default fallback
    }
  } catch (e) {
    amcRate = 0;
  }

  // 3. Map dynamic values into definitions
  const valueMap: Record<string, number> = {
    "Monthly Revenue": totalRevenue,
    "Active Bookings": activeBookings,
    "Customer Satisfaction": avgCsat,
    "System Sync Success Rate": syncSuccessRate,
    "AMC Subscription Rate": amcRate
  };

  return kpis.map((k: any) => {
    const calculatedVal = valueMap[k.name] !== undefined ? valueMap[k.name] : 0;
    
    // Determine simulated trend based on target performance
    const targetPerf = calculatedVal / Number(k.target);
    const trend: "up" | "down" | "stable" = targetPerf > 0.9 ? "up" : targetPerf > 0.6 ? "stable" : "down";

    return {
      name: k.name,
      formula: k.formula,
      target: Number(k.target),
      owner_department: k.owner_department,
      current_value: calculatedVal,
      trend
    };
  });
}
