import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReportSnapshot, getHistoricalSnapshots } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch templates
    const { data: templates } = await supabase
      .from("report_templates")
      .select("*");

    // Fetch snapshots
    const snapshots = await getHistoricalSnapshots();

    return NextResponse.json({
      ok: true,
      templates: templates || [],
      snapshots
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { templateId, name } = await req.json();

    if (!templateId || !name) {
      return NextResponse.json({ ok: false, error: "Missing templateId or name" }, { status: 400 });
    }

    const snapshot = await generateReportSnapshot(templateId, name);

    if (!snapshot) {
      return NextResponse.json({ ok: false, error: "Report generation failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Report snapshot '${name}' generated successfully.`,
      snapshot
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
