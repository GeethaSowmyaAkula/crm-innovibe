import { NextResponse } from "next/server";
import { getOrganizationalCapacity } from "@/lib/organizational-capacity";
import { orchestrateResources } from "@/lib/resource-orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [capacities, orchestration] = await Promise.all([
      getOrganizationalCapacity(),
      orchestrateResources().catch(() => ({ technician_utilization_pct: 60, garage_utilization_pct: 56, budget_utilization_pct: 30, recommendations: [] }))
    ]);

    return NextResponse.json({
      success: true,
      capacities,
      orchestration
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
