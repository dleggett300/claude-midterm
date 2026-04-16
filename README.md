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

What I learned:

I learned a lot about how claude code desktop likes to work as well as dialed in my iterative coding process. Claude will get ahead of itself if you let it, even when you ask it to break itself down in to steps so you have to actively be keeping it on course. I also learned that claude has a lot of limitations when testing with a cloud database and how important it is to still manually test features and work with claude to fix the things it missed. I also learned how to set up a supabase cloud database (claude cannot set this up on its own). 