/**
 * src/lib/ceo-constitution.ts
 * Governance Component 2: AI CEO Constitution — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export interface ConstitutionPrinciple {
  id?: string;
  principle_name: string;
  description: string;
  constraint_type: "max_budget" | "min_margin" | "min_csat" | "prevent_leakage";
  constraint_value: number;
  is_active: boolean;
}

export interface ValidationReport {
  passed: boolean;
  violations: string[];
}

/**
 * Validates a proposed action cost, expected CSAT impact, or revenue change against constitutional principles.
 */
export async function validateAgainstConstitution(params: {
  actionName: string;
  cost?: number;
  projectedCsat?: number;
  projectedRevenueImpact?: number;
}): Promise<ValidationReport> {
  try {
    const db = await createClient();

    // 1. Fetch active principles
    const { data: dbPrinciples, error } = await db
      .from("ceo_constitution")
      .select("*")
      .eq("is_active", true);

    const principles: ConstitutionPrinciple[] = dbPrinciples || [];
    const violations: string[] = [];

    // Seed default baseline principles if table is empty
    const activePrinciples = principles.length > 0 ? principles : [
      { principle_name: "Capital Spending Cap", constraint_type: "max_budget", constraint_value: 30000, description: "Capital allocation cost per single action cannot exceed ₹30,000 without board approval." },
      { principle_name: "Customer Trust Safeguard", constraint_type: "min_csat", constraint_value: 4.00, description: "Any simulation or shift reallocation must preserve a minimum CSAT rating of 4.0." },
      { principle_name: "Revenue Dilution Prevention", constraint_type: "prevent_leakage", constraint_value: 0, description: "No operation playbooks should cause net revenue leakage of more than ₹0." }
    ] as ConstitutionPrinciple[];

    // 2. Perform validations
    for (const p of activePrinciples) {
      if (p.constraint_type === "max_budget" && params.cost !== undefined) {
        if (params.cost > p.constraint_value) {
          violations.push(
            `Violation of '${p.principle_name}': Cost of ₹${params.cost.toLocaleString("en-IN")} exceeds the ceiling of ₹${p.constraint_value.toLocaleString("en-IN")}.`
          );
        }
      }

      if (p.constraint_type === "min_csat" && params.projectedCsat !== undefined) {
        if (params.projectedCsat < p.constraint_value) {
          violations.push(
            `Violation of '${p.principle_name}': Projected CSAT index of ${params.projectedCsat} falls below the floor of ${p.constraint_value}.`
          );
        }
      }

      if (p.constraint_type === "prevent_leakage" && params.projectedRevenueImpact !== undefined) {
        if (params.projectedRevenueImpact < p.constraint_value) {
          violations.push(
            `Violation of '${p.principle_name}': Projected revenue impact of -₹${Math.abs(params.projectedRevenueImpact).toFixed(0)} constitutes a budget deficit.`
          );
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  } catch (err: any) {
    console.error("Constitutional validation failed:", err.message);
    // Safe default: pass with warning if database is offline, but check basic caps
    const violations: string[] = [];
    if (params.cost !== undefined && params.cost > 30000) {
      violations.push("Capital Spending Cap: Default limit of ₹30,000 exceeded.");
    }
    return {
      passed: violations.length === 0,
      violations
    };
  }
}

/**
 * Adds a new constitutional principle.
 */
export async function addConstitutionPrinciple(p: Omit<ConstitutionPrinciple, "id">): Promise<boolean> {
  try {
    const db = await createClient();
    const { error } = await db
      .from("ceo_constitution")
      .insert({
        principle_name: p.principle_name,
        description: p.description,
        constraint_type: p.constraint_type,
        constraint_value: p.constraint_value,
        is_active: p.is_active
      });

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error("Failed to add constitution principle:", err.message);
    return false;
  }
}
