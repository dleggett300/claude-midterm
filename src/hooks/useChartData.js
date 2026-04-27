import { useMemo } from 'react'

// ── Metric registry ───────────────────────────────────────────────────────────
export const METRIC_CONFIG = {
  income:           { label: 'Income',           color: '#22c55e', isPercentage: false },
  expenses:         { label: 'Expenses',          color: '#f97316', isPercentage: false },
  netProfit:        { label: 'Net Profit',        color: '#3b82f6', isPercentage: false },
  profitMargin:     { label: 'Profit Margin %',   color: '#a855f7', isPercentage: true  },
  cumulativeIncome: { label: 'Cumulative Income', color: '#14b8a6', isPercentage: false },
  cumulativeProfit: { label: 'Cumulative Profit', color: '#6366f1', isPercentage: false },
}

export const ALL_METRICS = Object.entries(METRIC_CONFIG).map(([key, cfg]) => ({ key, ...cfg }))

// ── Internal helpers ──────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0')
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function resolveDateRange(dateRange) {
  const today    = new Date()
  const todayStr = fmt(today)
  const y        = today.getFullYear()
  const m        = today.getMonth()

  if (dateRange && typeof dateRange === 'object') {
    return { from: dateRange.from, to: dateRange.to ?? todayStr }
  }

  switch (dateRange) {
    case '3m':  return { from: fmt(new Date(y, m - 2,  1)), to: todayStr }
    case '6m':  return { from: fmt(new Date(y, m - 5,  1)), to: todayStr }
    case '12m': return { from: fmt(new Date(y, m - 11, 1)), to: todayStr }
    case 'ytd': return { from: `${y}-01-01`,                to: todayStr }
    default:    return { from: null,                        to: todayStr } // 'all' — resolved below
  }
}

function getPeriodKey(dateStr, groupBy) {
  const [year, month] = dateStr.split('-').map(Number)
  if (groupBy === 'quarter') return `${year}-Q${Math.ceil(month / 3)}`
  if (groupBy === 'year')    return `${year}`
  return `${year}-${pad(month)}`
}

function generatePeriods(from, to, groupBy) {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  const periods  = []

  if (groupBy === 'year') {
    for (let y = fy; y <= ty; y++) periods.push({ key: `${y}`, label: `${y}` })
    return periods
  }

  if (groupBy === 'quarter') {
    let y = fy, q = Math.ceil(fm / 3)
    const endQ = Math.ceil(tm / 3)
    while (y < ty || (y === ty && q <= endQ)) {
      periods.push({ key: `${y}-Q${q}`, label: `Q${q} ${y}` })
      if (++q > 4) { q = 1; y++ }
    }
    return periods
  }

  // month (default)
  let y = fy, mo = fm
  while (y < ty || (y === ty && mo <= tm)) {
    const key   = `${y}-${pad(mo)}`
    const label = new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    periods.push({ key, label })
    if (++mo > 12) { mo = 1; y++ }
  }
  return periods
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChartData(income = [], expenses = [], config = {}) {
  const { metrics = [], groupBy = 'month', dateRange = 'all' } = config

  // Serialize non-primitive deps so useMemo only re-runs on value changes.
  // metricKey/rangeKey capture the logical content of metrics[] and dateRange —
  // the memo closes over the originals for convenience; they're always in sync
  // with their serialized counterparts at the time the memo runs.
  const metricKey = metrics.join(',')
  const rangeKey  = typeof dateRange === 'object'
    ? `${dateRange.from}__${dateRange.to}`
    : dateRange

  return useMemo(() => {
    if (!metrics.length) return { data: [], activeMetrics: [] }

    let { from, to } = resolveDateRange(dateRange)

    // Fix #2 / Opt A: For 'all', clamp 'from' to the earliest actual data date
    // instead of a hardcoded epoch — prevents generating hundreds of empty periods.
    if (!from) {
      let earliest = to // fallback to today if there's no data
      for (const e of income)   { if (e.date && e.date < earliest) earliest = e.date }
      for (const e of expenses) { if (e.date && e.date < earliest) earliest = e.date }
      from = earliest
    }

    const incRows = income.filter(e => e.date >= from && e.date <= to)
    const expRows = expenses.filter(e => e.date >= from && e.date <= to)

    // Fix #1: (Number(x) || 0) guards against null/undefined producing NaN
    const incMap = {}, expMap = {}
    for (const e of incRows) {
      const k = getPeriodKey(e.date, groupBy)
      incMap[k] = (incMap[k] || 0) + (Number(e.total_amount) || 0)
    }
    for (const e of expRows) {
      const k = getPeriodKey(e.date, groupBy)
      expMap[k] = (expMap[k] || 0) + (Number(e.amount) || 0)
    }

    // Opt B: Set gives O(1) lookups instead of O(n) Array.includes() per period
    const metricSet = new Set(metrics)
    const periods   = generatePeriods(from, to, groupBy)

    // Opt D: accumulate cumulatives at full float precision; round only at output
    let cumInc = 0, cumProfit = 0

    const data = periods.map(({ key, label }) => {
      const inc    = +(incMap[key] || 0).toFixed(2)
      const exp    = +(expMap[key] || 0).toFixed(2)
      const net    = +(inc - exp).toFixed(2)
      const margin = inc > 0 ? +((net / inc) * 100).toFixed(1) : 0
      cumInc    += inc
      cumProfit += net

      const point = { label }
      if (metricSet.has('income'))           point.income           = inc
      if (metricSet.has('expenses'))         point.expenses         = exp
      if (metricSet.has('netProfit'))        point.netProfit        = net
      if (metricSet.has('profitMargin'))     point.profitMargin     = margin
      if (metricSet.has('cumulativeIncome')) point.cumulativeIncome = +cumInc.toFixed(2)
      if (metricSet.has('cumulativeProfit')) point.cumulativeProfit = +cumProfit.toFixed(2)

      return point
    })

    const activeMetrics = metrics
      .filter(k => METRIC_CONFIG[k])
      .map(k => ({ key: k, ...METRIC_CONFIG[k] }))

    return { data, activeMetrics }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, expenses, metricKey, groupBy, rangeKey])
}
