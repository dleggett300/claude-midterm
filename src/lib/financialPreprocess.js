export function preprocessFinancials(income, expenses, tasks) {
  const today = new Date()
  const pad = n => String(n).padStart(2, '0')

  const thisYear  = today.getFullYear()
  const thisMonth = today.getMonth()
  const thisKey   = `${thisYear}-${pad(thisMonth + 1)}`
  const lastDate  = new Date(thisYear, thisMonth - 1, 1)
  const lastKey   = `${lastDate.getFullYear()}-${pad(lastDate.getMonth() + 1)}`

  // Single pass over income: all-time total + MoM buckets
  let totalIncome = 0, thisIncome = 0, lastIncome = 0
  for (const e of income) {
    const amt = Number(e.total_amount)
    totalIncome += amt
    if (e.date?.startsWith(thisKey))      thisIncome += amt
    else if (e.date?.startsWith(lastKey)) lastIncome += amt
  }

  // Single pass over expenses: all-time total + deductible split + MoM buckets
  let totalExpenses = 0, halfDeductible = 0, thisExpenses = 0, lastExpenses = 0
  for (const e of expenses) {
    const amt = Number(e.amount)
    totalExpenses += amt
    if (e.tax_deductible_pct === 50) halfDeductible += amt
    if (e.date?.startsWith(thisKey))      thisExpenses += amt
    else if (e.date?.startsWith(lastKey)) lastExpenses += amt
  }

  const netProfit      = totalIncome - totalExpenses
  const profitMargin   = totalIncome > 0 ? +((netProfit / totalIncome) * 100).toFixed(1) : 0
  const incomeSpentPct = totalIncome > 0 ? +((totalExpenses / totalIncome) * 100).toFixed(1) : 0

  const momChangePct = (current, previous) =>
    previous > 0 ? +(((current - previous) / previous) * 100).toFixed(1) : null

  // Use local date components — toISOString() is UTC and can be off by a day
  const todayStr  = `${thisYear}-${pad(thisMonth + 1)}-${pad(today.getDate())}`
  const openTasks = tasks.filter(t => !t.parent_id && !t.completed)

  // Format ISO date string as "Month Day" (e.g. "March 15")
  const fmtDate = iso => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  const overdueTasks  = openTasks
    .filter(t => t.due_date && t.due_date < todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3)
    .map(t => `${t.title} (was due ${fmtDate(t.due_date)})`)

  const upcomingTasks = openTasks
    .filter(t => t.due_date && t.due_date >= todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3)
    .map(t => `${t.title} (due ${fmtDate(t.due_date)})`)

  return {
    generated_at: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    all_time: {
      total_income:             +totalIncome.toFixed(2),
      total_expenses:           +totalExpenses.toFixed(2),
      net_profit:               +netProfit.toFixed(2),
      profit_margin_pct:        profitMargin,
      income_spent_pct:         incomeSpentPct,
      half_deductible_expenses: +halfDeductible.toFixed(2),
    },
    month_over_month: {
      this_month: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      income:   { current: +thisIncome.toFixed(2),   previous: +lastIncome.toFixed(2),   change_pct: momChangePct(thisIncome, lastIncome) },
      expenses: { current: +thisExpenses.toFixed(2), previous: +lastExpenses.toFixed(2), change_pct: momChangePct(thisExpenses, lastExpenses) },
    },
    tasks: {
      open:     openTasks.length,
      overdue:  overdueTasks,
      upcoming: upcomingTasks,
    },
  }
}
