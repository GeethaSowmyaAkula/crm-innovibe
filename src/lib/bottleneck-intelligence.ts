import { createClient } from "@/lib/supabase/server";
import { getBookings } from "@/lib/laravel/api";

export interface BottleneckDetail {
  id?: string;
  type: "technician" | "garage" | "booking" | "complaint" | "approval" | "assignment";
  severity: "critical" | "warning" | "info";
  context: {
    rootCause: string;
    impact: string;
    suggestedAction: string;
    expectedOutcome: string;
  };
  affected_entities: string[];
  confidence_score: number;
  revenue_impact: number;
}

/**
 * Bottleneck Intelligence Engine detects constraint points across operations,
 * calculates the associated revenue loss, and saves snapshots.
 */
export async function detectBottlenecks(): Promise<BottleneckDetail[]> {
  const supabase = await createClient();

  // Load live operational data
  const [
    bookingsRaw,
    { data: complaints },
    { data: technicians },
    { data: garages },
    { data: pendingRecommendations },
    { data: pendingExecutions }
  ] = await Promise.all([
    getBookings().catch(() => []),
    supabase.from("complaints").select("*"),
    supabase.from("technicians").select("*"),
    supabase.from("garages").select("*"),
    supabase.from("decision_recommendations").select("*").eq("status", "pending"),
    supabase.from("playbook_executions").select("*").in("status", ["suggested", "pending_approval"])
  ]);

  const bookings = bookingsRaw || [];
  const complaintList = complaints || [];
  const technicianList = technicians || [];
  const garageList = garages || [];
  const recList = pendingRecommendations || [];
  const executionList = pendingExecutions || [];

  const bottlenecks: BottleneckDetail[] = [];

  // Average booking price constant
  const AVG_BOOKING_VAL = 2500;

  // 1. Technician Bottleneck (techs with >= 3 active assignments)
  const overloadedTechs = technicianList.filter((t: any) => (t.current_assignments || 0) >= 3);
  if (overloadedTechs.length > 0) {
    const affected = overloadedTechs.map((t: any) => t.name || "Unknown Technician");
    const count = overloadedTechs.length;
    // Revenue impact: lost service efficiency, delay penalties
    const revenueImpact = count * 1200; 
    bottlenecks.push({
      type: "technician",
      severity: "critical",
      context: {
        rootCause: `${count} technician(s) currently overloaded with 3 or more concurrent assignments.`,
        impact: `Risk of SLA breaches, delay in service delivery, and technician burnout.`,
        suggestedAction: "Reroute bookings to less utilized technicians or trigger the Technician Shortage Playbook.",
        expectedOutcome: "Reduce average completion delays by 25% and improve regional rating."
      },
      affected_entities: affected,
      confidence_score: 90.00,
      revenue_impact: revenueImpact
    });
  }

  // 2. Garage Bottleneck (available slots <= 0 or workload exceeded)
  const overloadedGarages = garageList.filter((g: any) => (g.available_slots || 0) <= 0);
  if (overloadedGarages.length > 0) {
    const affected = overloadedGarages.map((g: any) => g.name || "Unknown Garage");
    const count = overloadedGarages.length;
    // Revenue impact: unfulfilled bookings that overflow
    const revenueImpact = count * AVG_BOOKING_VAL * 1.5; 
    bottlenecks.push({
      type: "garage",
      severity: "critical",
      context: {
        rootCause: `${count} service center(s) running at 100% capacity with 0 available slots.`,
        impact: "New incoming diagnostic requests in these zones are blocked or redirected, causing customer friction.",
        suggestedAction: "Onboard nearby partner service centers or authorize the Garage Overload Playbook.",
        expectedOutcome: "Unblock localized booking backlogs and recover potential lost bookings revenue."
      },
      affected_entities: affected,
      confidence_score: 92.50,
      revenue_impact: revenueImpact
    });
  }

  // 3. Booking Bottleneck (pending status for > 2 hours)
  const now = Date.now();
  const stuckPendingBookings = bookings.filter((b: any) => {
    if (!["pending", "booking.pending"].includes(b.status)) return false;
    const created = new Date(b.created_at).getTime();
    return (now - created) > 2 * 60 * 60 * 1000; // 2 hours
  });
  if (stuckPendingBookings.length > 0) {
    const affected = stuckPendingBookings.map((b: any) => `Booking #${b.id}`);
    const count = stuckPendingBookings.length;
    // Revenue impact: high cancellation risk for stuck bookings
    const revenueImpact = count * AVG_BOOKING_VAL * 0.40; 
    bottlenecks.push({
      type: "booking",
      severity: "warning",
      context: {
        rootCause: `${count} bookings remained in pending state for more than 2 hours without confirmation.`,
        impact: "Customer cancellations and drop-offs due to unconfirmed schedules.",
        suggestedAction: "Prompt team via automated notification for manual confirmation override or run scheduling auto-assigner.",
        expectedOutcome: "Improve confirmation times to target levels and reduce booking churn."
      },
      affected_entities: affected,
      confidence_score: 85.00,
      revenue_impact: revenueImpact
    });
  }

  // 4. Complaint Resolution Bottleneck (open/investigating for > 48 hours)
  const stuckComplaints = complaintList.filter((c: any) => {
    if (!["open", "investigating"].includes(c.status)) return false;
    const created = new Date(c.created_at).getTime();
    return (now - created) > 48 * 60 * 60 * 1000; // 48 hours
  });
  if (stuckComplaints.length > 0) {
    const affected = stuckComplaints.map((c: any) => `Complaint #${c.id}`);
    const count = stuckComplaints.length;
    // Revenue impact: customer lifetime value churn risk
    const revenueImpact = count * 1500; 
    bottlenecks.push({
      type: "complaint",
      severity: "warning",
      context: {
        rootCause: `${count} complaints have remained unresolved in open/investigating status for over 48 hours.`,
        impact: "Direct negative drag on customer satisfaction (CSAT) score and increased user churn rate.",
        suggestedAction: "Trigger the High Complaint Recovery Playbook to assign a dedicated escalation manager and issue discount vouchers.",
        expectedOutcome: "Fast-track resolution and prevent customer contract cancellations."
      },
      affected_entities: affected,
      confidence_score: 88.00,
      revenue_impact: revenueImpact
    });
  }

  // 5. Approval Bottleneck (pending CEO approvals for > 24 hours)
  const pendingApprovalsCount = recList.length + executionList.length;
  if (pendingApprovalsCount > 3) {
    const affected = [
      ...recList.map((r: any) => `Rec: ${r.title}`),
      ...executionList.map((e: any) => `Playbook Exec: #${e.id}`)
    ];
    // Revenue impact: delay in optimization campaigns/recovery actions
    const revenueImpact = pendingApprovalsCount * 950;
    bottlenecks.push({
      type: "approval",
      severity: "info",
      context: {
        rootCause: `${pendingApprovalsCount} strategic recommendations or playbooks are awaiting executive approval.`,
        impact: "Lag in executing revenue-generating opportunities and operations recovery plans.",
        suggestedAction: "Open the Executive Command Palette (Cmd+K) or Cockpit Decision Inbox to review and bulk approve decisions.",
        expectedOutcome: "Accelerate automation execution times and realize expected savings."
      },
      affected_entities: affected.slice(0, 5),
      confidence_score: 95.00,
      revenue_impact: revenueImpact
    });
  }

  // 6. Assignment Bottleneck (bookings without technicians for > 60 mins)
  const unassignedBookings = bookings.filter((b: any) => {
    // Check if bookings don't have technicians and created > 60m ago
    const created = new Date(b.created_at).getTime();
    return !b.technician_id && (now - created) > 60 * 60 * 1000;
  });
  if (unassignedBookings.length > 0) {
    const affected = unassignedBookings.map((b: any) => `Booking #${b.id}`);
    const count = unassignedBookings.length;
    // Revenue impact: lost technician slot utilization
    const revenueImpact = count * AVG_BOOKING_VAL * 0.25;
    bottlenecks.push({
      type: "assignment",
      severity: "critical",
      context: {
        rootCause: `${count} bookings are confirmed but have remained unassigned to any technician for over 60 minutes.`,
        impact: "Response SLA breached and technician idle-time increase in target region.",
        suggestedAction: "Trigger auto-dispatch algorithms to match technician skills or re-route slots.",
        expectedOutcome: "Bring assignment times back under the 30-minute target value."
      },
      affected_entities: affected,
      confidence_score: 87.00,
      revenue_impact: revenueImpact
    });
  }

  // Insert bottlenecks into Supabase database (in background / async)
  if (bottlenecks.length > 0) {
    const toInsert = bottlenecks.map(b => ({
      type: b.type,
      severity: b.severity,
      context: b.context,
      affected_entities: b.affected_entities,
      confidence_score: b.confidence_score,
      revenue_impact: b.revenue_impact
    }));

    // Perform fresh insert
    await supabase.from("bottleneck_intelligence").insert(toInsert);

    // Save bottleneck snapshot
    await supabase.from("bottleneck_snapshots").insert({
      bottlenecks_data: bottlenecks
    });
  }

  return bottlenecks;
}
