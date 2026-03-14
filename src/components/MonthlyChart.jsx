import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(value)
}

function yTick(value) {
  const abs = Math.abs(value)
  const str = abs >= 1000 ? `${(abs / 1000).toFixed(0)}k` : String(abs)
  return value < 0 ? `-$${str}` : `$${str}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-2 border-black/30 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   data — array from aggregateByMonth()
//          [{ month: 'Jan', income: Number, expenses: Number }, ...]

export default function MonthlyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 16, left: 8, bottom: 5 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={yTick}
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
        />
        <Bar dataKey="income"   name="Income"   fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
