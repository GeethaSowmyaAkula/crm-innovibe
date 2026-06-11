/**
 * src/lib/auth.ts
 * AIOS Role-Based Access Control (RBAC) Helper
 * 
 * In a production environment, this links to Supabase Auth and the `user_roles` table.
 * For local development, testing, and department-switching previews, we read the active
 * role from the "aios_role" cookie. Defaults to "CEO" to ensure full control out-of-the-box.
 */

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "CEO"
  | "Admin"
  | "Operations"
  | "Marketing"
  | "Finance"
  | "Technician"
  | "Garage_Manager"
  | "Fleet_Manager"
  | "Investor";

export interface AIOSUser {
  email: string;
  role: UserRole;
  name: string;
}

export async function getActiveUser(): Promise<AIOSUser> {
  const cookieStore = await cookies();
  const activeRole = cookieStore.get("aios_role")?.value as UserRole | undefined;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const email = user.email || "ceo@innovibe.in";
      const name = email.split("@")[0].toUpperCase();
      
      // Look up role in user_roles table
      const { data: dbRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", email)
        .maybeSingle();

      const role: UserRole = (dbRole?.role || activeRole || "CEO") as UserRole;

      return {
        email,
        role,
        name: role === "CEO" ? "CEO (Thalada Srinivas)" : `${role.replace("_", " ")} User`,
      };
    }
  } catch (e) {
    // Fallback if supabase client or request context is outside SSR
  }

  // Set default values for the simulated environment / fallback cookie
  const role: UserRole = activeRole || "CEO";
  const email = "ceo@innovibe.in";

  return {
    email,
    role,
    name: role === "CEO" ? "CEO (Thalada Srinivas)" : `${role.replace("_", " ")} Manager`,
  };
}

export async function hasPermission(requiredRoles: UserRole[]): Promise<boolean> {
  const user = await getActiveUser();
  
  // Admin and CEO have bypass permissions for everything
  if (user.role === "Admin" || user.role === "CEO") {
    return true;
  }
  
  return requiredRoles.includes(user.role);
}
