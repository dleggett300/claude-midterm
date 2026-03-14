import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIncome } from '../hooks/useIncome'
import { useExpenses } from '../hooks/useExpenses'
import { useTasks } from '../hooks/useTasks'
import { aggregateByMonth, aggregateByQuarter } from '../lib/chartHelpers'
import MonthlyChart from '../components/MonthlyChart'
import QuarterlyChart from '../components/QuarterlyChart'
import { useToast } from '../context/ToastContext'

const YEAR = new Date().getFullYear()

// Full precision for tables
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Compact format for summary cards
function formatCardCurrency(amount) {
  const abs = Math.abs(amount)
  if (abs < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

// Mirrors the sort in Tasks.jsx: high priority first → soonest due date → alphabetical
function sortParentTasks(list) {
  return [...list].sort((a, b) => {
    if (a.priority !== b.priority) return (b.priority ? 1 : 0) - (a.priority ? 1 : 0)
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return a.title.localeCompare(b.title)
  })
}

// Maps days-until-due to Tailwind colour pair — mirrors Tasks.jsx
function dueDateClasses(diff) {
  if (diff <= 2)  return 'bg-red-100 text-red-600'
  if (diff <= 10) return 'bg-orange-100 text-orange-600'
  if (diff <= 20) return 'bg-amber-100 text-amber-600'
  if (diff <= 35) return 'bg-yellow-100 text-yellow-600'
  if (diff <= 50) return 'bg-lime-100 text-lime-600'
  return 'bg-green-100 text-green-600'
}

function DueDateBadge({ dateStr }) {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

  const label =
    diff < 0  ? 'Overdue' :
    diff === 0 ? 'Today' :
    diff === 1 ? 'Tomorrow' :
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${dueDateClasses(diff)}`}>
      {label}
    </span>
  )
}

// Compact label for an income entry's items
function buildItemsLabel(entry) {
  const all = [...(entry.items || [])]
  if (entry.custom_item) all.push({ name: entry.custom_item.description })
  if (all.length === 0) return '—'
  const first = all[0].name || all[0].description || 'Item'
  if (all.length === 1) return first
  return `${first} +${all.length - 1} more`
}

function SummaryCard({ label, value, subValue, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border-2 border-black/30 p-5 min-w-0">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 truncate">{label}</p>
      <p className={`text-2xl font-bold truncate ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1 truncate">{subValue}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { income,   loading: incomeLoading   } = useIncome()
  const { expenses, loading: expensesLoading } = useExpenses()
  const { tasks,    loading: tasksLoading, toggleTask } = useTasks()
  const toast = useToast()

  const loading = incomeLoading || expensesLoading || tasksLoading

  // 8.7 — local toggle error
  const [taskError, setTaskError] = useState('')

  // ── 8.1 All-time totals ───────────────────────────────────────────────────
  const totalIncome   = useMemo(() => income.reduce((s, e) => s + Number(e.total_amount), 0), [income])
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses])
  const netProfit     = totalIncome - totalExpenses

  // ── 8.3 / 8.4 Chart data (YTD) ───────────────────────────────────────────
  const monthlyData   = useMemo(() => aggregateByMonth(income, expenses),   [income, expenses])
  const quarterlyData = useMemo(() => aggregateByQuarter(income, expenses), [income, expenses])

  // ── 8.5 Recent income / 8.6 Recent expenses (last 5 each) ────────────────
  // Plain consts — slicing an already-memoised array is trivial; no useMemo needed
  const recentIncome   = income.slice(0, 5)
  const recentExpenses = expenses.slice(0, 5)

  // ── 8.7 Active parent tasks (up to 5) ────────────────────────────────────
  // Filter once; derive both the count and the display slice from the same memo
  const openTasksList = useMemo(
    () => sortParentTasks(tasks.filter(t => !t.parent_id && !t.completed)),
    [tasks],
  )
  const openTasks   = openTasksList.length
  const activeTasks = openTasksList.slice(0, 5)

  async function handleToggleTask(id, current) {
    setTaskError('')
    try {
      await toggleTask(id, !current)
      if (!current) toast('Task completed! 🎉')
    } catch (err) {
      setTaskError(err.message || 'Could not update task.')
      toast(err.message || 'Could not update task.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="text-sm text-gray-400 py-12 text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* ── 8.2 Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Income"
          value={formatCardCurrency(totalIncome)}
          subValue={formatCurrency(totalIncome)}
          valueColor="text-green-600"
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCardCurrency(totalExpenses)}
          subValue={formatCurrency(totalExpenses)}
          valueColor="text-red-500"
        />
        <SummaryCard
          label="Net Profit"
          value={formatCardCurrency(netProfit)}
          subValue={formatCurrency(netProfit)}
          valueColor={netProfit >= 0 ? 'text-green-600' : 'text-red-500'}
        />
        <SummaryCard
          label="Open Tasks"
          value={String(openTasks)}
          valueColor="text-brand-500"
        />
      </div>

      {/* ── 8.3 Monthly chart ── */}
      <div className="bg-white rounded-xl border-2 border-black/30 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Monthly Overview</h2>
        <p className="text-xs text-gray-400 mb-4">Income vs Expenses · {YEAR}</p>
        <MonthlyChart data={monthlyData} />
      </div>

      {/* ── 8.4 Quarterly chart ── */}
      <div className="bg-white rounded-xl border-2 border-black/30 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Quarterly Summary</h2>
        <p className="text-xs text-gray-400 mb-4">Income vs Expenses · {YEAR}</p>
        <QuarterlyChart data={quarterlyData} />
      </div>

      {/* ── 8.5 / 8.6 Recent Income + Expenses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 8.5 — Recent Income */}
        <div className="bg-white rounded-xl border-2 border-black/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Income</h2>
            <Link to="/income" className="text-xs text-brand-500 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>

          {recentIncome.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
              <svg className="w-8 h-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
              <p className="text-sm text-gray-400">No income entries yet.</p>
              <Link to="/income" className="text-xs text-brand-500 hover:text-brand-700 font-medium">Add your first →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {recentIncome.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs w-16">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-2 py-3 text-gray-700 truncate max-w-[8rem]">
                      {buildItemsLabel(entry)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-600 whitespace-nowrap">
                      {formatCardCurrency(entry.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 8.6 — Recent Expenses */}
        <div className="bg-white rounded-xl border-2 border-black/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Expenses</h2>
            <Link to="/expenses" className="text-xs text-brand-500 hover:text-brand-700 font-medium">
              View all →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
              <svg className="w-8 h-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <p className="text-sm text-gray-400">No expenses yet.</p>
              <Link to="/expenses" className="text-xs text-brand-500 hover:text-brand-700 font-medium">Add your first →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {recentExpenses.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs w-16">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-2 py-3 text-gray-700 truncate max-w-[8rem]">
                      {entry.description}
                      {entry.tax_deductible_pct === 50 && (
                        <span className="ml-1.5 inline-flex items-center px-1 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                          50%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-red-500 whitespace-nowrap">
                      {formatCardCurrency(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── 8.7 Active Tasks widget ── */}
      <div className="bg-white rounded-xl border-2 border-black/30 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Active Tasks</h2>
          <Link to="/tasks" className="text-xs text-brand-500 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>

        {taskError && (
          <p className="px-5 pt-3 text-sm text-red-500">{taskError}</p>
        )}

        {activeTasks.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
            <svg className="w-8 h-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">All clear!</p>
            <p className="text-xs text-gray-400">No open tasks — nice work!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {activeTasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleToggleTask(task.id, task.completed)}
                  className="w-4 h-4 accent-brand-500 shrink-0 cursor-pointer"
                  title="Mark complete"
                />

                <span className="flex-1 text-sm text-gray-800 truncate">{task.title}</span>

                {task.type === 'paid' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 shrink-0">
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500 shrink-0">
                    Personal
                  </span>
                )}

                {task.priority && (
                  <span className="text-red-500 shrink-0 text-sm" title="High priority">⚑</span>
                )}

                <DueDateBadge dateStr={task.due_date} />
              </li>
            ))}
          </ul>
        )}

        {openTasks > 5 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <Link to="/tasks" className="text-xs text-gray-400 hover:text-brand-500">
              +{openTasks - 5} more task{openTasks - 5 !== 1 ? 's' : ''} →
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
