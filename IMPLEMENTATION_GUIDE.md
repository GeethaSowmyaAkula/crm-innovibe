# InnoVibe AIOS CRM — Implementation Guide

> **For Srinivas's teammates:** Clone this repo, run 4 commands, get the exact same app.  
> You will connect to the **same Supabase database and Laravel API** — same real data.

---

## ⚡ Quick Start (4 Commands)

```bash
# 1. Clone the repo
git clone https://github.com/srinivas191206/crm-innovibe.git
cd crm-innovibe

# 2. Auto-configure backend credentials (connects to InnoVibe backend)
node setup.js

# 3. Install dependencies
npm install

# 4. Start the app
npm run dev
```

Open **http://localhost:3000** → you're in. ✅

---

## ✅ Prerequisites

| Tool | Version | How to check |
|------|---------|-------------|
| Node.js | v20 or higher | `node --version` |
| npm | v10+ | `npm --version` |
| Git | Any recent | `git --version` |

Download Node.js from → https://nodejs.org (choose LTS)

---

## 🔌 What `node setup.js` Does

It automatically creates a `.env.local` file in your project root that connects you to:

| Backend | URL |
|---------|-----|
| **Supabase** (database) | `lufynzbrcfrcrgrecxfb.supabase.co` |
| **Laravel API** (live production) | `api.innovibemobility.com` |

You will see the **exact same data** as Srinivas — 103 customers, 71 bookings, 6 garages, 4 technicians, live service centers, vehicle brands, bookings, and all AI intelligence modules.

> ⚠️ Do NOT share `.env.local` publicly — it has admin credentials.

---

## 🖥️ Pages You Get

| URL | Page |
|-----|------|
| `/` | CEO Cockpit — AI briefings, KPIs, health score |
| `/ceo` | CEO Dashboard — AI reasoning engine |
| `/customers` | 103 real customers |
| `/bookings` | 71 bookings |
| `/technicians` | 4 technicians with ratings |
| `/garages` | 6 service centres |
| `/vehicles` | 32 vehicles |
| `/transactions` | Live payment transactions |
| `/amc` | AMC contract management |
| `/complaints` | Customer complaints |
| `/feedback` | Customer reviews |
| `/leads` | Sales lead pipeline |
| `/operations` | AI bottleneck intelligence |
| `/sales` | Revenue reports |
| `/fleet` | Fleet management |
| `/strategy` | 10 strategy opportunities |
| `/brands` | EV brands (Ampere, Benling, etc.) |
| `/models` | 113+ vehicle models |
| `/services` | Service catalog |
| `/announcements` | SMS/push campaigns |
| `/hardware/health` | IoT hardware health |
| `/hardware/telemetry` | Device telemetry |
| `/settings` | System settings |

---

## 🛠️ Troubleshooting

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### `.env.local` already exists, want to reset
```bash
rm .env.local
node setup.js
```

### `npm install` fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Page loads but shows no data
- Wait ~5 seconds — some pages call the Laravel API which takes a moment
- Check your internet connection (needs access to `api.innovibemobility.com`)

### TypeScript build errors
```bash
npm run build
```
These don't block the dev server — `npm run dev` always works.

---

## 📁 Key Files

```
crm-innovibe/
├── setup.js                  ← Run this first
├── IMPLEMENTATION_GUIDE.md   ← This file
├── .env.local                ← Auto-created by setup.js
├── src/
│   ├── app/                  ← All 25+ pages
│   ├── components/           ← UI components
│   └── lib/                  ← 40+ AI engine modules
└── supabase/migrations/      ← 15 DB migration files
```

---

## 📞 Contact

**Built by:** Thalada Srinivas  
**GitHub:** https://github.com/srinivas191206/crm-innovibe
