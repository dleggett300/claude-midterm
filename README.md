Description:

My application is a manager / companion app for my freelancing business. I am able to input expenses and incomes and view them as graphs, manage important tasks, export charts, and more.

Features:
- CRUD Income items
- CRUD Expense items
- CRUD Task items
- Search income, expenses, and tasks
- Login / signout to accounts to access user-specific data
- Export as .csv file
- Upload and view receipt files
- Custom chart builder — choose chart type, metrics, date range, and grouping
- 5 chart types: Bar, Stacked Bar, Line, Area, Combo
- Save named chart configurations per user
- AI-generated business health summary (powered by Ollama)

Charts:

The charts page includes a live builder that lets you visualize your financial data however you want. Pick a chart type, select up to 3 metrics, set a date range, and group by month, quarter, or year. The chart updates instantly as you change any setting.

Chart types: Bar, Stacked Bar, Line, Area, Combo (bars + line overlay)
Metrics: Income, Expenses, Net Profit, Profit Margin %, Cumulative Income, Cumulative Profit
Date ranges: 3M, 6M, 12M, YTD, All time
Saved charts: name and save any configuration — stored per user in Supabase and clickable to restore

--

Stack:

Frontend:
- React
- Vite
- React Router
- Tailwind CSS
- Recharts

Backend:
- Supabase
	- Handles auth, database & storage
	- Income Expense & Task tables, receipts bucket

AI:
- Ollama (local) — runs llama3.2 by default to generate the dashboard business summary

AI Summary:

The dashboard includes an AI-generated plain-English summary of your finances and upcoming tasks, powered by Ollama running locally on your machine. It covers income vs expenses, month-over-month trends, and overdue or upcoming tasks.

To use it:
1. Install Ollama: https://ollama.com
2. Pull the model: ollama pull llama3.2
3. Start the server with CORS enabled: OLLAMA_ORIGINS=* ollama serve

No data leaves your machine. A cloud-based version is planned for a future update so all deployed users can access this feature without running Ollama locally.

--

Running Locally:

1. Clone the repo and install dependencies:
   npm install

2. Create a .env file in the project root:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OLLAMA_URL=http://localhost:11434   (optional, this is the default)
   VITE_OLLAMA_MODEL=llama3.2              (optional, this is the default)

3. Start the dev server:
   npm run dev

--

What I learned:

I learned a lot about how claude code desktop likes to work as well as dialed in my iterative coding process. Claude will get ahead of itself if you let it, even when you ask it to break itself down in to steps so you have to actively be keeping it on course. I also learned that claude has a lot of limitations when testing with a cloud database and how important it is to still manually test features and work with claude to fix the things it missed. I also learned how to set up a supabase cloud database (claude cannot set this up on its own). 
