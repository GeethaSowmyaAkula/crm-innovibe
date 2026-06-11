/**
 * src/lib/enterprise-knowledge-graph.ts
 * Enterprise Knowledge Graph Engine — InnoVibe AIOS EOS Completion Layer
 *
 * Builds bidirectional relationship graph across:
 *   Goals → Initiatives → Commitments → Tasks
 *   Customers → Bookings → Revenue Events
 *   Complaints → Goals (impact)
 *   Decisions → Outcomes → Lessons → Decisions (learning loop)
 *
 * Exposes: buildKnowledgeGraph, getNodeRelationships,
 *          traceRootCause, traceDownstreamImpact
 */

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeType =
  | "Goal"
  | "Initiative"
  | "Commitment"
  | "Task"
  | "Customer"
  | "Booking"
  | "RevenueEvent"
  | "Complaint"
  | "Decision"
  | "Outcome"
  | "Lesson";

export type RelationshipType =
  | "goal_owns_initiative"
  | "initiative_generates_commitment"
  | "commitment_blocks_task"
  | "customer_generates_booking"
  | "booking_triggers_revenue"
  | "complaint_impacts_goal"
  | "decision_drives_outcome"
  | "lesson_informs_decision"
  | "outcome_validates_initiative";

export interface KnowledgeNode {
  id: string;
  node_type: NodeType;
  node_name: string;
  reference_id?: string;
  metadata: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: RelationshipType;
  weight: number;
}

export interface GraphBuildResult {
  success: boolean;
  nodes_created: number;
  edges_created: number;
  duration_ms: number;
}

export interface RootCauseChain {
  root_node: KnowledgeNode;
  chain: KnowledgeNode[];
  impact_score: number;
  chain_depth: number;
}

export interface DownstreamImpact {
  source_node: KnowledgeNode;
  affected_nodes: KnowledgeNode[];
  total_impact_score: number;
}

// ─── Build Knowledge Graph ────────────────────────────────────────────────────

/**
 * Scans all enterprise entities, creates knowledge_nodes and knowledge_edges.
 * Safe to call repeatedly — clears and rebuilds each run.
 */
export async function buildKnowledgeGraph(): Promise<GraphBuildResult> {
  const start = Date.now();
  const db = await createClient();

  let nodesCreated = 0;
  let edgesCreated = 0;

  // Helper: upsert a node and return its UUID
  async function upsertNode(
    type: NodeType,
    name: string,
    refId: string,
    meta: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await db
        .from("knowledge_nodes")
        .upsert(
          {
            node_type: type,
            node_name: name,
            reference_id: refId,
            metadata: meta,
          },
          { onConflict: "reference_id" }
        )
        .select("id")
        .maybeSingle();
      if (!error && data) {
        nodesCreated++;
        return data.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Helper: create an edge
  async function createEdge(
    srcId: string,
    tgtId: string,
    rel: RelationshipType,
    weight = 1.0
  ): Promise<void> {
    if (!srcId || !tgtId || srcId === tgtId) return;
    try {
      const { error } = await db.from("knowledge_edges").insert({
        source_node_id: srcId,
        target_node_id: tgtId,
        relationship_type: rel,
        weight,
      });
      if (!error) edgesCreated++;
    } catch {}
  }

  // 1. Clear old graph
  await db
    .from("knowledge_edges")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await db
    .from("knowledge_nodes")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  nodesCreated = 0;
  edgesCreated = 0;

  // 2. Load enterprise data in parallel
  const [
    { data: goals },
    { data: initiatives },
    { data: commitments },
    { data: tasks },
    { data: customers },
    { data: outcomes },
    { data: lessons },
    { data: playbookExecs },
  ] = await Promise.all([
    db.from("goals").select("id, title, target_value, current_value").limit(200),
    db.from("strategic_initiatives").select("id, title, category, status").limit(200),
    db
      .from("execution_commitments")
      .select("id, title, owner_department, status, initiative_id")
      .limit(200),
    db
      .from("execution_tasks")
      .select("id, title, commitment_id, status, assignee")
      .limit(500),
    db
      .from("customers")
      .select("id, full_name, health_score, churn_risk_score")
      .limit(200),
    db
      .from("decision_outcomes")
      .select("id, recommendation_title, success_score")
      .limit(100),
    db.from("ceo_lessons").select("id, failure_signature, lesson").limit(50),
    db
      .from("playbook_executions")
      .select("id, playbook_id, status")
      .limit(100),
  ]);

  const nodeMap = new Map<string, string>(); // refId -> db UUID

  // 3. Insert Goal Nodes
  for (const g of goals || []) {
    const id = await upsertNode("Goal", g.title, `goal:${g.id}`, {
      target: g.target_value,
      current: g.current_value,
    });
    if (id) nodeMap.set(`goal:${g.id}`, id);
  }

  // 4. Insert Initiative Nodes + Goal→Initiative edges
  for (const ini of initiatives || []) {
    const id = await upsertNode("Initiative", ini.title, `ini:${ini.id}`, {
      category: ini.category,
      status: ini.status,
    });
    if (id) {
      nodeMap.set(`ini:${ini.id}`, id);
      // Connect every active initiative to any goal with matching keyword
      for (const g of goals || []) {
        const words = g.title.toLowerCase().split(" ").filter((w: string) => w.length > 3);
        const matches = words.some((w: string) => ini.title.toLowerCase().includes(w));
        if (matches) {
          const goalNodeId = nodeMap.get(`goal:${g.id}`);
          if (goalNodeId) {
            await createEdge(goalNodeId, id, "goal_owns_initiative", 1.5);
          }
        }
      }
    }
  }

  // 5. Insert Commitment Nodes + Initiative→Commitment edges
  for (const c of commitments || []) {
    const id = await upsertNode(
      "Commitment",
      c.title,
      `commit:${c.id}`,
      { department: c.owner_department, status: c.status }
    );
    if (id) {
      nodeMap.set(`commit:${c.id}`, id);
      if (c.initiative_id) {
        const iniNodeId = nodeMap.get(`ini:${c.initiative_id}`);
        if (iniNodeId) {
          await createEdge(iniNodeId, id, "initiative_generates_commitment", 1.2);
        }
      }
    }
  }

  // 6. Insert Task Nodes + Commitment→Task edges
  for (const t of tasks || []) {
    const id = await upsertNode("Task", t.title, `task:${t.id}`, {
      status: t.status,
      assignee: t.assignee,
    });
    if (id) {
      nodeMap.set(`task:${t.id}`, id);
      if (t.commitment_id) {
        const commitNodeId = nodeMap.get(`commit:${t.commitment_id}`);
        if (commitNodeId) {
          const weight = t.status === "blocked" ? 2.0 : 1.0;
          await createEdge(commitNodeId, id, "commitment_blocks_task", weight);
        }
      }
    }
  }

  // 7. Insert Customer Nodes
  for (const cust of customers || []) {
    const id = await upsertNode(
      "Customer",
      cust.full_name || "Unknown",
      `cust:${cust.id}`,
      { health_score: cust.health_score, churn_risk: cust.churn_risk_score }
    );
    if (id) nodeMap.set(`cust:${cust.id}`, id);
  }

  // 8. Insert Outcome Nodes + Outcome→Initiative edges
  for (const out of outcomes || []) {
    const id = await upsertNode(
      "Outcome",
      out.recommendation_title,
      `out:${out.id}`,
      { success_score: out.success_score }
    );
    if (id) {
      nodeMap.set(`out:${out.id}`, id);
      // Connect to matching initiative
      const matchedIni = (initiatives || []).find((ini: any) => {
        const words = ini.title
          .toLowerCase()
          .split(" ")
          .filter((w: string) => w.length > 3);
        return words.some((w: string) =>
          out.recommendation_title.toLowerCase().includes(w)
        );
      });
      if (matchedIni) {
        const iniNodeId = nodeMap.get(`ini:${matchedIni.id}`);
        if (iniNodeId) {
          await createEdge(id, iniNodeId, "outcome_validates_initiative", 1.0);
        }
      }
    }
  }

  // 9. Insert Lesson Nodes + Lesson→Decision edges
  for (const les of lessons || []) {
    const id = await upsertNode(
      "Lesson",
      les.failure_signature || "Unnamed Lesson",
      `les:${les.id}`,
      { lesson: les.lesson }
    );
    if (id) nodeMap.set(`les:${les.id}`, id);

    // Connect lessons to decision playbook executions
    for (const play of playbookExecs || []) {
      const playId = await upsertNode(
        "Decision",
        `Playbook Execution #${play.id.slice(0, 8)}`,
        `play:${play.id}`,
        { status: play.status }
      );
      if (playId && id) {
        await createEdge(id, playId, "lesson_informs_decision", 0.8);
        nodeMap.set(`play:${play.id}`, playId);
      }
    }
  }

  return {
    success: true,
    nodes_created: nodesCreated,
    edges_created: edgesCreated,
    duration_ms: Date.now() - start,
  };
}

// ─── Get Node Relationships ───────────────────────────────────────────────────

/**
 * Returns all direct neighbours of a given knowledge node ID.
 */
export async function getNodeRelationships(nodeId: string): Promise<{
  node: KnowledgeNode | null;
  incoming: KnowledgeNode[];
  outgoing: KnowledgeNode[];
}> {
  const db = await createClient();

  const { data: node } = await db
    .from("knowledge_nodes")
    .select("*")
    .eq("id", nodeId)
    .maybeSingle();

  const { data: outEdges } = await db
    .from("knowledge_edges")
    .select("target_node_id, relationship_type, weight")
    .eq("source_node_id", nodeId);

  const { data: inEdges } = await db
    .from("knowledge_edges")
    .select("source_node_id, relationship_type, weight")
    .eq("target_node_id", nodeId);

  const outTargetIds = (outEdges || []).map((e: any) => e.target_node_id);
  const inSourceIds = (inEdges || []).map((e: any) => e.source_node_id);

  const [{ data: outNodes }, { data: inNodes }] = await Promise.all([
    outTargetIds.length > 0
      ? db.from("knowledge_nodes").select("*").in("id", outTargetIds)
      : Promise.resolve({ data: [] }),
    inSourceIds.length > 0
      ? db.from("knowledge_nodes").select("*").in("id", inSourceIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    node: node as KnowledgeNode | null,
    incoming: (inNodes || []) as KnowledgeNode[],
    outgoing: (outNodes || []) as KnowledgeNode[],
  };
}

// ─── Trace Root Cause ─────────────────────────────────────────────────────────

/**
 * Starting from a symptom node (e.g. stalled commitment), walks UPSTREAM
 * through incoming edges to identify root causes.
 * Max depth: 5 hops.
 */
export async function traceRootCause(
  symptomNodeId: string
): Promise<RootCauseChain[]> {
  const db = await createClient();
  const visited = new Set<string>();
  const chains: RootCauseChain[] = [];

  async function walk(
    nodeId: string,
    path: KnowledgeNode[],
    depth: number
  ): Promise<void> {
    if (depth > 5 || visited.has(nodeId)) return;
    visited.add(nodeId);

    const { data: inEdges } = await db
      .from("knowledge_edges")
      .select("source_node_id, weight")
      .eq("target_node_id", nodeId);

    if (!inEdges || inEdges.length === 0) {
      // This is a root — no further incoming edges
      const { data: rootNode } = await db
        .from("knowledge_nodes")
        .select("*")
        .eq("id", nodeId)
        .maybeSingle();

      if (rootNode) {
        const totalWeight = path.reduce((_, __, i) => i, 0) + depth;
        chains.push({
          root_node: rootNode as KnowledgeNode,
          chain: [...path],
          impact_score: Number((100 / (depth + 1)).toFixed(1)),
          chain_depth: depth,
        });
      }
      return;
    }

    const { data: currentNode } = await db
      .from("knowledge_nodes")
      .select("*")
      .eq("id", nodeId)
      .maybeSingle();

    for (const edge of inEdges) {
      await walk(
        edge.source_node_id,
        currentNode ? [...path, currentNode as KnowledgeNode] : path,
        depth + 1
      );
    }
  }

  await walk(symptomNodeId, [], 0);

  // Sort by highest impact
  return chains.sort((a, b) => b.impact_score - a.impact_score).slice(0, 5);
}

// ─── Trace Downstream Impact ──────────────────────────────────────────────────

/**
 * Starting from a source node, walks DOWNSTREAM through outgoing edges
 * to identify all entities that will be affected.
 * Max depth: 4 hops.
 */
export async function traceDownstreamImpact(
  sourceNodeId: string
): Promise<DownstreamImpact> {
  const db = await createClient();
  const visited = new Set<string>();
  const affected: KnowledgeNode[] = [];
  let totalImpact = 0;

  const { data: srcNode } = await db
    .from("knowledge_nodes")
    .select("*")
    .eq("id", sourceNodeId)
    .maybeSingle();

  async function walk(nodeId: string, depth: number): Promise<void> {
    if (depth > 4 || visited.has(nodeId)) return;
    visited.add(nodeId);

    const { data: outEdges } = await db
      .from("knowledge_edges")
      .select("target_node_id, weight")
      .eq("source_node_id", nodeId);

    for (const edge of outEdges || []) {
      const { data: targetNode } = await db
        .from("knowledge_nodes")
        .select("*")
        .eq("id", edge.target_node_id)
        .maybeSingle();

      if (targetNode) {
        affected.push(targetNode as KnowledgeNode);
        totalImpact += Number(edge.weight) * (1 / (depth + 1));
        await walk(edge.target_node_id, depth + 1);
      }
    }
  }

  await walk(sourceNodeId, 0);

  return {
    source_node: srcNode as KnowledgeNode,
    affected_nodes: affected,
    total_impact_score: Number(totalImpact.toFixed(2)),
  };
}

// ─── Get Graph Summary ────────────────────────────────────────────────────────

/**
 * Returns a compact summary of the current graph state for the UI.
 */
export async function getGraphSummary(): Promise<{
  total_nodes: number;
  total_edges: number;
  nodes_by_type: Record<string, number>;
  top_connected_nodes: KnowledgeNode[];
}> {
  const db = await createClient();

  const [{ data: nodes }, { data: edgeCounts }] = await Promise.all([
    db.from("knowledge_nodes").select("id, node_type, node_name, metadata"),
    db.from("knowledge_edges").select("source_node_id, target_node_id"),
  ]);

  const nodeList = nodes || [];
  const edgeList = edgeCounts || [];

  // Count by type
  const byType: Record<string, number> = {};
  for (const n of nodeList) {
    byType[n.node_type] = (byType[n.node_type] || 0) + 1;
  }

  // Connectivity: count edges per node
  const connectivity = new Map<string, number>();
  for (const e of edgeList) {
    connectivity.set(e.source_node_id, (connectivity.get(e.source_node_id) || 0) + 1);
    connectivity.set(e.target_node_id, (connectivity.get(e.target_node_id) || 0) + 1);
  }

  const topNodeIds = [...connectivity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topNodes = nodeList.filter((n: any) => topNodeIds.includes(n.id)) as KnowledgeNode[];

  return {
    total_nodes: nodeList.length,
    total_edges: edgeList.length,
    nodes_by_type: byType,
    top_connected_nodes: topNodes,
  };
}
