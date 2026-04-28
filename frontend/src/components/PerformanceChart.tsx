import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { PortfolioSnapshot } from '../stores/brokerStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

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
    value += (Math.random() - 0.45) * (
      range === '1D' ? 50 : range === '5Y' ? 300 : 150
    )
    data.push({
      label: range === '1D' ? `${i}:00` :
             range === '1W' ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i] :
             range === '1M' ? `${i + 1}` :
             range === '1Y' ? `S${i + 1}` :
             `Y${Math.floor(i / 12) + 1}M${(i % 12) + 1}`,
      value: Math.round(value),
    })
  }
  return data
}

interface PerformanceChartProps {
  history?: PortfolioSnapshot[]
}

export default function PerformanceChart({ history = [] }: PerformanceChartProps) {
  const [range, setRange] = useState<TimeRange>('1Y')

  const hasHistory = history.length > 1

  const chartDataPoints = useMemo(() => {
    if (hasHistory) {
      // Deduplicar por fecha local (evita duplicados por zona horaria)
      const seen = new Map<string, PortfolioSnapshot>()
      for (const snap of history) {
        const localDate = new Date(snap.snapshot_date).toLocaleDateString('es', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        const existing = seen.get(localDate)
        if (!existing || new Date(snap.snapshot_date) > new Date(existing.snapshot_date)) {
          seen.set(localDate, snap)
        }
      }

      const points = Array.from(seen.values()).map((snap) => {
        const d = new Date(snap.snapshot_date)
        const label = d.toLocaleDateString('es', {
          month: 'short',
          day: 'numeric',
        })
        return {
          label,
          value: parseFloat(snap.total_value),
          rawDate: snap.snapshot_date,
        }
      })
      return points
    }
    return generateMockData(range)
  }, [history, hasHistory, range])

  const lastValue = chartDataPoints[chartDataPoints.length - 1]?.value ?? 0
  const firstValue = chartDataPoints[0]?.value ?? 0
  const change = lastValue - firstValue
  const changePct = firstValue > 0
    ? ((change / firstValue) * 100).toFixed(2)
    : '0.00'

  const chartData = useMemo(() => {
    const labels = chartDataPoints.map((d) => d.label)
    const values = chartDataPoints.map((d) => d.value)

    return {
      labels,
      datasets: [
        {
          data: values,
          borderColor: '#1B4332',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart
            const { ctx: canvasCtx, chartArea } = chart
            if (!chartArea) return 'rgba(27, 67, 50, 0.08)'
            const gradient = canvasCtx.createLinearGradient(
              0, chartArea.top,
              0, chartArea.bottom,
            )
            gradient.addColorStop(0, 'rgba(27, 67, 50, 0.08)')
            gradient.addColorStop(1, 'rgba(27, 67, 50, 0)')
            return gradient
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#1B4332',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
      ],
    }
  }, [chartDataPoints])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#64748B',
        bodyColor: '#1F2130',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: false,
        titleFont: { size: 11, family: 'Satoshi, system-ui, sans-serif' },
        bodyFont: { size: 12, family: 'Satoshi, system-ui, sans-serif' },
        callbacks: {
          label: (context: any) => `$${Number(context.raw).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#94A3B8',
          font: { size: 11, family: 'Satoshi, system-ui, sans-serif' },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: '#E2E8F0',
          borderDash: [3, 3] as number[],
          drawBorder: false,
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 11, family: 'Satoshi, system-ui, sans-serif' },
          callback: (value: any) => `$${(Number(value) / 1000).toFixed(1)}k`,
        },
        border: { display: false },
      },
    },
  }), [])

  return (
    <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl border border-coffee-100/40 dark:border-dark-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-semibold text-coffee-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">
            Rendimiento
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coffee-900 dark:text-dark-text">
              ${lastValue.toLocaleString()}
            </span>
            <span
              className={`text-sm font-medium ${
                change >= 0 ? 'text-forest-700 dark:text-forest-400' : 'text-terracotta-600 dark:text-terracotta-400'
              }`}
            >
              {change >= 0 ? '+' : ''}
              {changePct}%
            </span>
          </div>
        </div>

        {!hasHistory && (
          <div className="flex gap-1 bg-coffee-50 dark:bg-dark-surface-hover rounded-xl p-1">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  range === r.key
                    ? 'bg-white dark:bg-dark-border text-coffee-900 dark:text-dark-text shadow-sm'
                    : 'text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
