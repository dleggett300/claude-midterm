# Small Business Dashboard — Build Roadmap

## Step 1 — Project Scaffold & Landing Page

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

## Step 2 — Boilerplate Pages (All Features)

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

## Step 3 — Commit & Deploy to Netlify

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

## Future Phases (post-deploy)

| Phase | Feature |
|-------|---------|
| 4 | Dashboard summary cards + recent activity |
| 5 | Income CRUD (add, delete, edit) |
| 6 | Expenses CRUD |
| 7 | Receipts upload + preview |
| 8 | Task tracker (add, complete, filter) |
| 9 | Charts (income vs expenses, category breakdown) |
| 10 | Export to CSV, search, date filters |
