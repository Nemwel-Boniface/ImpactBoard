# BragBoard — Eden Care

> Your performance review accomplishment tracker. Built with Next.js 14 + Vercel KV.

---

## 🚀 Quick Start (Local Dev)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Vercel KV (free)

1. Go to [vercel.com](https://vercel.com) → create an account / log in
2. Create a new project (you can link your GitHub repo)
3. In your project dashboard → **Storage** tab → **Create Database** → pick **KV**
4. Name it `bragboard-kv` → click Create
5. Go to the KV database → **Settings** → copy:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 3. Configure environment variables
```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
KV_REST_API_URL=your_url_here
KV_REST_API_TOKEN=your_token_here
NEXT_PUBLIC_USER_NAME=Your Name
NEXT_PUBLIC_USER_ROLE=Backend Engineer
NEXT_PUBLIC_REVIEW_DATE=2025-06-15
```

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy to Vercel

### Option A — CLI (fastest)
```bash
npm i -g vercel
vercel
# Follow prompts — it auto-detects Next.js
```

Then link your KV database:
```bash
vercel link
vercel env pull  # pulls KV env vars automatically if KV is linked in dashboard
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. In project settings → **Storage** → link your KV database
4. Add your env vars under **Settings → Environment Variables**
5. Deploy — Vercel auto-deploys on every push to `main`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── accomplishments/       GET list, POST create
│   │   │   └── [id]/              GET, PUT, DELETE, PATCH (toggle featured)
│   │   ├── dashboard/             GET stats + review prep
│   │   ├── import/                POST upload, GET template CSV
│   │   └── export/                GET json or csv
│   ├── accomplishments/           Accomplishments list page
│   ├── review-prep/               Review meeting prep page
│   ├── import/                    Excel/CSV import page
│   ├── layout.tsx                 Root layout + sidebar
│   └── page.tsx                   Dashboard home
├── components/
│   ├── layout/Sidebar.tsx
│   ├── ui/index.tsx               Card, Button, Badge, StatCard
│   ├── AccomplishmentCard.tsx
│   └── AccomplishmentModal.tsx
├── lib/
│   ├── kv.ts                      All Vercel KV operations
│   ├── categories.ts              Category config + impact score formula
│   └── import.ts                  Excel/CSV parser
├── hooks/
│   └── useToast.tsx
└── types/
    └── index.ts
```

---

## 🗝 Key Design Decisions

### Why Vercel KV?
- **Zero config**: auto-provisioned, env vars auto-injected when linked in Vercel dashboard
- **Free tier**: 30MB storage, 30k requests/day — more than enough for a personal tracker
- **No DB admin**: no migrations, no schema, no Postgres instance to manage
- **Fast**: Redis-backed, sub-5ms reads

### Data Model
All accomplishments stored as individual JSON objects in Redis:
- `accomplishments:list` → ordered list of IDs (LPUSH keeps newest first)
- `accomplishments:item:{uuid}` → full Accomplishment object
- `meta:stats` → cached dashboard stats (60s TTL, auto-busted on writes)

### Impact Score Formula
```
Score = Σ(impactWeight × categoryWeight) / maxPossible × 100

impactWeight:  high=3, medium=2, low=1
categoryWeight: core=2.0, leadership=1.8, integration=1.5, side=1.2, infra=1.0
```

---

## 📊 Excel Import Format

| Column | Required | Accepted Values |
|--------|----------|-----------------|
| title | Yes | Any text |
| category | No | core, integration, side, leadership, infra |
| description | No | Free text |
| impact | No | high, medium, low |
| metric_1 | No | e.g. "40% faster" |
| metric_2 | No | e.g. "8 hrs/wk" |
| metric_3 | No | e.g. "3 stakeholders" |
| date | No | YYYY-MM-DD |

Download the template from `/import` → "Download Template CSV"

---

## 🎨 Brand Colors

| Name | Hex |
|------|-----|
| Eden Green | `#1A6B3C` |
| Eden Green Light | `#2D9B5A` |
| Eden Orange | `#F47B20` |
| Eden Orange Light | `#FF9A45` |
| Eden Dark | `#0D1F14` |

---

## 📝 Customise

- **Your name / role / review date**: edit `.env.local` → `NEXT_PUBLIC_*` vars
- **Add a category**: edit `src/lib/categories.ts` → `CATEGORIES` array
- **Adjust impact weights**: same file → `calcImpactScore` function
- **Meetings led / total**: in `src/lib/kv.ts` → `getDashboardStats` (hardcoded for now, easy to make a KV key)
