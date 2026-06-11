# InnoVibe AIOS CRM — Complete Implementation Guide

> Share this document with anyone cloning the repo. Follow every step in order and you will get the **exact same running app**.

---

## 📦 What You're Getting

A full **AI-powered CRM platform** built with:

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Server Components) |
| Database | Supabase (PostgreSQL) |
| Live API | Laravel Production API (`api.innovibemobility.com`) |
| UI | Tailwind CSS + shadcn/ui components |
| AI Engine | 40+ custom intelligence modules (CEO Cockpit, KPIs, Briefings, Operations) |
| Auth | Supabase Auth with middleware route protection |

---

## ✅ Prerequisites

Install these on your machine before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v20 or higher | https://nodejs.org |
| npm | v10+ (comes with Node) | — |
| Git | Any recent version | https://git-scm.com |

Verify your setup:
```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
git --version    # should print git version x.x.x
```

---

## 🚀 Step 1 — Clone the Repository

```bash
git clone git@github.com:srinivas191206/crm-innovibe.git
cd crm-innovibe
```

> If you don't have SSH key set up with GitHub, use HTTPS instead:
> ```bash
> git clone https://github.com/srinivas191206/crm-innovibe.git
> cd crm-innovibe
> ```

---

## 📦 Step 2 — Install Dependencies

```bash
npm install
```

This will install ~200 packages. Takes 1–2 minutes.

---

## 🔑 Step 3 — Create Environment File

Create a file called `.env.local` in the **root** of the project (same folder as `package.json`):

```bash
# On Mac/Linux
touch .env.local

# On Windows (PowerShell)
New-Item .env.local
```

Then open `.env.local` and paste **exactly** this content:

```env
# ─── Supabase (Shared Project) ─────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://lufynzbrcfrcrgrecxfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y

# ─── Laravel Production API ─────────────────────────────────────────────────
LARAVEL_API_URL=https://api.innovibemobility.com/api
LARAVEL_ADMIN_EMAIL=superadmin@innovibe.com
LARAVEL_ADMIN_PASSWORD=12345678
```

> **Note:** These connect to the **shared production backend**. All team members will see the same live data.

---

## ▶️ Step 4 — Start the Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.2.6 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in ~300ms
```

Open your browser and go to → **http://localhost:3000**

---

## 🗄️ Step 5 — Supabase Database (Already Set Up)

The Supabase database is already live and populated. You **do not need to run any migrations** — the shared project already has all 15 migration files applied.

If you ever need to reset or re-apply migrations (e.g., for your own Supabase project), the SQL files are in:

```
supabase/migrations/
  001_extend_reminder_queue.sql
  002_create_feedback_queue.sql
  003_aios_master_evolution.sql
  004_aios_phase1_5_and_2.sql
  005_rls_policies.sql
  006_aios_strengthening.sql
  007_aios_strategic_layers.sql
  008_operations_intelligence.sql
  009_intelligence_confidence_and_audit.sql
  010_revenue_intelligence.sql
  011_ai_ceo_layer.sql
  012_ceo_autonomous_evolution.sql
  013_enterprise_execution_layer.sql
  014_executive_systems.sql
  015_eos_completion_layer.sql
```

To apply them to a **fresh Supabase project**:
1. Create a new project at https://supabase.com
2. Go to **SQL Editor**
3. Paste and run each file in order (001 → 015)
4. Update `.env.local` with your new project URL and anon key

---

## 🖥️ All Pages & What They Show

| URL | Page | Real Data Source |
|-----|------|-----------------|
| `/` | **CEO Cockpit** | Health score, briefings (daily/weekly/monthly), KPIs, AI recommendations, decision inbox |
| `/ceo` | **CEO Dashboard** | AI reasoning engine, priorities, control tower |
| `/customers` | **Customers** | 103 real customers from Supabase |
| `/bookings` | **Bookings** | 71 bookings from Supabase + 156+ from Laravel API |
| `/technicians` | **Technicians** | 4 real technicians |
| `/garages` | **Garages** | 6 real service centres |
| `/vehicles` | **Vehicles** | 32 real vehicles |
| `/transactions` | **Payments** | Live from Laravel API |
| `/amc` | **AMC Contracts** | Annual Maintenance Contracts |
| `/complaints` | **Complaints** | Customer complaints queue |
| `/feedback` | **Feedback** | Customer reviews |
| `/leads` | **Sales Leads** | Lead pipeline |
| `/operations` | **Operations** | AI-powered bottleneck intelligence |
| `/sales` | **Sales Reports** | Revenue snapshots |
| `/fleet` | **Fleet** | Fleet management |
| `/strategy` | **Strategy** | 10 live strategy opportunities |
| `/history` | **History** | Decision & action history |
| `/knowledge` | **Knowledge** | AI knowledge graph |
| `/recommendations` | **Recommendations** | Live from Laravel + AI |
| `/reminders` | **Reminders** | Booking reminders queue |
| `/announcements` | **Announcements** | Push/SMS announcements |
| `/hardware/health` | **Hardware Health** | IoT device telemetry |
| `/hardware/telemetry` | **Telemetry** | Raw device data |
| `/brands` | **Brands** | EV brands (Ampere, Benling, etc.) |
| `/models` | **Vehicle Models** | 113+ models |
| `/services` | **Services** | Service catalog (e.g. Garage Service ₹499) |
| `/otp` | **OTP Logs** | Authentication OTP audit logs |
| `/settings` | **Settings** | System configuration |
| `/settings/sync-monitoring` | **Sync Monitor** | Data sync health |
| `/settings/event-monitoring` | **Event Monitor** | Event log |

---

## 📡 API Routes

All API endpoints are available at `/api/*`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/kpi` | Live KPI calculations |
| `GET /api/briefing?type=daily` | CEO briefing (daily/weekly/monthly) |
| `GET /api/relationship` | Customer relationship insights |
| `GET /api/operations/health` | Operations health score |
| `GET /api/operations/intelligence` | Bottleneck AI analysis |
| `GET /api/opportunities/detect` | Strategic opportunity detection |
| `GET /api/revenue/intelligence` | Revenue intelligence report |
| `POST /api/ceo/reasoning` | Trigger CEO AI reasoning engine |
| `GET /api/ceo/escalation` | Executive escalations |
| `POST /api/sync-core` | Sync Laravel data to Supabase |
| `GET /api/recommendations` | AI recommendations |
| `GET /api/outcomes` | Decision outcome history |

---

## 🧠 Real Data Available

### Laravel API (Live Production)
- **Users/Customers** — real mobile app users
- **Bookings** — real service bookings (ID goes to 156+)
- **Service Centers** — 7 garages with addresses
- **Brands** — EV brands (Ampere, Benling India, etc.)
- **Vehicle Models** — 113+ models
- **Services** — Service catalog with prices
- **Membership Plans** — Lifetime Plan (120 months) and others
- **Announcements** — SMS/push campaigns

### Supabase (CRM Layer)
- **103 Customers** with phone, email, health scores
- **71 Bookings** synced from Laravel
- **32 Vehicles** with brand/model info
- **229 Activity Feed** events
- **10 Strategy Opportunities**
- **6 Garages** with capacity/revenue data
- **4 Technicians** with ratings
- **5 KPI definitions** in registry
- **6 cached briefings** from AI engine
- **5 Decision Outcomes** + **6 Campaign Outcomes** (AI learning data)

---

## ⚠️ Known Limitations

| Issue | Detail |
|-------|--------|
| Revenue shows ₹0 | All Laravel transactions have `status: "pending"` — payment gateway not confirming payments |
| Complaints = 0 | No complaints entered yet |
| Goals/OKRs = 0 | No OKR cycles created |
| AMC = 0 | `amc_status` not populated on customer records |
| Health Score | Uses fallback values — `health_score_rules` table is empty |

---

## 🛠️ Useful Commands

```bash
# Start dev server
npm run dev

# Build for production (verify no errors)
npm run build

# Start production server (after build)
npm start

# Check TypeScript types
npx tsc --noEmit
```

---

## 📁 Project Structure

```
crm-innovibe/
├── src/
│   ├── app/                  # All pages (Next.js App Router)
│   │   ├── page.tsx          # CEO Cockpit (home)
│   │   ├── ceo/              # CEO Dashboard
│   │   ├── customers/        # Customer management
│   │   ├── bookings/         # Booking management
│   │   ├── api/              # All API routes
│   │   └── ...               # 25+ more pages
│   ├── components/
│   │   ├── layout/           # Sidebar, Topbar
│   │   ├── dashboard/        # CEO Cockpit components
│   │   ├── forms/            # Add/edit forms
│   │   ├── tables/           # Data tables
│   │   └── ui/               # shadcn/ui base components
│   └── lib/
│       ├── laravel/api.ts    # Laravel API client
│       ├── supabase/         # Supabase client (server + client)
│       ├── briefing.ts       # CEO briefing engine
│       ├── kpi.ts            # KPI calculation engine
│       ├── health.ts         # Company health scoring
│       ├── relationship-engine.ts  # Customer insights
│       ├── recommendation-learning.ts # AI feedback loop
│       ├── ceo-reasoning.ts  # CEO AI reasoning engine
│       ├── executive-focus.ts # Priority engine
│       └── ...               # 40+ AI engine modules
├── supabase/
│   ├── migrations/           # 15 SQL migration files
│   └── schema.sql            # Full DB schema
└── .env.local                # ← YOU MUST CREATE THIS
```

---

## 🆘 Troubleshooting

### Port 3000 already in use
```bash
# Kill whatever is on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### `Module not found` errors
```bash
# Reinstall all dependencies
rm -rf node_modules
npm install
```

### Supabase auth error / redirect loop
- Make sure `.env.local` exists with the exact keys above
- Make sure there are no extra spaces or quotes around values

### Laravel API 401 error
- The shared credentials (`superadmin@innovibe.com` / `12345678`) are correct
- If login fails, the Laravel server may be temporarily down — retry in 1–2 minutes

### Build fails with TypeScript errors
```bash
npm run build 2>&1 | grep "error TS"
```
Most type errors are from optional Supabase query return types — they don't affect runtime.

---

## 📞 Contact

Built by **Thalada Srinivas** for **InnoVibe Mobility**.  
GitHub: [@srinivas191206](https://github.com/srinivas191206)  
Repo: https://github.com/srinivas191206/crm-innovibe
