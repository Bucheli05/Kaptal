import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type TimeRange = '1D' | '1W' | '1M' | '1Y' | '5Y'

const ranges: { key: TimeRange; label: string }[] = [
  { key: '1D', label: 'Día' },
  { key: '1W', label: 'Semana' },
  { key: '1M', label: 'Mes' },
  { key: '1Y', label: 'Año' },
  { key: '5Y', label: '5 Años' },
]

function generateMockData(range: TimeRange) {
  const points =
    range === '1D' ? 24 :
    range === '1W' ? 7 :
    range === '1M' ? 30 :
    range === '1Y' ? 52 :
    60

  const data = []
  let value = 10000
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.45) * (range === '1D' ? 50 : range === '5Y' ? 300 : 150)
    data.push({
      label: range === '1D' ? `${i}:00` :
             range === '1W' ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i] :
             range === '1M' ? `${i + 1}` :
             range === '1Y' ? `S${i + 1}` :
             `Y${Math.floor(i / 12) + 1}M${(i % 12) + 1}`,
      value: Math.round(value),
      index: i,
    })
  }
  return data
}

/** Estrella orgánica brillante en la punta del gráfico */
function StarDot({ cx, cy, index, dataLength }: any) {
  if (index !== dataLength - 1) return null

  return (
    <g>
      {/* Glow suave orgánico */}
      <circle cx={cx} cy={cy} r={18} fill="url(#starGlow)" opacity={0.35} />
      <circle cx={cx} cy={cy} r={10} fill="url(#starGlow)" opacity={0.5} />

      {/* Rayos sutiles */}
      {[0, 45, 90, 135].map((angle) => (
        <line
          key={angle}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((angle * Math.PI) / 180) * 14}
          y2={cy + Math.sin((angle * Math.PI) / 180) * 14}
          stroke="#E07A5F"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.6}
        />
      ))}
      {[22.5, 67.5, 112.5, 157.5].map((angle) => (
        <line
          key={angle}
          x1={cx}
          y1={cy}
          x2={cx + Math.cos((angle * Math.PI) / 180) * 8}
          y2={cy + Math.sin((angle * Math.PI) / 180) * 8}
          stroke="#E07A5F"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.4}
        />
      ))}

      {/* Núcleo */}
      <circle cx={cx} cy={cy} r={4} fill="#E07A5F" />
      <circle cx={cx} cy={cy} r={2} fill="#F4F1DE" />
    </g>
  )
}

export default function PerformanceChart() {
  const [range, setRange] = useState<TimeRange>('1Y')
  const data = useMemo(() => generateMockData(range), [range])

  const lastValue = data[data.length - 1]?.value ?? 0
  const firstValue = data[0]?.value ?? 0
  const change = lastValue - firstValue
  const changePct = ((change / firstValue) * 100).toFixed(2)

  const renderDot = (props: any) => (
    <StarDot {...props} dataLength={data.length} />
  )

  return (
    <div className="bg-white rounded-2xl border border-coffee-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-1">
            Rendimiento
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coffee-900">
              ${lastValue.toLocaleString()}
            </span>
            <span
              className={`text-sm font-medium ${change >= 0 ? 'text-forest-700' : 'text-terracotta-600'}`}
            >
              {change >= 0 ? '+' : ''}
              {changePct}%
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-coffee-50 rounded-xl p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === r.key
                  ? 'bg-white text-coffee-900 shadow-sm'
                  : 'text-coffee-400 hover:text-coffee-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B4332" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
              </linearGradient>
              <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E07A5F" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#E07A5F" stopOpacity={0} />
              </radialGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Valor']}
              labelStyle={{ color: '#64748B', fontSize: '11px', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1B4332"
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={renderDot}
              activeDot={{ r: 4, fill: '#1B4332', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
