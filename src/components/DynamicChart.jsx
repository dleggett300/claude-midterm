import {
  ResponsiveContainer, ComposedChart,
  Line, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

// ── Formatters ────────────────────────────────────────────────────────────────
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function dollarTick(value) {
  const abs = Math.abs(value)
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(0)}k` : String(abs)
  return value < 0 ? `-$${str}` : `$${str}`
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, activeMetrics }) {
  if (!active || !payload?.length) return null
  const metaByKey = Object.fromEntries(activeMetrics.map(m => [m.key, m]))
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(entry => {
        const meta = metaByKey[entry.dataKey]
        const val  = meta?.isPercentage
          ? `${entry.value}%`
          : currency.format(entry.value)
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {val}
          </p>
        )
      })}
    </div>
  )
}

// ── Series helpers ────────────────────────────────────────────────────────────
const COMBO_BAR_KEYS = new Set(['income', 'expenses'])

// Fix #9: only types that include bars should receive barCategoryGap
const BAR_TYPES = new Set(['bar', 'stackedBar', 'combo'])

function makeSeries(metric, chartType) {
  const { key, label, color, isPercentage } = metric
  const axisId = isPercentage ? 'right' : 'left'

  const base = {
    key,
    dataKey: key,
    name:    label,
    stroke:  color,
    fill:    color,
    yAxisId: axisId,
  }

  if (chartType === 'line') {
    return <Line {...base} type="monotone" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
  }
  if (chartType === 'area') {
    return <Area {...base} type="monotone" strokeWidth={2} fillOpacity={0.12} dot={false} />
  }
  if (chartType === 'stackedBar') {
    // Percentage metrics don't stack sensibly — render as a line instead
    if (isPercentage) {
      return <Line {...base} type="monotone" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
    }
    return <Bar {...base} stackId="stack" radius={[3, 3, 0, 0]} maxBarSize={48} />
  }
  if (chartType === 'combo') {
    if (COMBO_BAR_KEYS.has(key)) {
      return <Bar {...base} radius={[3, 3, 0, 0]} maxBarSize={32} />
    }
    return <Line {...base} type="monotone" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
  }
  // default: bar
  return <Bar {...base} radius={[3, 3, 0, 0]} maxBarSize={32} />
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DynamicChart({ type = 'bar', data = [], activeMetrics = [] }) {
  if (!data.length || !activeMetrics.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No data for the selected range.
      </div>
    )
  }

  const hasPct = activeMetrics.some(m => m.isPercentage)

  // Fix #7: bar-style cursor only makes sense when there are bars present
  const tooltipCursor = BAR_TYPES.has(type)
    ? { fill: '#f9fafb' }
    : { stroke: '#e5e7eb', strokeWidth: 1 }

  // Responsive height: shorter on mobile so the chart doesn't dominate the screen
  return (
    <div className="h-64 sm:h-96">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        // Fix #8: right margin must accommodate the 40px right axis when present
        margin={{ top: 8, right: hasPct ? 48 : 20, left: 8, bottom: 5 }}
        // Fix #9: only pass barCategoryGap when the chart type actually renders bars
        {...(BAR_TYPES.has(type) ? { barCategoryGap: '30%' } : {})}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />

        {/* Left Y-axis — dollar amounts */}
        <YAxis
          yAxisId="left"
          tickFormatter={dollarTick}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />

        {/* Right Y-axis — only mounts when a % metric is active */}
        {hasPct && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
            // Fix #6: allow negative margins to show below zero instead of clipping
            domain={[dataMin => Math.min(0, Math.floor(dataMin)), 100]}
          />
        )}

        <Tooltip
          content={<CustomTooltip activeMetrics={activeMetrics} />}
          cursor={tooltipCursor}
        />

        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
        />

        {activeMetrics.map(m => makeSeries(m, type))}
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  )
}
