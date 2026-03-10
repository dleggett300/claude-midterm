import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages (stubs — to be built out in later steps)
import Landing   from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Income    from './pages/Income.jsx'
import Expenses  from './pages/Expenses.jsx'
import Receipts  from './pages/Receipts.jsx'
import Tasks     from './pages/Tasks.jsx'

// Layout wraps all dashboard routes with sidebar
import Layout from './components/Layout.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />

        {/* Dashboard shell with sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/income"    element={<Income />} />
          <Route path="/expenses"  element={<Expenses />} />
          <Route path="/receipts"  element={<Receipts />} />
          <Route path="/tasks"     element={<Tasks />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
