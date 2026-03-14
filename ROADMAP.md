# Small Business Dashboard — Build Roadmap

## ✅ Step 1 — Project Scaffold & Landing Page

**Goal:** Working Vite + React app with a polished, fully responsive landing page.

### 1.1 Project Setup
- Scaffold Vite + React (`npm create vite@latest . -- --template react`)
- Install dependencies:
  - `react-router-dom` — client-side routing
  - `tailwindcss`, `postcss`, `autoprefixer` — styling
- Configure Tailwind (`tailwind.config.js`, `postcss.config.js`)
- Initialize git repo (`git init`, `.gitignore`)

### 1.2 Landing Page (`/`)
A public-facing marketing/hero page for the dashboard product.

- **Hero section** — headline, subheadline, CTA button ("Go to Dashboard")
- **Features section** — 4 cards highlighting: Income, Expenses, Receipts, Tasks
- **Responsive layout** — mobile-first, collapses gracefully on small screens
- **Reactive styling** — hover states, smooth transitions, active link highlights in nav

---

## ✅ Step 2 — Boilerplate Pages (All Features)

**Goal:** All feature pages exist and are reachable via sidebar navigation.

### 2.1 Global Shell
- `AppContext.jsx` — global state with localStorage persistence
- `Layout.jsx` — sidebar + main content area
- `Sidebar.jsx` — nav links with active-state highlighting
- Route each page in `App.jsx`

### 2.2 Page Stubs (barebones, no logic yet)
Each page renders a heading and a placeholder message.

| Route | Page | Placeholder |
|-------|------|-------------|
| `/dashboard` | Dashboard | "Overview coming soon" |
| `/income` | Income | "Income entries coming soon" |
| `/expenses` | Expenses | "Expense entries coming soon" |
| `/receipts` | Receipts | "Receipt storage coming soon" |
| `/tasks` | Tasks | "Task tracker coming soon" |

---

## ✅ Step 3 — Commit & Deploy to Netlify

**Goal:** App is live at a public URL.

### 3.1 Git Commit
- Stage all files (`git add .`)
- Commit: `"Initial scaffold: landing page + boilerplate feature pages"`

### 3.2 Netlify Deployment
- Create `netlify.toml` at project root:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- Push to GitHub remote
- Connect repo to Netlify (new site → import from GitHub)
- Verify live URL loads landing page and all routes work

---

## ✅ Bonus — Supabase Integration
- Replaced localStorage with Supabase (PostgreSQL + Auth + Storage)
- Email/password login + signup (`Login.jsx`)
- `ProtectedRoute.jsx` — redirects unauthenticated users to `/login`
- `AppContext.jsx` updated — session management, `signOut`
- RLS policies for per-user data isolation
- Sidebar Sign Out button

---

## Feature Phases (next up)

| Phase | Feature | Status |
|-------|---------|--------|
| 4 | Income CRUD | ✅ Complete |
| 5 | Expenses CRUD + Receipt attachments | ✅ Complete |
| 6 | Tasks (sub-tasks, priority, personal/paid, Catalog of Success) | ✅ Complete |
| 7 | Charts (income vs expenses bar, expense category pie) | ✅ Complete |
| 8 | Dashboard (summary cards, charts, active tasks widget) | ⬜ Next |
| 9 | Search & Filters (date range, category, task search) | ⬜ |
| 10 | Polish (empty states, confirm dialogs, toasts, CSV export) | ⬜ |

---

## Locked Specs

### Phase 4 — Income
**Form:** Date (default today) · Recurring checkboxes (name + price each) · Custom item (description + price) · Notes · Auto-calculated total
**Table:** Date · Items Billed (all items + prices) · Total Amount · Comments · Actions (Edit/Delete)
**Recurring items:** User can add/remove custom recurring items saved to Supabase
**Validation:** At least one item required · No negative prices
**Sub-steps:** 4.1 income_items table · 4.2 income table schema · 4.3 useIncome hook · 4.4 useIncomeItems hook · 4.5 Checkbox list UI · 4.6 Add/remove recurring items · 4.7 Custom item input · 4.8 Auto-calculated total · 4.9 Notes + date picker · 4.10 Validation · 4.11 History table · 4.12 Edit row · 4.13 Delete row

---

### Phase 5 — Expenses + Receipts ✅
**Form:** Date (default today) · Description · Amount ≥ 0 · 50% deductible checkbox (with ? tooltip explaining when it applies) · Notes · Optional receipt upload (images/PDF, 10MB max, new entries only)
**Table:** Date · Description (+ orange 50% badge if partial deductible) · Amount · Notes · Receipt (📎 opens signed URL in new tab) · Actions (Edit / Upload Receipt or Remove Receipt / Delete)
**Tax deductibility:** Decoupled from category — standalone `tax_deductible_pct` column (100 default, 50 when checked). No category field.
**Receipt storage:** Supabase Storage bucket `receipts` (private, signed URLs) · path `{user_id}/{expense_id}.{ext}` · deleting expense also deletes receipt file · extension-change orphan prevention built in
**Sidebar:** Receipts nav link removed
**Schema:** `expenses` table — `id, user_id, date, description, amount, tax_deductible_pct, notes, receipt_path, created_at`
**Bug fixes applied:** storage remove errors now surfaced · orphaned file cleanup on failed DB update · extension-change receipt replacement handled
**Sub-steps:** 5.1 expenses table · 5.2 Storage bucket · 5.3 useExpenses hook · 5.4 Expense form · 5.5 50% deductible checkbox + tooltip · 5.6 Validation + file type/size check · 5.7 Upload to Storage on submit · 5.8 History table · 5.9 Upload receipt to existing row · 5.10 Remove receipt · 5.11 Edit row · 5.12 Delete row (+ file cleanup)

---

### Phase 6 — Tasks
**Layout:** Add Task button → Active task list → Catalog of Success (collapsed)
**Task fields:** Title · Type (Personal/Paid badge) · Priority (High flag) · Due date (optional) · Checkbox · Sub-tasks (1 level deep, title + checkbox only)
**Sort:** High priority first → soonest due date → alphabetical (no due date)
**Completion rules:** Checking parent auto-checks all sub-tasks · Checking all sub-tasks does NOT auto-check parent
**Catalog of Success:** Collapsed by default · all completed parent tasks + sub-tasks · sorted by most recently completed
**Sub-steps:** 6.1 tasks table (parent_id for sub-tasks) · 6.2 useTasks hook · 6.3 Active task list + sort logic · 6.4 Task row (badge, flag, due date, checkbox, edit, delete) · 6.5 Sub-task rows (indented) · 6.6 Add sub-task inline · 6.7 Add Task form · 6.8 Edit task · 6.9 Parent checkbox → auto-completes sub-tasks · 6.10 Catalog of Success section

---

### Phase 7 — Charts
**Library:** recharts
**Components (all accept data as props):**
- `MonthlyChart.jsx` — grouped bar, YTD income vs expenses by month (Jan–Dec)
- `QuarterlyChart.jsx` — grouped bar, YTD profit vs expenses by quarter (Q1–Q4)
- `CategoryChart.jsx` — donut, expenses by category (skipped for now, add later)
**Data helpers:** aggregate income/expenses by month · aggregate by quarter · aggregate expenses by category
**Sub-steps:** 7.1 Install recharts · 7.2 Monthly aggregation helper · 7.3 Quarterly aggregation helper · 7.4 MonthlyChart.jsx · 7.5 QuarterlyChart.jsx

---

### Phase 8 — Dashboard
**Summary cards (all-time):** Total Income · Total Expenses · Net Profit (green if +, red if −) · Open Tasks count
**Charts:** MonthlyChart (YTD income vs expenses) + QuarterlyChart (YTD profit vs expenses)
**Recent tables:** Last 5 income entries · Last 5 expense entries (with links to full pages)
**Tasks widget:** 3–5 active incomplete tasks, completable inline via checkbox
**Sub-steps:** 8.1 Fetch all-time income/expenses/tasks totals · 8.2 Summary cards row · 8.3 Embed MonthlyChart · 8.4 Embed QuarterlyChart · 8.5 Recent Income table · 8.6 Recent Expenses table · 8.7 Active tasks widget

---

### Phase 9 — Search & Filters
**Placement:** Filter bar embedded at top of Income and Expenses pages (always visible on those pages, no separate route)
**Income filters:** Text search (description/items) · Date range · no additional
**Expense filters:** Text search (description) · Date range · 50% deductible toggle
**Tasks:** Text search bar at top of Tasks page
**All filters:** Client-side (instant, no extra DB calls)
**Sub-steps:** 9.1 Filter bar component for Income · 9.2 Filter bar component for Expenses · 9.3 Text search on Tasks

---

### Phase 10 — Polish
- Empty states on all tables/lists (helpful message + icon when no data)
- Reusable ConfirmDialog before every delete
- Toast notifications (success/error) on every action
- Export Income table to CSV
- Export Expenses table to CSV
- Loading skeletons on data tables
- Final mobile responsive pass
- Additional polish TBD as ideas come up during build
