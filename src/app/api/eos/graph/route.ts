/**
 * src/app/api/eos/graph/route.ts
 * EOS API: Enterprise Knowledge Graph
 *
 * GET  /api/eos/graph          — returns graph summary
 * POST /api/eos/graph          — rebuilds the full knowledge graph
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildKnowledgeGraph,
  getGraphSummary,
  traceRootCause,
  traceDownstreamImpact,
} from "@/lib/enterprise-knowledge-graph";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const nodeId = searchParams.get("nodeId");

    if (action === "root-cause" && nodeId) {
      const chains = await traceRootCause(nodeId);
      return NextResponse.json({ success: true, data: chains });
    }

    if (action === "downstream" && nodeId) {
      const impact = await traceDownstreamImpact(nodeId);
      return NextResponse.json({ success: true, data: impact });
    }

    const summary = await getGraphSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (err: any) {
    console.error("[EOS/graph] GET Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await buildKnowledgeGraph();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("[EOS/graph] POST Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
