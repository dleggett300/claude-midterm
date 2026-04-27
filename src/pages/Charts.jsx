import { useState, useRef, useEffect } from 'react'
import { useIncome }      from '../hooks/useIncome'
import { useExpenses }    from '../hooks/useExpenses'
import { useChartData, ALL_METRICS, METRIC_CONFIG } from '../hooks/useChartData'
import { useSavedCharts } from '../hooks/useSavedCharts'
import DynamicChart from '../components/DynamicChart'

// ── Constants ─────────────────────────────────────────────────────────────────
const CHART_TYPES = [
  { value: 'bar',        label: 'Bar' },
  { value: 'stackedBar', label: 'Stacked' },
  { value: 'line',       label: 'Line' },
  { value: 'area',       label: 'Area' },
  { value: 'combo',      label: 'Combo' },
]

const GROUP_OPTIONS = [
  { value: 'month',   label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year',    label: 'Year' },
]

const RANGE_OPTIONS = [
  { value: '3m',  label: '3M' },
  { value: '6m',  label: '6M' },
  { value: '12m', label: '12M' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All' },
]

const MAX_METRICS = 3

// ── Sub-components ────────────────────────────────────────────────────────────
function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex w-full rounded-lg border border-gray-200 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-1.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            value === opt.value
              ? 'bg-brand-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function MetricPill({ metric, selected, disabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(metric.key)}
      disabled={disabled && !selected}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
        selected
          ? 'border-transparent text-white'
          : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
      style={selected ? { backgroundColor: metric.color, borderColor: metric.color } : {}}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: selected ? 'rgba(255,255,255,0.7)' : metric.color }}
      />
      {metric.label}
    </button>
  )
}

// Displays a saved chart config as a clickable card
function SavedChartCard({ chart, onLoad, onDelete }) {
  const config      = chart.config ?? {}
  const metrics     = config.metrics ?? []
  const chartType   = CHART_TYPES.find(t => t.value === config.chartType)?.label ?? config.chartType
  const groupLabel  = GROUP_OPTIONS.find(g => g.value === config.groupBy)?.label  ?? config.groupBy
  const rangeLabel  = RANGE_OPTIONS.find(r => r.value === config.dateRange)?.label ?? config.dateRange

  return (
    <button
      type="button"
      onClick={() => onLoad(config)}
      className="text-left w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-400 hover:shadow-sm transition-all group relative"
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onDelete(chart.id) }}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors text-sm leading-none"
        title="Delete"
      >
        ✕
      </button>

      {/* Name */}
      <p className="font-semibold text-gray-800 text-sm pr-5 truncate">{chart.name}</p>

      {/* Type + range */}
      <p className="text-xs text-gray-400 mt-0.5">{chartType} · {groupLabel} · {rangeLabel}</p>

      {/* Metric dots */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {metrics.map(key => {
          const m = METRIC_CONFIG[key]
          if (!m) return null
          return (
            <span
              key={key}
              className="flex items-center gap-1 text-xs text-gray-500"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          )
        })}
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Charts() {
  const { income,   loading: incLoading } = useIncome()
  const { expenses, loading: expLoading } = useExpenses()
  const { savedCharts, loading: savedLoading, saveChart, deleteChart } = useSavedCharts()

  const [chartType,       setChartType]       = useState('bar')
  const [selectedMetrics, setSelectedMetrics] = useState(['income', 'expenses'])
  const [groupBy,         setGroupBy]         = useState('month')
  const [dateRange,       setDateRange]       = useState('12m')

  // Save UI state
  const [isSaving,   setIsSaving]   = useState(false)
  const [chartName,  setChartName]  = useState('')
  const [saveError,  setSaveError]  = useState('')
  const nameInputRef = useRef(null)

  // Focus the name input when the save row opens
  useEffect(() => {
    if (isSaving) nameInputRef.current?.focus()
  }, [isSaving])

  const { data, activeMetrics } = useChartData(income, expenses, {
    metrics:  selectedMetrics,
    groupBy,
    dateRange,
  })

  const loading = incLoading || expLoading

  function toggleMetric(key) {
    setSelectedMetrics(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : prev.length < MAX_METRICS
          ? [...prev, key]
          : prev
    )
  }

  function handleLoadChart(config) {
    if (config.chartType)       setChartType(config.chartType)
    if (config.metrics?.length) setSelectedMetrics(config.metrics)
    if (config.groupBy)         setGroupBy(config.groupBy)
    if (config.dateRange)       setDateRange(config.dateRange)
    // Scroll back to top so user sees the updated chart
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave() {
    if (!chartName.trim()) { setSaveError('Please enter a name.'); return }
    try {
      setSaveError('')
      await saveChart(chartName, { chartType, metrics: selectedMetrics, groupBy, dateRange })
      setChartName('')
      setIsSaving(false)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  function handleSaveKeyDown(e) {
    if (e.key === 'Enter')  handleSave()
    if (e.key === 'Escape') { setIsSaving(false); setChartName(''); setSaveError('') }
  }

  const atLimit = selectedMetrics.length >= MAX_METRICS

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Charts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Build custom charts from your financial data.</p>
      </div>

      {/* ── Builder card ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">

        {/* Controls */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 items-start">

          <div className="col-span-2 sm:col-auto space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chart type</p>
            <SegmentedControl options={CHART_TYPES} value={chartType} onChange={setChartType} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Group by</p>
            <SegmentedControl options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Range</p>
            <SegmentedControl options={RANGE_OPTIONS} value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Metrics
            <span className="ml-2 font-normal normal-case">
              {selectedMetrics.length}/{MAX_METRICS} selected
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_METRICS.map(m => (
              <MetricPill
                key={m.key}
                metric={m}
                selected={selectedMetrics.includes(m.key)}
                disabled={atLimit}
                onToggle={toggleMetric}
              />
            ))}
          </div>
        </div>

        {/* Save row */}
        <div className="pt-1 border-t border-gray-100">
          {isSaving ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={chartName}
                  onChange={e => { setChartName(e.target.value); setSaveError('') }}
                  onKeyDown={handleSaveKeyDown}
                  placeholder="Chart name…"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSaving(false); setChartName(''); setSaveError('') }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSaving(true)}
              className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
            >
              + Save this chart
            </button>
          )}
        </div>
      </div>

      {/* ── Chart preview ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center h-52 sm:h-64 text-gray-400 text-sm">
            Loading data…
          </div>
        ) : selectedMetrics.length === 0 ? (
          <div className="flex items-center justify-center h-52 sm:h-64 text-gray-400 text-sm">
            Select at least one metric above to see a chart.
          </div>
        ) : (
          <DynamicChart
            type={chartType}
            data={data}
            activeMetrics={activeMetrics}
          />
        )}
      </div>

      {/* ── Saved charts ── */}
      {!savedLoading && savedCharts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Saved charts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedCharts.map(chart => (
              <SavedChartCard
                key={chart.id}
                chart={chart}
                onLoad={handleLoadChart}
                onDelete={deleteChart}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
