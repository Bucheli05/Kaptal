import { LogOut, Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PerformanceChart from '../components/PerformanceChart'
import SummaryCard from '../components/SummaryCard'

export default function DashboardPage() {
  const { t } = useTranslation()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-coffee-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-cream" strokeWidth={1.5} />
          </div>
          <h1 className="font-sans text-2xl text-coffee-900">{t('app.name')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-coffee-600 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Valor total"
            value="$42,850"
            change="+12.4%"
            changeType="positive"
            icon="wallet"
          />
          <SummaryCard
            label="Ganancia hoy"
            value="+$1,240"
            change="+3.1%"
            changeType="positive"
            icon="chart"
          />
          <SummaryCard
            label="Retorno total"
            value="+18.7%"
            change="YTD"
            changeType="neutral"
            icon="chart"
          />
        </div>

        {/* Performance chart */}
        <PerformanceChart />

        {/* Positions */}
        <div className="bg-white rounded-2xl border border-coffee-100 p-6">
          <h3 className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-4">
            Posiciones
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-coffee-100">
                  <th className="text-left text-xs font-medium text-coffee-400 py-3 pr-4">Símbolo</th>
                  <th className="text-left text-xs font-medium text-coffee-400 py-3 pr-4">Nombre</th>
                  <th className="text-right text-xs font-medium text-coffee-400 py-3 pr-4">Cantidad</th>
                  <th className="text-right text-xs font-medium text-coffee-400 py-3 pr-4">Precio</th>
                  <th className="text-right text-xs font-medium text-coffee-400 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { symbol: 'AAPL', name: 'Apple Inc.', qty: 25, price: 178.35, value: 4458.75 },
                  { symbol: 'MSFT', name: 'Microsoft Corp.', qty: 12, price: 412.20, value: 4946.40 },
                  { symbol: 'NVDA', name: 'NVIDIA Corp.', qty: 8, price: 875.50, value: 7004.00 },
                  { symbol: 'TSLA', name: 'Tesla Inc.', qty: 18, price: 172.80, value: 3110.40 },
                ].map((pos, i) => (
                  <tr key={pos.symbol} className={`${i < 3 ? 'border-b border-coffee-50' : ''}`}>
                    <td className="py-3.5 pr-4">
                      <span className="text-sm font-semibold text-coffee-900">{pos.symbol}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-sm text-coffee-500">{pos.name}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className="text-sm text-coffee-900">{pos.qty}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className="text-sm text-coffee-900">${pos.price.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="text-sm font-medium text-coffee-900">
                        ${pos.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
