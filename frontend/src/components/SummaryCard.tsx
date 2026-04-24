import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: 'wallet' | 'chart'
}

export default function SummaryCard({ label, value, change, changeType, icon }: SummaryCardProps) {
  const Icon = icon === 'wallet' ? Wallet : BarChart3

  return (
    <div className="bg-white rounded-2xl border border-coffee-100 p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-1.5">
          {label}
        </p>
        <p className="text-xl font-bold text-coffee-900">{value}</p>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {changeType === 'positive' ? (
              <TrendingUp className="w-3.5 h-3.5 text-forest-600" />
            ) : changeType === 'negative' ? (
              <TrendingDown className="w-3.5 h-3.5 text-terracotta-600" />
            ) : null}
            <span
              className={`text-xs font-medium ${
                changeType === 'positive'
                  ? 'text-forest-600'
                  : changeType === 'negative'
                  ? 'text-terracotta-600'
                  : 'text-coffee-400'
              }`}
            >
              {change}
            </span>
          </div>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-forest-700" strokeWidth={1.5} />
      </div>
    </div>
  )
}
