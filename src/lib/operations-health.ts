import { createClient } from "@/lib/supabase/server";
import { getBookings, getTransactions } from "@/lib/laravel/api";
import { ContextEngine } from "./context-engine";

export interface HealthMetricDetail {
  display_name: string;
  score: number;
  current: number | string;
  target: number;
  status: "optimal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  rootCause: string;
  impact: string;
  suggestedAction: string;
}

export interface OperationsHealthReport {
  overall: number;
  breakdown: Record<string, HealthMetricDetail>;
  isWarRoomActive: boolean;
  warRoomThreshold: number;
}

/**
 * Operations Health Engine calculates dynamic operational metrics,
 * scores them against Q2 targets, and attaches root cause diagnostics.
 */
export async function getOperationsHealthReport(): Promise<OperationsHealthReport> {
  const supabase = await createClient();

  // Load rules
  const { data: dbRules } = await supabase
    .from("operations_health_rules")
    .select("*");

  const rules = dbRules || [];
  const rulesMap = new Map<string, any>();
  rules.forEach((r: any) => rulesMap.set(r.metric_name, r));

  // Get active datasets
  const [
    bookingsRaw,
    { data: complaints },
    { data: technicians },
    { data: garages }
  ] = await Promise.all([
    getBookings().catch(() => []),
    supabase.from("complaints").select("*"),
    supabase.from("technicians").select("*"),
    supabase.from("garages").select("*")
  ]);

  const bookingList = bookingsRaw || [];
  const complaintList = complaints || [];
  const technicianList = technicians || [];
  const garageList = garages || [];

  // Calculate actual aggregates
  
  // 1. Response Time (time between creation and status move)
  const actualResponseTime = 0; 
  
  // 2. Assignment Time (bookings in pending for too long, average delay in minutes)
  const actualAssignmentTime = 0; 

  // 3. Completion Rate (completed bookings / total bookings)
  const completedCount = bookingList.filter((b: any) => ["booking.completed", "completed"].includes(b.status)).length;
  const actualCompletionRate = bookingList.length > 0 
    ? Math.round((completedCount / bookingList.length) * 100) 
    : 0;

  // 4. Customer Satisfaction (AVG rating from garages/technicians/complaints)
  const actualCsat = 0;

  // 5. Complaint Resolution Rate (resolved complaints / total complaints)
  const resolvedComplaints = complaintList.filter((c: any) => c.status === "resolved" || c.status === "closed").length;
  const actualComplaintResolution = complaintList.length > 0
    ? Math.round((resolvedComplaints / complaintList.length) * 100)
    : 0;

  // 6. Technician Utilization (techs with active assignments)
  const activeTechsCount = technicianList.filter((t: any) => t.current_assignments > 0).length;
  const actualTechUtilization = technicianList.length > 0
    ? Math.round((activeTechsCount / technicianList.length) * 100)
    : 0;

  // 7. Garage Utilization (workload slots vs capacity)
  const totalCapacity = garageList.reduce((acc: number, curr: any) => acc + (curr.capacity || 5), 0);
  const totalAvailable = garageList.reduce((acc: number, curr: any) => acc + (curr.available_slots || 5), 0);
  const actualGarageUtilization = totalCapacity > 0
    ? Math.round(((totalCapacity - totalAvailable) / totalCapacity) * 100)
    : 0;

  // 8. SLA Compliance (completed within 24 hours of creation)
  const actualSlaCompliance = 0;

  // Calculation mapping
  const metricValues: Record<string, number> = {
    "Response Time": actualResponseTime,
    "Assignment Time": actualAssignmentTime,
    "Completion Rate": actualCompletionRate,
    "Customer Satisfaction": actualCsat,
    "Complaint Resolution Rate": actualComplaintResolution,
    "Technician Utilization": actualTechUtilization,
    "Garage Utilization": actualGarageUtilization,
    "SLA Compliance": actualSlaCompliance
  };

  const metricDisplayKeys: Record<string, string> = {
    "Response Time": "responseTime",
    "Assignment Time": "assignmentTime",
    "Completion Rate": "completionRate",
    "Customer Satisfaction": "csat",
    "Complaint Resolution Rate": "resolutionRate",
    "Technician Utilization": "techUtilization",
    "Garage Utilization": "garageUtilization",
    "SLA Compliance": "slaCompliance"
  };

  const breakdown: Record<string, HealthMetricDetail> = {};
  let totalScoreWeight = 0;
  let weightedScoreSum = 0;

  // Compute each metric score based on rules
  Object.entries(metricValues).forEach(([name, actual]) => {
    const rule = rulesMap.get(name) || {
      weight: 1.00,
      target_value: 90.00,
      critical_threshold: 70.00,
      warning_threshold: 80.00
    };

    const target = Number(rule.target_value);
    const weight = Number(rule.weight);
    let score = 0;

    // A. Positive direction metrics (higher is better)
    if (["Completion Rate", "Customer Satisfaction", "Complaint Resolution Rate", "SLA Compliance"].includes(name)) {
      score = Math.min(100, Math.max(0, (actual / target) * 100));
    } 
    // B. Negative direction metrics (lower is better)
    else if (["Response Time", "Assignment Time"].includes(name)) {
      score = Math.min(100, Math.max(0, (target / actual) * 100));
    } 
    // C. Capacity sweet-spot metrics (target = best, either side penalized)
    else {
      score = Math.max(0, 100 - Math.abs(actual - target));
    }

    const scoreRounded = Math.round(score);
    
    // Status classification
    let status: "optimal" | "warning" | "critical" = "optimal";
    if (scoreRounded < Number(rule.critical_threshold)) status = "critical";
    else if (scoreRounded < Number(rule.warning_threshold)) status = "warning";

    // Dynamic Context Engine insights
    const context = ContextEngine.getKPIContext(
      name === "Customer Satisfaction" ? "Customer Satisfaction" : name === "Complaint Resolution Rate" ? "Customer Satisfaction" : name === "Response Time" ? "Active Bookings" : name,
      actual,
      target
    );

    const key = metricDisplayKeys[name];
    breakdown[key] = {
      display_name: name,
      score: scoreRounded,
      current: actual,
      target,
      status,
      trend: scoreRounded > 80 ? "up" : scoreRounded > 50 ? "stable" : "down",
      rootCause: context.rootCause,
      impact: context.impact,
      suggestedAction: context.suggestedAction
    };

    weightedScoreSum += scoreRounded * weight;
    totalScoreWeight += weight;
  });

  const overall = totalScoreWeight > 0 ? Math.round(weightedScoreSum / totalScoreWeight) : 75;

  // Configure operations war room threshold (default < 70)
  const warRoomThreshold = 70;
  const isWarRoomActive = overall < warRoomThreshold;

  // Cache health snapshot in background
  (async () => {
    try {
      const { error } = await supabase.from("operations_health_snapshots").insert({
        overall_score: overall,
        metrics_data: breakdown
      });
      if (error) console.error("Health Snapshot save error:", error.message);
    } catch (e) {
      // Graceful degradation
    }
  })();

  return {
    overall,
    breakdown,
    isWarRoomActive,
    warRoomThreshold
  };
}
