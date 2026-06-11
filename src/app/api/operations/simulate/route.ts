import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/operations-simulator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenarioName, inputs } = body;

    if (!scenarioName || !inputs) {
      return NextResponse.json({ ok: false, error: "Missing scenarioName or inputs parameters" }, { status: 400 });
    }

    const result = await runSimulation(scenarioName, inputs);

    return NextResponse.json({
      ok: true,
      simulationId: result.simulationId,
      results: result.results
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
