import { createClient } from "../src/lib/supabase/server";

async function query() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

  const db = await createClient();

  const autonomyRes = await db.from("ceo_autonomy_policies").select("*");
  console.log("Autonomy Policies count:", autonomyRes.data?.length, "Error:", autonomyRes.error);
  console.log(JSON.stringify(autonomyRes.data, null, 2));
}

query().catch(console.error);
