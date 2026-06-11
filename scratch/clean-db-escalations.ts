import { createClient } from "../src/lib/supabase/server";

async function clean() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

  const db = await createClient();

  // Get all active escalations to delete their actions
  const { data: escalations } = await db
    .from("executive_escalations")
    .select("id")
    .eq("status", "active");

  if (escalations && escalations.length > 0) {
    const ids = escalations.map((e: any) => e.id);
    
    console.log(`Deleting actions for ${ids.length} active escalations...`);
    const { error: actErr } = await db
      .from("escalation_actions")
      .delete()
      .in("escalation_id", ids);
    
    if (actErr) console.error("Error deleting actions:", actErr);

    console.log("Deleting active escalations...");
    const { error: escErr } = await db
      .from("executive_escalations")
      .delete()
      .in("id", ids);

    if (escErr) console.error("Error deleting escalations:", escErr);
  }

  console.log("Cleanup complete!");
}

clean().catch(console.error);
