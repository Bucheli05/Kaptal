import { useMemo, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import type { Position } from '../stores/brokerStore'

ChartJS.register(ArcElement, Tooltip, Legend)

type ViewMode = 'stocks' | 'sectors'

const COLORS = [
  '#1B4332',
  '#2E7D32',
  '#52B788',
  '#E07A5F',
  '#6F4E37',
  '#94A3B8',
  '#CBD5E1',
]

const mockStocksData = [
  { name: 'AAPL', value: 4458.75 },
  { name: 'MSFT', value: 4946.40 },
  { name: 'NVDA', value: 7004.00 },
  { name: 'TSLA', value: 3110.40 },
]

const mockSectorsData = [
  { name: 'Technology', value: 16409.15 },
  { name: 'Consumer Discretionary', value: 3110.40 },
]

interface PortfolioPieChartProps {
  positions?: Position[]
}

export default function PortfolioPieChart({ positions = [] }: PortfolioPieChartProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ViewMode>('stocks')

  const hasRealData = positions.length > 0

  const data = useMemo(() => {
    if (!hasRealData) {
      return mode === 'stocks' ? mockStocksData : mockSectorsData
    }

    if (mode === 'stocks') {
      return positions
        .filter((p) => parseFloat(p.quantity) > 0)
        .map((p) => ({
          name: p.symbol,
          value: parseFloat(p.market_value || '0'),
        }))
        .filter((d) => d.value > 0)
    }

    // Sector mode: aggregate by sector
    const sectorMap: Record<string, number> = {}
    for (const p of positions) {
      const sector = p.sector || 'Other'
      const mv = parseFloat(p.market_value || '0')
      sectorMap[sector] = (sectorMap[sector] || 0) + mv
    }
    return Object.entries(sectorMap).map(([name, value]) => ({ name, value }))
  }, [positions, mode, hasRealData])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1F2130',
        bodyColor: '#1F2130',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        displayColors: true,
        titleFont: { size: 12, family: 'Satoshi, system-ui, sans-serif' },
        bodyFont: { size: 12, family: 'Satoshi, system-ui, sans-serif' },
        callbacks: {
          label: (context: any) => {
            const val = Number(context.raw)
            const pct = ((val / total) * 100).toFixed(1)
            return ` $${val.toLocaleString()} (${pct}%)`
          },
        },
      },
    },
  }), [total])

  return (
    <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl border border-coffee-100/40 dark:border-dark-border p-6 flex flex-col min-h-[360px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-semibold text-coffee-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">
            {t('dashboard.allocation')}
          </h3>
          <span className="text-2xl font-bold text-coffee-900 dark:text-dark-text">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex gap-1 bg-coffee-50 dark:bg-dark-surface-hover rounded-xl p-1">
          <button
            onClick={() => setMode('stocks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'stocks'
                ? 'bg-white dark:bg-dark-border text-coffee-900 dark:text-dark-text shadow-sm'
                : 'text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text'
            }`}
          >
            {t('dashboard.stocks')}
          </button>
          <button
            onClick={() => setMode('sectors')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'sectors'
                ? 'bg-white dark:bg-dark-border text-coffee-900 dark:text-dark-text shadow-sm'
                : 'text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text'
            }`}
          >
            {t('dashboard.sectors')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {data.map((entry, index) => {
            const pct = ((entry.value / total) * 100).toFixed(1)
            return (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-coffee-900 dark:text-dark-text font-medium">{entry.name}</span>
                </div>
                <span className="text-sm text-coffee-500 dark:text-dark-text-muted">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
