/**
 * Chart aggregation helpers (Phase 7)
 *
 * Both functions are YTD — they only return months/quarters that have
 * already started in the current calendar year.
 * Income entries shape:  { date: 'YYYY-MM-DD', total_amount: Number, ... }
 * Expense entries shape: { date: 'YYYY-MM-DD', amount: Number, ... }
 */

// ── 7.2 Monthly aggregation ──────────────────────────────────────────────────
// Returns entries for Jan through the current month only (YTD).
// Shape: [{ month: 'Jan', income: Number, expenses: Number }, ...]
export function aggregateByMonth(incomeEntries, expenseEntries) {
  // Computed inside the function so a long-lived tab stays accurate
  const now          = new Date()
  const CURRENT_YEAR  = now.getFullYear()
  const CURRENT_MONTH = now.getMonth() // 0-based (Jan=0)

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return labels.slice(0, CURRENT_MONTH + 1).map((month, i) => {
    const income = incomeEntries
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00')
        return d.getFullYear() === CURRENT_YEAR && d.getMonth() === i
      })
      .reduce((sum, e) => sum + Number(e.total_amount), 0)

    const expenses = expenseEntries
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00')
        return d.getFullYear() === CURRENT_YEAR && d.getMonth() === i
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    return { month, income, expenses }
  })
}

// ── 7.3 Quarterly aggregation ────────────────────────────────────────────────
// Returns entries for Q1 through the current quarter only (YTD).
// Shape: [{ quarter: 'Q1', income: Number, expenses: Number }, ...]
export function aggregateByQuarter(incomeEntries, expenseEntries) {
  const now          = new Date()
  const CURRENT_YEAR  = now.getFullYear()
  const CURRENT_MONTH = now.getMonth() // 0-based (Jan=0)

  const labels        = ['Q1', 'Q2', 'Q3', 'Q4']
  const currentQuarter = Math.floor(CURRENT_MONTH / 3) // 0-based

  return labels.slice(0, currentQuarter + 1).map((quarter, i) => {
    const startMonth = i * 3      // Q1→0, Q2→3, Q3→6, Q4→9
    const endMonth   = startMonth + 2 // Q1→2, Q2→5, Q3→8, Q4→11

    const income = incomeEntries
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00')
        const m = d.getMonth()
        return d.getFullYear() === CURRENT_YEAR && m >= startMonth && m <= endMonth
      })
      .reduce((sum, e) => sum + Number(e.total_amount), 0)

    const expenses = expenseEntries
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00')
        const m = d.getMonth()
        return d.getFullYear() === CURRENT_YEAR && m >= startMonth && m <= endMonth
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    return { quarter, income, expenses }
  })
}
