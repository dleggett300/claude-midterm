# DML BizCompanion — Project Debrief

## What This Is
A multi-feature freelancer business companion app built as a midterm project. It combines tools and implementation practices learned throughout the semester. The goal is a personal, practical dashboard that helps manage the real-world demands of freelancing.

## Who It's For
David — a freelancer who needs a single place to track money coming in, money going out, store proof of purchases, and stay on top of day-to-day tasks.

---

## Feature Goals

### 1. Income Tracking
- Log income entries with date, description, category, and amount
- Categories: Sales, Services, Consulting, Other
- Add, edit, and delete entries
- Amounts displayed as formatted currency

### 2. Expense Management
- Log expense entries with date, description, category, and amount
- Categories: Rent, Utilities, Payroll, Software, Travel, Supplies, Other
- Add, edit, and delete entries

### 3. Receipt Storage
- Upload image and PDF files as receipts
- Files stored as base64 in localStorage (no backend required)
- Thumbnail grid view with filename and upload date
- Full-size preview on click, delete button per receipt

### 4. Task Tracker
- Add, complete, and delete tasks
- Filter by: All / Active / Completed
- Open task count surfaced on the dashboard

### 5. Dashboard (Overview)
- **Summary cards:** Total Income, Total Expenses, Net Profit, Open Tasks
- **Monthly Income graph** — bar or line chart showing income by month
- **Monthly Expenses graph** — bar or line chart showing expenses by month
- **Profit display** — net profit trend over time
- **Priority Tasks widget** — a small section showing the most important incomplete tasks at a glance
- Charts powered by `recharts` (to be installed in a later phase)

---

## Tech Stack
| Tool | Purpose |
|------|---------|
| Vite | Build tooling |
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Recharts | Dashboard charts (Phase 9) |
| localStorage | Client-side data persistence |

---

## Current Progress

### Done
- [x] Project scaffolded (Vite + React + Tailwind)
- [x] Git initialized, initial commit made
- [x] Landing page — hero, features section, CTA footer, responsive layout
- [x] App shell — Layout, Sidebar with active-state nav
- [x] React Router wired up with all 5 routes
- [x] Stub pages for Dashboard, Income, Expenses, Receipts, Tasks
- [x] `ROADMAP.md` created for iterative build reference

### Up Next (per ROADMAP.md)
- [ ] Step 2 — AppContext (global state + localStorage persistence)
- [ ] Step 3 — Netlify deploy (netlify.toml, push to GitHub, connect repo)
- [ ] Phase 3–6 — Feature implementation for each page
- [ ] Phase 9 — Charts on Dashboard

---

## Design
- **Color scheme:** Predominantly white backgrounds with orange accents (`brand` palette = Tailwind orange scale)
  - Primary orange: `#ea580c` (brand-600) — used for CTAs, active nav, links
  - Dark orange: `#7c2d12` (brand-900) — sidebar background
  - Light orange: `#fff7ed` (brand-50) — subtle tints and hover states
- **Readability first** — white/light surfaces for content areas, orange reserved for interactive and accent elements only
- **Typography:** Dark gray (`gray-900`) on white for all body text

## Notes
- No backend — all data lives in `localStorage` via React Context
- The app is personal/single-user; no auth needed
- Refer to `ROADMAP.md` for the full phase-by-phase build plan
