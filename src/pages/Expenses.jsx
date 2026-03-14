import { useState, useRef, useMemo } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { MAX_AMOUNT, MAX_LEN, validateAmount } from '../lib/validation'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import TableSkeleton from '../components/TableSkeleton'

const today = () => new Date().toISOString().split('T')[0]

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Compact format for table columns — $999, $1.5K, $2M, etc.
function formatCompact(amount) {
  const abs = Math.abs(amount)
  if (abs < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Empty state icon — receipt / shopping bag
function EmptyIcon() {
  return (
    <svg className="w-12 h-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

// CSV download icon
function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  )
}

export default function Expenses() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense, uploadReceipt, removeReceipt, getReceiptUrl } = useExpenses()
  const toast = useToast()

  // Form state
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [deductible50, setDeductible50] = useState(false)
  const [showDeductibleTip, setShowDeductibleTip] = useState(false)
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const uploadInputRef = useRef(null)
  const [uploadingId, setUploadingId] = useState(null)

  // Confirm delete dialog
  const [pendingDelete, setPendingDelete] = useState(null) // entry object or null

  // ── 9.3 / 9.4 Filter state ────────────────────────────────────────────────
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')
  const [search,       setSearch]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [showSearch,   setShowSearch]   = useState(false)

  // ── 9.3 / 9.4 Filtered expenses ───────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let list = expenses
    if (filterFrom) list = list.filter(e => e.date >= filterFrom)
    if (filterTo)   list = list.filter(e => e.date <= filterTo)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      )
    }
    return list
  }, [expenses, filterFrom, filterTo, search])

  const isFiltering      = !!(filterFrom || filterTo || search.trim())
  const dateRangeInvalid = !!(filterFrom && filterTo && filterFrom > filterTo)

  function clearFilters() {
    setFilterFrom(''); setFilterTo(''); setSearch(''); setShowSearch(false)
  }

  function resetForm() {
    setDate(today())
    setDescription('')
    setAmount('')
    setDeductible50(false)
    setNotes('')
    setEditingId(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startEdit(entry) {
    setError('')
    setEditingId(entry.id)
    setDate(entry.date)
    setDescription(entry.description)
    setAmount(String(entry.amount))
    setDeductible50(entry.tax_deductible_pct === 50)
    setNotes(entry.notes || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!description.trim()) { setError('Description is required.'); return }
    const amountErr = validateAmount(amount)
    if (amountErr) { setError(amountErr); return }

    const file = fileInputRef.current?.files?.[0] ?? null
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Receipt must be an image or PDF.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Receipt must be 10 MB or smaller.')
        return
      }
    }

    const payload = {
      date,
      description: description.trim(),
      amount: Number(amount),
      tax_deductible_pct: deductible50 ? 50 : 100,
      notes: notes.trim() || null,
    }

    try {
      if (editingId) {
        await updateExpense(editingId, payload)
        toast('Expense updated.')
      } else {
        await addExpense(payload, file)
        toast('Expense added.')
      }
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(entry) {
    try {
      await deleteExpense(entry.id, entry.receipt_path)
      if (editingId === entry.id) resetForm()
      toast('Expense deleted.')
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    }
  }

  function handleUploadReceiptClick(id) {
    setUploadingId(id)
    uploadInputRef.current.value = ''
    uploadInputRef.current.click()
  }

  async function handleUploadReceiptChange(e) {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Receipt must be an image or PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Receipt must be 10 MB or smaller.')
      return
    }
    try {
      await uploadReceipt(uploadingId, file)
      toast('Receipt uploaded.')
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setUploadingId(null)
    }
  }

  async function handleRemoveReceipt(entry) {
    try {
      await removeReceipt(entry.id, entry.receipt_path)
      toast('Receipt removed.')
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    }
  }

  async function handleViewReceipt(path) {
    try {
      const url = await getReceiptUrl(path)
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    }
  }

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Date', 'Description', 'Amount', '50% Deductible', 'Notes', 'Has Receipt']
    const rows = filteredExpenses.map(e => [
      e.date,
      e.description,
      Number(e.amount).toFixed(2),
      e.tax_deductible_pct === 50 ? 'Yes' : 'No',
      e.notes || '',
      e.receipt_path ? 'Yes' : 'No',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('Expenses exported to CSV.')
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hidden file input for per-row receipt uploads */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleUploadReceiptChange}
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Expenses</h1>

      {/* ── ENTRY FORM ── */}
      <div className="bg-white rounded-xl border-2 border-black/30 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {editingId ? 'Edit Expense' : 'New Expense'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full sm:w-48 border-2 border-black/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Adobe Creative Cloud"
              maxLength={MAX_LEN.title}
              className="w-full border-2 border-black/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                max={MAX_AMOUNT}
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border-2 border-black/20 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* 50% deductible checkbox */}
          <div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deductible50}
                  onChange={e => setDeductible50(e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-gray-700">50% deductible</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                  50%
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowDeductibleTip(v => !v)}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 text-xs font-bold leading-none flex items-center justify-center transition-colors"
                aria-label="When does 50% deductible apply?"
              >
                ?
              </button>
            </div>

            {showDeductibleTip && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-sm">
                <p className="font-semibold mb-1">When is a business expense only 50% deductible?</p>
                <p>Meals and entertainment are typically only 50% deductible when they involve a business associate (client, partner, employee). Examples include client dinners, business lunches, or taking a prospect out.</p>
                <p className="mt-1">Meals that are <span className="font-semibold">100% deductible</span> include company-wide events (e.g. a team holiday party) or meals provided on-site for the convenience of the business.</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              maxLength={MAX_LEN.notes}
              placeholder="Any additional comments..."
              className="w-full border-2 border-black/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Receipt upload — new entries only */}
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt <span className="font-normal text-gray-400">(optional — image or PDF, max 10 MB)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="block text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {editingId ? 'Update Expense' : 'Add Expense'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── HISTORY TABLE ── */}
      <div className="bg-white rounded-xl border-2 border-black/30">

        {/* Header row — title + icon buttons */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800 mr-auto whitespace-nowrap">Expense History</h2>

          {!loading && expenses.length > 0 && (
            <>
              {/* CSV Export button */}
              <button
                onClick={exportCSV}
                title="Export to CSV"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border-2 border-black/20 hover:border-gray-400 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <DownloadIcon />
                CSV
              </button>

              {/* Search icon button */}
              <button
                onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch('') }}
                title="Search"
                className={`relative p-1.5 border rounded-lg transition-colors ${
                  showSearch || search
                    ? 'border-brand-500 text-brand-600 bg-brand-50'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                {search && !showSearch && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
                )}
              </button>

              {/* Date-range filter icon button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(v => !v)}
                  title="Filter by date"
                  className={`relative p-1.5 border rounded-lg transition-colors ${
                    filterFrom || filterTo
                      ? 'border-brand-500 text-brand-600 bg-brand-50'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.2 7.49 1 10 1s4.973.2 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                  </svg>
                  {(filterFrom || filterTo) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
                  )}
                </button>

                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-[5]" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-white border-2 border-black/30 rounded-xl shadow-lg p-4 z-10 w-52">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Date Range</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)}
                            className="w-full border-2 border-black/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={filterTo}
                            onChange={e => setFilterTo(e.target.value)}
                            className="w-full border-2 border-black/20 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                      {(filterFrom || filterTo) && (
                        <button
                          onClick={() => { setFilterFrom(''); setFilterTo('') }}
                          className="mt-3 text-xs text-brand-500 hover:text-brand-700 font-medium"
                        >
                          Clear dates
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Expanded search row */}
        {showSearch && !loading && expenses.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <input
              type="text"
              autoFocus
              placeholder="Search entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border-2 border-black/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => { setShowSearch(false); setSearch('') }}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Invalid date range warning */}
        {dateRangeInvalid && (
          <div className="px-6 py-2 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
            <span className="text-xs text-amber-700">"From" date is after "To" date — no results will match.</span>
            <button onClick={() => { setFilterFrom(''); setFilterTo('') }} className="text-xs text-amber-700 underline hover:text-amber-900 font-medium shrink-0">
              Clear dates
            </button>
          </div>
        )}

        {/* Filter status bar */}
        {isFiltering && !dateRangeInvalid && !loading && expenses.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <span className="text-xs text-gray-500">{filteredExpenses.length} of {expenses.length} shown</span>
            <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <EmptyIcon />
            <p className="text-gray-600 font-medium">No expenses yet</p>
            <p className="text-sm text-gray-400">Add your first expense using the form above.</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="px-6 py-10 flex flex-col items-center gap-2 text-center">
            <p className="text-gray-500 font-medium text-sm">No entries match your filters.</p>
            <button onClick={clearFilters} className="text-sm text-brand-500 hover:text-brand-700 font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Notes</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Receipt</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs">
                      {entry.description}
                      {entry.tax_deductible_pct === 50 && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                          50%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600 whitespace-nowrap">
                      {formatCompact(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs hidden md:table-cell">{entry.notes || '—'}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {entry.receipt_path ? (
                        <button
                          onClick={() => handleViewReceipt(entry.receipt_path)}
                          className="text-brand-500 hover:text-brand-700 text-base"
                          title="View receipt"
                        >
                          📎
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-brand-500 hover:text-brand-700 font-medium mr-3"
                      >
                        Edit
                      </button>
                      {entry.receipt_path ? (
                        <button
                          onClick={() => handleRemoveReceipt(entry)}
                          className="text-gray-400 hover:text-red-500 font-medium mr-3"
                        >
                          Remove Receipt
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadReceiptClick(entry.id)}
                          className="text-gray-400 hover:text-brand-600 font-medium mr-3"
                        >
                          Upload Receipt
                        </button>
                      )}
                      <button
                        onClick={() => setPendingDelete(entry)}
                        className="text-red-400 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Delete Expense?"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.description}" (${formatCurrency(pendingDelete.amount)})? This cannot be undone.${pendingDelete.receipt_path ? ' The attached receipt will also be removed.' : ''}`
            : ''
        }
        onConfirm={() => {
          handleDelete(pendingDelete)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
