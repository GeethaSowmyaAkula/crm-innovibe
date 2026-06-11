/**
 * src/app/api/ceo/reflections/route.ts
 * API Endpoint for CEO Executive Reflection
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExecutiveReflection } from "@/lib/ceo-reflection";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await createClient();
    const { data: reflections } = await db
      .from("ceo_reflections")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      reflections: reflections || []
    });
  } catch (err: any) {
    console.error("CEO Reflections GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    if (type !== "weekly" && type !== "monthly") {
      return NextResponse.json(
        { success: false, error: "Reflection type must be 'weekly' or 'monthly'." },
        { status: 400 }
      );
    }

    const result = await generateExecutiveReflection(type);
    if (!result.success || !result.report) {
      throw new Error("Failed to generate reflection report.");
    }

    return NextResponse.json({
      success: true,
      report: result.report
    });
  } catch (err: any) {
    console.error("CEO Reflections POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
