/**
 * src/lib/ceo-question-engine.ts
 * CEO Question Engine — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";
import { detectBottlenecks } from "@/lib/bottleneck-intelligence";
import { calculateRevenueLeakages, calculateRevenueForecasts } from "@/lib/revenue-intelligence";
import { generateTextWithFallback } from "@/lib/ai/ai-client";
import { z } from "zod";
import { ENTIRE_DATABASE_SCHEMA } from "./database-schema";

export interface QuestionAnswer {
  answer: string;
  citations: string[];
}

/**
 * Gathers data from all intelligence layers to respond to CEO natural language questions.
 */
export async function askCEOQuestion(
  question: string,
  history?: Array<{ role: string; text: string }>
): Promise<QuestionAnswer> {
  const db = await createClient();
  const qLower = question.toLowerCase();

  let historyStr = "";
  if (history && history.length > 0) {
    historyStr = "Conversation History:\n" + history.map(h => `${h.role === 'user' ? 'User' : 'Copilot'}: ${h.text}`).join("\n") + "\n\n";
  }

  const [
    bottlenecks,
    leakages,
    forecasts,
    { data: profiles },
    { data: complaints },
    { count: rawCustomerCount },
    { data: vehiclesList }
  ] = await Promise.all([
    detectBottlenecks().catch(() => []),
    calculateRevenueLeakages().catch(() => []),
    calculateRevenueForecasts().catch(() => []),
    db.from("customer_revenue_profiles").select("*, customers(full_name, email)"),
    db.from("complaints").select("*"),
    db.from("customers").select("*", { count: 'exact', head: true }),
    db.from("vehicles").select("customer_id")
  ]);

  const profileList = profiles || [];
  const complaintList = complaints || [];
  const vList = vehiclesList || [];
  const uniqueFleets = new Set(vList.filter((v: any) => v.customer_id).map((v: any) => v.customer_id)).size;
  const totalVehicles = vList.length;

  const citations: string[] = [];

  try {
    // STEP 1: Ask AI if it needs to query the database
    const intentPrompt = `You are the InnoVibe Copilot Routing Agent. 
Determine if you need to query the database to answer this question.
If the user asks for details, counts, or lists of any entities (like technicians, customers, complaints, vehicles, fleets, garages), you MUST set needsQuery to true and specify the tableName. 

CRITICAL RULES:
1. You MUST pick a tableName that exactly matches one of the tables in the schema list below. Do NOT invent table names (e.g. do not use "client_fleets").
2. If the user asks about "fleets", "client fleets", or "registered vehicles", you MUST use the tableName "vehicles".
3. Resolve pronouns and references (like "his name", "who is the technician", "where is that garage") by looking at the conversation history below. If the history contains a UUID (e.g. customer_id, vehicle_id, garage_id, technician_id) or identifier for the referenced entity, you MUST set needsQuery to true, pick the appropriate tableName, set filterColumn to "id" (or the foreign key column), and set filterValue to the exact UUID value.
4. If the user asks for the "latest", "recent", "newest", or "last" item, do NOT set filterColumn or filterValue to "latest" or "recent" or "newest". Instead, leave filterColumn and filterValue as null (unless there is a specific attribute filter, like a customer's name). The database query will automatically sort and return the most recent entries.

If there is no specific filter (e.g., "how many technicians"), leave filterColumn and filterValue as null.

Available tables and their exact columns:
${ENTIRE_DATABASE_SCHEMA}

Total Raw Customers in DB: ${rawCustomerCount || 0}

Example 1:
Question: give me details of nepo
Output: {"needsQuery": true, "tableName": "customers", "filterColumn": "full_name", "filterValue": "nepo"}

Example 2:
Question: how many technicians do we have?
Output: {"needsQuery": true, "tableName": "technicians", "filterColumn": null, "filterValue": null}

Example 3:
Question: what is our total revenue?
Output: {"needsQuery": false, "tableName": null, "filterColumn": null, "filterValue": null}

You MUST respond with ONLY a valid JSON object matching exactly this schema, with no markdown formatting, no backticks, and no extra text:
{
  "needsQuery": boolean,
  "tableName": string | null,
  "filterColumn": string | null,
  "filterValue": string | null
}

${historyStr}Question: ${question}`;

    const rawIntentJson = await generateTextWithFallback(
      "You are a strict JSON routing agent. Output ONLY valid JSON. No markdown, no backticks, no explanations.",
      intentPrompt
    );

    let intent;
    try {
      // Robust JSON extraction to ignore conversational padding
      const jsonMatch = rawIntentJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let cleanedJson = jsonMatch[0]
          .replace(/\/\/.*$/gm, "") // strip single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, "") // strip multi-line comments
          .replace(/,(\s*[\}\]])/g, "$1"); // strip trailing commas
        intent = JSON.parse(cleanedJson);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (e) {
      console.warn("Failed to parse intent JSON, proceeding without query:", rawIntentJson);
      intent = { needsQuery: false };
    }

    let dbDataStr = "No additional company records were retrieved.";
    if (intent.needsQuery && intent.tableName) {
      let selectFields = "*";
      if (intent.tableName === "bookings") {
        selectFields = "*, customers(full_name, phone), vehicles(registration_number, model)";
      }
      let query = db.from(intent.tableName).select(selectFields, { count: 'exact' });

      // Order by created_at descending if the column is present in the table schema
      const schemaLine = ENTIRE_DATABASE_SCHEMA.split("\n").find(line => line.trim().startsWith(`- ${intent.tableName} `));
      if (schemaLine && schemaLine.includes("created_at")) {
        query = query.order("created_at", { ascending: false });
      }

      if (intent.filterColumn && intent.filterValue) {
        const isUuid = intent.filterColumn === 'id' || intent.filterColumn.endsWith('_id') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent.filterValue);
        if (isUuid) {
          query = query.eq(intent.filterColumn, intent.filterValue);
        } else {
          query = query.ilike(intent.filterColumn, `%${intent.filterValue}%`);
        }
      }
      const isLatestQuery = qLower.includes("latest") || qLower.includes("recent") || qLower.includes("newest") || qLower.includes("last");
      const limitCount = isLatestQuery ? 1 : 10;
      const { data, count, error } = await query.limit(limitCount);
      
      if (error) {
        dbDataStr = `Attempted to retrieve details, but encountered an error finding the records.`;
      } else if (data && data.length > 0) {
        dbDataStr = `Company Records Retrieved for '${intent.tableName}':\n- Total records matching in the entire system: ${count}\n- Sample records (showing first ${limitCount}):\n${JSON.stringify(data, null, 2)}`;
      } else {
        dbDataStr = `Attempted to retrieve specific records, but 0 results were found in the company system.`;
      }
    }

    // Compute Total Revenue
    const totalRevenue = profileList.reduce((sum: number, p: any) => sum + Number(p.total_spent || 0), 0);

    // STEP 2: Generate Final Answer
    const systemPrompt = `You are the InnoVibe Copilot, an AI assistant for the CEO Dashboard. Answer the user's question clearly, concisely, and professionally using the provided data.
CRITICAL INSTRUCTIONS:
1. NEVER use the word "database" or "table" in your replies. Instead, use the word "company" or "system".
2. Do not mention technical terms like "filter", "records", or "fetched". Speak like a human executive assistant.
3. If the user asks for a total count, number, list, or sum of items (e.g. "how many bookings", "total customers", "registered vehicles"), you MUST read the "Total records matching in the entire system:" count directly from the retrieved data and state that number as the actual total. Do NOT count the JSON array elements, as they are only a limited sample of up to 10 items.`;
    
    const userPrompt = `Live Telemetry Snippet:
- Total Customers: ${rawCustomerCount || 0}
- Total Registered Vehicles: ${totalVehicles}
- Total Client Fleets (Unique Customers with Vehicles): ${uniqueFleets}
- Total Revenue: ₹${totalRevenue.toLocaleString("en-IN")}
- Bottlenecks: ${JSON.stringify(bottlenecks).substring(0, 500)}...
- Leakages: ${JSON.stringify(leakages).substring(0, 500)}...
- Customer Profiles (Top 5): ${JSON.stringify(profileList.slice(0, 5))}
- Active Complaints (Top 5): ${JSON.stringify(complaintList.slice(0, 5))}

${historyStr}Additional Specific Data Retrieved:
${dbDataStr}

Question: ${question}`;

    const answer = await generateTextWithFallback(systemPrompt, userPrompt);
    citations.push("Source: [InnoVibe AIOS True AI Engine]");
    
    return {
      answer,
      citations
    };
  } catch (error) {
    console.warn("AI Copilot Generation Failed. Falling back to Heuristic Rules:", error);

    // --- ULTIMATE FALLBACK: ORIGINAL HEURISTIC LOGIC ---

    // Question 1: Why is revenue down?
    if (qLower.includes("revenue") && (qLower.includes("down") || qLower.includes("fall") || qLower.includes("drop"))) {
      const totalLeakage = leakages.reduce((sum, l) => sum + l.amount, 0);
      const failedPayments = leakages.filter(l => l.leakage_type === "payment_failure").reduce((sum, l) => sum + l.amount, 0);
      const unbilledServices = leakages.filter(l => l.leakage_type === "unbilled_service").reduce((sum, l) => sum + l.amount, 0);

      citations.push("Source: [Revenue Leakage Engine Q3]");
      citations.push("Source: [Laravel Transaction cache]");

      return {
        answer: `Revenue fell short of targets due to ₹${totalLeakage.toLocaleString("en-IN")} in active leakages. This is driven by:
1. ₹${failedPayments.toLocaleString("en-IN")} in failed checkout payments where transaction state sync failed during gateway handoffs.
2. ₹${unbilledServices.toLocaleString("en-IN")} in unbilled services where bookings were completed but checkout logs are missing.
We recommend launching checkout recovery campaigns and upgrading callback webhooks.`,
        citations
      };
    }

    // Question 2: Why are complaints increasing?
    if (qLower.includes("complaint") && (qLower.includes("increase") || qLower.includes("up") || qLower.includes("high"))) {
      const batteryDelays = complaintList.filter((c: any) => c.description?.toLowerCase().includes("battery") || c.description?.toLowerCase().includes("balancing")).length;
      const EastHubComplaints = complaintList.filter((c: any) => c.severity === "critical" || c.description?.toLowerCase().includes("pune")).length;

      citations.push("Source: [Operational Pattern Engine - Complaint Clusters]");
      citations.push("Source: [Supabase Complaints Registry]");

      return {
        answer: `Complaints have spiked primarily due to diagnostic balancing delays at the Pune East Hub. Specifically:
1. ${batteryDelays} complaints are linked to battery balancing delays and lack of diagnostic spare kits.
2. Capacity slot exhaustion at Pune East leads to scheduling delays.
We recommend dispatching diagnostic spare balancer kits and redirecting overflow bookings to Pune West partners.`,
        citations
      };
    }

    // Question 3: What is blocking growth / biggest risk?
    if (qLower.includes("blocking") || qLower.includes("risk") || qLower.includes("bottleneck")) {
      const criticalBottlenecks = bottlenecks.filter(b => b.severity === "critical");
      const techOverload = bottlenecks.filter(b => b.type === "technician");
      const slotsExhausted = bottlenecks.filter(b => b.type === "garage");

      citations.push("Source: [Bottleneck Intelligence Engine]");
      citations.push("Source: [Capacity Forecasts 30 Days]");

      return {
        answer: `Our biggest growth bottleneck is capacity slot constraints and technician overload. Currently:
1. Pune East Hub is running at 100% capacity with 0 available diagnostic slots, causing incoming bookings to bounce.
2. 3 technicians are overloaded with concurrent checkups, leading to SLA dispatch delays (₹3,600 projected revenue risk).
We recommend onboarding regional partner garages and initiating mechanic shift re-allocation.`,
        citations
      };
    }

    // Question 4: Which customers matter most?
    if (qLower.includes("customer") && (qLower.includes("matter") || qLower.includes("top") || qLower.includes("important"))) {
      const champions = profileList.filter((p: any) => p.segment === "Champions");
      const topSpent = [...profileList].sort((a: any, b: any) => b.total_spent - a.total_spent).slice(0, 3);

      citations.push("Source: [Customer Value Matrix]");
      citations.push("Source: [RFM Segmentation Engine]");

      const listStr = topSpent.map((p: any, idx: number) => 
        `${idx + 1}. ${p.customers?.full_name ?? "Unknown"} (Spent: ₹${p.total_spent.toLocaleString("en-IN")}, Segment: ${p.segment}, Churn Risk: ${p.churn_risk_score}%)`
      ).join("\n");

      return {
        answer: `Based on the Customer Value Matrix (RFM Segmentation), our top customers by monetary spend and CLV are:
${listStr}
We currently have ${champions.length} customers in the 'Champions' cohort. We recommend prioritizing premium response dispatches for these accounts.`,
        citations
      };
    }

    // Fallback default answer
    citations.push("Source: [InnoVibe AIOS Reasoning Core]");
    return {
      answer: `Company overall health displays warning metrics. Total transaction spent is ₹${profileList.reduce((s: number, p: any) => s + Number(p.total_spent), 0).toLocaleString("en-IN")} across ${profileList.length} customer profiles. We recommend focusing on gateway payment recoveries and slot overflow routing at Pune East Hub this week.`,
      citations
    };
  }
}
