/**
 * src/app/api/ceo/planner/route.ts
 * API Endpoint for CEO Strategic Planner
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStrategicInitiative, trackInitiativeProgress } from "@/lib/ceo-planner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();

    const [
      { data: initiatives },
      { data: tracking },
      { data: alignments }
    ] = await Promise.all([
      db.from("strategic_initiatives").select("*").order("created_at", { ascending: false }),
      db.from("initiative_tracking").select("*").order("logged_at", { ascending: false }),
      db.from("strategic_alignment_scores").select("*, goal:goals(title)")
    ]);

    return NextResponse.json({
      success: true,
      initiatives: initiatives || [],
      tracking: tracking || [],
      alignments: alignments || []
    });
  } catch (err: any) {
    console.error("CEO Planner GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Determine operation type
    if (body.action === "track") {
      const { initiativeId, progressChange, notes } = body;
      const res = await trackInitiativeProgress(initiativeId, Number(progressChange), notes);
      return NextResponse.json({ success: res });
    }

    // Default operation: create new initiative
    const newInit = {
      title: String(body.title),
      category: body.category || "operations",
      status: "active" as const,
      progress: 0.00,
      expected_impact: String(body.expected_impact),
      budget: Number(body.budget || 0.00),
      owner: body.owner || "CEO",
      success_probability: Number(body.success_probability || 90.00)
    };

    const res = await createStrategicInitiative(newInit);
    if (!res.success || !res.initiativeId) {
      throw new Error("Initiative creation failed");
    }

    return NextResponse.json({
      success: true,
      initiativeId: res.initiativeId
    });
  } catch (err: any) {
    console.error("CEO Planner POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
