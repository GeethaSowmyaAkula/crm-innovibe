/**
 * InnoVibe AIOS CRM — One-Command Setup Script
 * Run: node setup.js
 *
 * This writes your .env.local with the correct credentials
 * so the app connects to the InnoVibe backend automatically.
 */

const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, ".env.local");

const ENV_CONTENT = `# ─── Supabase (InnoVibe Shared Project) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://lufynzbrcfrcrgrecxfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y

# ─── Laravel Production API (api.innovibemobility.com) ───────────────────────
LARAVEL_API_URL=https://api.innovibemobility.com/api
LARAVEL_ADMIN_EMAIL=superadmin@innovibe.com
LARAVEL_ADMIN_PASSWORD=12345678
`;

if (fs.existsSync(ENV_PATH)) {
  console.log("⚠️  .env.local already exists — skipping (delete it first if you want to reset).");
  process.exit(0);
}

fs.writeFileSync(ENV_PATH, ENV_CONTENT, "utf-8");

console.log(`
✅  .env.local created successfully!

Connected to:
  • Supabase:  https://lufynzbrcfrcrgrecxfb.supabase.co
  • Laravel:   https://api.innovibemobility.com/api

Now run:
  npm install
  npm run dev

Then open → http://localhost:3000
`);
