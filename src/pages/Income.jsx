import { useState, useMemo } from 'react'
import { useIncome } from '../hooks/useIncome'
import { useIncomeItems } from '../hooks/useIncomeItems'
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

// Empty state icon — document with dollar sign
function EmptyIcon() {
  return (
    <svg className="w-12 h-12 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
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

export default function Income() {
  const { income, loading, addIncome, updateIncome, deleteIncome } = useIncome()
  const { items: recurringItems, addItem, removeItem } = useIncomeItems()
  const toast = useToast()

  // Form state
  const [date, setDate] = useState(today())
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [customDesc, setCustomDesc] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  // Add service form state
  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [serviceError, setServiceError] = useState('')

  // Confirm delete dialog
  const [pendingDelete, setPendingDelete] = useState(null) // entry object or null

  // ── 9.1 / 9.2 Filter state ────────────────────────────────────────────────
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')
  const [search,       setSearch]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [showSearch,   setShowSearch]   = useState(false)

  // Auto-calculated total
  const total = useMemo(() => {
    const recurringTotal = recurringItems
      .filter(item => checkedIds.has(item.id))
      .reduce((sum, item) => sum + Number(item.price), 0)
    const customTotal = customDesc.trim() && customPrice ? Number(customPrice) : 0
    return recurringTotal + customTotal
  }, [checkedIds, recurringItems, customDesc, customPrice])

  // ── 9.1 / 9.2 Filtered income ─────────────────────────────────────────────
  const filteredIncome = useMemo(() => {
    let list = income
    if (filterFrom) list = list.filter(e => e.date >= filterFrom)
    if (filterTo)   list = list.filter(e => e.date <= filterTo)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(e =>
        (e.items || []).some(i => i.name?.toLowerCase().includes(q)) ||
        e.custom_item?.description?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      )
    }
    return list
  }, [income, filterFrom, filterTo, search])

  const isFiltering      = !!(filterFrom || filterTo || search.trim())
  const dateRangeInvalid = !!(filterFrom && filterTo && filterFrom > filterTo)

  function clearFilters() {
    setFilterFrom(''); setFilterTo(''); setSearch(''); setShowSearch(false)
  }

  function toggleItem(id) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetForm() {
    setDate(today())
    setCheckedIds(new Set())
    setCustomDesc('')
    setCustomPrice('')
    setNotes('')
    setEditingId(null)
    setError('')
  }

  function startEdit(entry) {
    setError('')
    setEditingId(entry.id)
    setDate(entry.date)
    setNotes(entry.notes || '')
    const savedNames = new Set((entry.items || []).map(i => i.name))
    const matchedIds = new Set(recurringItems.filter(i => savedNames.has(i.name)).map(i => i.id))
    setCheckedIds(matchedIds)
    if (entry.custom_item) {
      setCustomDesc(entry.custom_item.description)
      setCustomPrice(String(entry.custom_item.price))
    } else {
      setCustomDesc('')
      setCustomPrice('')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const checkedItemObjects = recurringItems.filter(i => checkedIds.has(i.id))
    const hasCustom = customDesc.trim() && customPrice

    if (customPrice) {
      const priceErr = validateAmount(customPrice, 'Price')
      if (priceErr) { setError(priceErr); return }
    }
    if (checkedItemObjects.length === 0 && !hasCustom) {
      setError('Select at least one service or add a custom item.')
      return
    }
    if (total > MAX_AMOUNT) {
      setError('Total cannot exceed $99,999,999.99.')
      return
    }

    const payload = {
      date,
      items: checkedItemObjects.map(i => ({ name: i.name, price: Number(i.price) })),
      custom_item: hasCustom
        ? { description: customDesc.trim(), price: Number(customPrice) }
        : null,
      total_amount: total,
      notes: notes.trim() || null,
    }

    try {
      if (editingId) {
        await updateIncome(editingId, payload)
        toast('Income entry updated.')
      } else {
        await addIncome(payload)
        toast('Income entry added.')
      }
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddService() {
    setServiceError('')
    if (!newServiceName.trim()) { setServiceError('Name is required.'); return }
    const priceErr = validateAmount(newServicePrice, 'Price')
    if (priceErr) { setServiceError(priceErr); return }
    try {
      await addItem(newServiceName.trim(), newServicePrice)
      setNewServiceName('')
      setNewServicePrice('')
      setShowAddService(false)
      toast('Service added.')
    } catch (err) {
      setServiceError(err.message)
    }
  }

  async function handleRemoveService(id) {
    try {
      await removeItem(id)
      setCheckedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      toast('Service removed.')
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteIncome(id)
      if (editingId === id) resetForm()
      toast('Income entry deleted.')
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    }
  }

  function buildItemsBilled(entry) {
    const parts = (entry.items || []).map(i => `${i.name} (${formatCompact(i.price)})`)
    if (entry.custom_item) {
      parts.push(`${entry.custom_item.description} (${formatCompact(entry.custom_item.price)})`)
    }
    return parts.join(', ') || '—'
  }

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Date', 'Items Billed', 'Total Amount', 'Notes']
    const rows = filteredIncome.map(e => [
      e.date,
      buildItemsBilled(e),
      Number(e.total_amount).toFixed(2),
      e.notes || '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `income-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('Income exported to CSV.')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Income</h1>

      {/* ── ENTRY FORM ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {editingId ? 'Edit Income Entry' : 'New Income Entry'}
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
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services Rendered</label>

            {recurringItems.length === 0 && !showAddService && (
              <p className="text-sm text-gray-400 mb-2">No services yet — add one below.</p>
            )}

            <div className="space-y-2 mb-3">
              {recurringItems.map(item => (
                <div key={item.id} className="flex items-center justify-between group">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 accent-brand-500"
                    />
                    <span className="text-sm text-gray-800">{item.name}</span>
                    <span className="text-sm font-medium text-brand-600">{formatCurrency(item.price)}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(item.id)}
                    className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-4"
                    title="Remove service"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showAddService ? (
              <div>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    maxLength={MAX_LEN.serviceName}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-44"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      max={MAX_AMOUNT}
                      step="0.01"
                      value={newServicePrice}
                      onChange={e => setNewServicePrice(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-28"
                    />
                  </div>
                  <button type="button" onClick={handleAddService} className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddService(false); setNewServiceName(''); setNewServicePrice(''); setServiceError('') }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
                {serviceError && <p className="text-sm text-red-500 mt-1">{serviceError}</p>}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddService(true)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                + Add Service
              </button>
            )}
          </div>

          {/* One-off custom item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              One-off Item <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Description"
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                maxLength={MAX_LEN.description}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-[10rem]"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  max={MAX_AMOUNT}
                  step="0.01"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-32"
                />
              </div>
            </div>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Auto-calculated total */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-xl font-bold text-brand-600">{formatCurrency(total)}</span>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {editingId ? 'Update Entry' : 'Add Income'}
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
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header row — title + icon buttons */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800 mr-auto whitespace-nowrap">Income History</h2>

          {!loading && income.length > 0 && (
            <>
              {/* CSV Export button */}
              <button
                onClick={exportCSV}
                title="Export to CSV"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg px-2.5 py-1.5 transition-colors"
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
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10 w-52">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Date Range</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={filterFrom}
                            onChange={e => setFilterFrom(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={filterTo}
                            onChange={e => setFilterTo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        {showSearch && !loading && income.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <input
              type="text"
              autoFocus
              placeholder="Search entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        {isFiltering && !dateRangeInvalid && !loading && income.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <span className="text-xs text-gray-500">{filteredIncome.length} of {income.length} shown</span>
            <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : income.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <EmptyIcon />
            <p className="text-gray-600 font-medium">No income entries yet</p>
            <p className="text-sm text-gray-400">Add your first income entry using the form above.</p>
          </div>
        ) : filteredIncome.length === 0 ? (
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
                  <th className="px-4 py-3 text-left">Items Billed</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIncome.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">{buildItemsBilled(entry)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600 whitespace-nowrap">
                      {formatCompact(entry.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">{entry.notes || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-brand-500 hover:text-brand-700 font-medium mr-3"
                      >
                        Edit
                      </button>
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
        title="Delete Income Entry?"
        message={
          pendingDelete
            ? `Delete the entry from ${formatDate(pendingDelete.date)} (${formatCurrency(pendingDelete.total_amount)})? This cannot be undone.`
            : ''
        }
        onConfirm={() => {
          handleDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
