import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext.jsx'

import Landing        from './pages/Landing.jsx'
import Login          from './pages/Login.jsx'
import Dashboard      from './pages/Dashboard.jsx'
import Income         from './pages/Income.jsx'
import Expenses       from './pages/Expenses.jsx'
import Receipts       from './pages/Receipts.jsx'
import Tasks          from './pages/Tasks.jsx'
import Layout         from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const router = createBrowserRouter(
  [
    { path: '/',      element: <Landing /> },
    { path: '/login', element: <Login /> },

    // All dashboard routes require authentication
    {
      element: <ProtectedRoute />,
      children: [
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
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
