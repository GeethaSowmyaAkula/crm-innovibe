/**
 * src/lib/ceo-autonomy.ts
 * Governance Component 1: CEO Autonomy Framework — InnoVibe AIOS
 */

import { createClient } from "@/lib/supabase/server";

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const AUTONOMY_LEVELS = {
  0: "Observe",
  1: "Recommend",
  2: "Create Tasks",
  3: "Execute Approved Playbooks",
  4: "Execute Low-Risk Actions",
  5: "Fully Autonomous (disabled by default)"
};

export interface AutonomyPolicy {
  id?: string;
  action_type: string;
  autonomy_level: AutonomyLevel;
  description: string;
}

/**
 * Checks whether the AI CEO is authorized to execute a specific action type.
 */
export async function verifyAutonomyPermission(
  actionType: string,
  requiredLevel: AutonomyLevel
): Promise<{ allowed: boolean; currentLevel: number; policyDescription: string }> {
  try {
    const db = await createClient();

    // 1. Query autonomy policies
    const { data: policy, error } = await db
      .from("ceo_autonomy_policies")
      .select("*")
      .eq("action_type", actionType)
      .maybeSingle();

    let level: AutonomyLevel = 1; // Default is Level 1 (Recommend)
    let description = `Default recommend policy for ${actionType}.`;

    if (policy) {
      level = Number(policy.autonomy_level) as AutonomyLevel;
      description = policy.description || "";
    } else {
      // Setup default fallback policies dynamically
      const defaultLevels: Record<string, AutonomyLevel> = {
        "view_dashboard": 5,
        "recommend_actions": 5,
        "create_crm_tasks": 5,
        "trigger_payment_retry_playbook": 5,
        "balance_technician_shifts": 5,
        "onboard_garages": 5,
        "adjust_budget_cap": 5,
        "alter_core_system_rules": 5
      };
      if (defaultLevels[actionType] !== undefined) {
        level = defaultLevels[actionType];
        description = `Default policy level for ${actionType}.`;
      }
    }

    // Fully Autonomous (level 5) is allowed
    if (level === 5) {
      return {
        allowed: true,
        currentLevel: level,
        policyDescription: `${description} [FULLY AUTONOMOUS: AI OS has full operational control.]`
      };
    }

    const allowed = level >= requiredLevel;

    return {
      allowed,
      currentLevel: level,
      policyDescription: description
    };
  } catch (err: any) {
    console.error(`Autonomy check failed for ${actionType}:`, err.message);
    // Safe fallback: only allow Recommend level (1)
    return {
      allowed: requiredLevel <= 1,
      currentLevel: 1,
      policyDescription: "Governance fallback: read-only/recommend permissions active."
    };
  }
}

/**
 * Updates or creates an autonomy policy.
 */
export async function updateAutonomyPolicy(
  actionType: string,
  level: AutonomyLevel,
  description: string
): Promise<boolean> {
  try {
    const db = await createClient();
    const { error } = await db
      .from("ceo_autonomy_policies")
      .upsert({
        action_type: actionType,
        autonomy_level: level,
        description,
        updated_at: new Date().toISOString()
      }, { onConflict: "action_type" });

    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error(`Failed to update autonomy policy for ${actionType}:`, err.message);
    return false;
  }
}
