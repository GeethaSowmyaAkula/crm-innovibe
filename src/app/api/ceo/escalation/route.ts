/**
 * src/app/api/ceo/escalation/route.ts
 * API Endpoint for Executing Escalation Actions
 */

import { NextResponse } from "next/server";
import { executeEscalationAction } from "@/lib/executive-escalation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json({ success: false, error: "Missing actionId" }, { status: 400 });
    }

    const success = await executeEscalationAction(actionId);

    return NextResponse.json({
      success,
      message: success ? "Escalation action executed successfully" : "Execution failed"
    });
  } catch (err: any) {
    console.error("CEO Escalation Action Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
