import { NextResponse } from "next/server";
import { getEnterpriseHealth } from "@/lib/enterprise-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getEnterpriseHealth();
    return NextResponse.json({ success: true, health });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
