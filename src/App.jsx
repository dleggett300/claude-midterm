import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

// Pages
import Landing   from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Income    from './pages/Income.jsx'
import Expenses  from './pages/Expenses.jsx'
import Receipts  from './pages/Receipts.jsx'
import Tasks     from './pages/Tasks.jsx'

// Layout wraps all dashboard routes with sidebar
import Layout from './components/Layout.jsx'

const router = createBrowserRouter(
  [
    { path: '/', element: <Landing /> },
    {
      element: <Layout />,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/income',    element: <Income /> },
        { path: '/expenses',  element: <Expenses /> },
        { path: '/receipts',  element: <Receipts /> },
        { path: '/tasks',     element: <Tasks /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  {
    future: {
      v7_startTransition:   true,
      v7_relativeSplatPath: true,
    },
  }
)

export default function App() {
  return <RouterProvider router={router} />
}
