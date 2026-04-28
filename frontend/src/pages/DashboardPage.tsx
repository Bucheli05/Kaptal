import { useEffect, useState } from 'react'
import { LogOut, Leaf, Link2, RefreshCw, Unlink, AlertCircle, X, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '../stores/authStore'
import { useBrokerStore } from '../stores/brokerStore'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import PerformanceChart from '../components/PerformanceChart'
import PortfolioPieChart from '../components/PortfolioPieChart'
import SummaryCard from '../components/SummaryCard'
import BrokerConnectModal from '../components/BrokerConnectModal'

export default function DashboardPage() {
  const { t } = useTranslation()
  const logout = useAuthStore((s) => s.logout)
  const {
    status,
    positions,
    summary,
    history,
    isLoading,
    error,
    fetchStatus,
    fetchPositions,
    fetchSummary,
    fetchHistory,
    syncPortfolio,
    disconnectBroker,
    clearError,
  } = useBrokerStore()

  const [showConnectModal, setShowConnectModal] = useState(false)
  const [positionsTab, setPositionsTab] = useState<'all' | 'movers'>('all')
  const [moversMode, setMoversMode] = useState<'intraday' | 'costBasis'>('intraday')
  const [expandedTops, setExpandedTops] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (status?.connected) {
      fetchPositions()
      fetchSummary()
      fetchHistory()
    }
  }, [status?.connected, fetchPositions, fetchSummary, fetchHistory])

  const isConnected = status?.connected ?? false

  // Summary cards data
  const totalValue = summary
    ? `$${parseFloat(summary.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : '$0.00'

  const dailyPnl = summary?.daily_pnl
    ? `${parseFloat(summary.daily_pnl) >= 0 ? '+' : ''}$${parseFloat(summary.daily_pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : '-'

  const dailyPnlPct = summary?.daily_pnl_pct
    ? `${parseFloat(summary.daily_pnl_pct) >= 0 ? '+' : ''}${parseFloat(summary.daily_pnl_pct).toFixed(2)}%`
    : '-'

  const cashBalance = summary?.cash_balance
    ? `$${parseFloat(summary.cash_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : '-'

  const totalReturnPct = summary?.total_return_pct
    ? `${parseFloat(summary.total_return_pct) >= 0 ? '+' : ''}${parseFloat(summary.total_return_pct).toFixed(2)}%`
    : '-'

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-coffee-100 dark:border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-sans text-2xl text-coffee-900 dark:text-dark-text">{t('app.name')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2.5 py-1 rounded-lg">
                {t('dashboard.brokerConnected')}
              </span>
              <button
                onClick={() => syncPortfolio()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-coffee-600 dark:text-dark-text-secondary hover:text-forest-700 dark:hover:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-900/20 rounded-lg transition-colors"
                title={t('dashboard.syncPortfolio')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {t('dashboard.syncPortfolio')}
              </button>
              <button
                onClick={() => disconnectBroker()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-coffee-600 dark:text-dark-text-secondary hover:text-terracotta-600 dark:hover:text-terracotta-400 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 rounded-lg transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 hover:bg-forest-100 dark:hover:bg-forest-900/50 rounded-xl transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              {t('dashboard.connectBroker')}
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-coffee-600 dark:text-dark-text-secondary hover:text-terracotta-600 dark:hover:text-terracotta-400 hover:bg-terracotta-50 dark:hover:bg-terracotta-900/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="w-full px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-terracotta-600 dark:text-terracotta-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-terracotta-800 dark:text-terracotta-300">{error}</p>
            </div>
            <button onClick={clearError} className="text-terracotta-400 dark:text-terracotta-500 hover:text-terracotta-600 dark:hover:text-terracotta-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label={t('dashboard.totalValue')}
            value={totalValue}
            change={dailyPnlPct}
            changeType={summary?.daily_pnl_pct && parseFloat(summary.daily_pnl_pct) >= 0 ? 'positive' : 'negative'}
            icon="wallet"
          />
          <SummaryCard
            label={t('dashboard.dailyGain')}
            value={dailyPnl}
            change={dailyPnlPct}
            changeType={summary?.daily_pnl_pct && parseFloat(summary.daily_pnl_pct) >= 0 ? 'positive' : 'negative'}
            icon="chart"
          />
          <SummaryCard
            label={t('dashboard.passiveIncome')}
            value={cashBalance}
            change="-"
            changeType="neutral"
            icon="wallet"
          />
          <SummaryCard
            label={t('dashboard.totalReturn')}
            value={totalReturnPct}
            change={t('dashboard.ytd')}
            changeType={summary?.total_return_pct && parseFloat(summary.total_return_pct) >= 0 ? 'positive' : 'negative'}
            icon="chart"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <PerformanceChart history={history} />
          </div>
          <div className="lg:col-span-2">
            <PortfolioPieChart positions={positions} />
          </div>
        </div>

        {/* Positions */}
        <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl border border-coffee-100/40 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-semibold text-coffee-400 dark:text-dark-text-muted uppercase tracking-wider">
                {t('dashboard.positions')}
              </h3>
              <div className="flex gap-1 bg-coffee-50 dark:bg-dark-surface-hover rounded-xl p-1">
                <button
                  onClick={() => setPositionsTab('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    positionsTab === 'all'
                      ? 'bg-white dark:bg-dark-border text-coffee-900 dark:text-dark-text shadow-sm'
                      : 'text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text'
                  }`}
                >
                  {t('dashboard.allPositions')}
                </button>
                <button
                  onClick={() => setPositionsTab('movers')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    positionsTab === 'movers'
                      ? 'bg-white dark:bg-dark-border text-coffee-900 dark:text-dark-text shadow-sm'
                      : 'text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text'
                  }`}
                >
                  {t('dashboard.topMovers')}
                </button>
              </div>
            </div>
            {summary?.last_sync && (
              <span className="text-xs text-coffee-400 dark:text-dark-text-muted">
                {t('dashboard.lastSync')}: {new Date(summary.last_sync).toLocaleString()}
              </span>
            )}
          </div>

          {positionsTab === 'all' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-coffee-100 dark:border-dark-border">
                    <th className="text-left text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.symbol')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.qty')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.price')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.dailyChange')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.costBasis')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3 pr-4">{t('dashboard.unrealizedPnL')}</th>
                    <th className="text-right text-xs font-medium text-coffee-400 dark:text-dark-text-muted py-3">{t('dashboard.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-coffee-400 dark:text-dark-text-muted">
                        {isConnected
                          ? t('dashboard.noPositions')
                          : t('dashboard.connectBrokerHint')}
                      </td>
                    </tr>
                  ) : (
                    positions.map((pos, i) => {
                      const dailyChange = pos.daily_price_change_pct ? parseFloat(pos.daily_price_change_pct) : null
                      const fifoPnl = pos.fifo_pnl_unrealized ? parseFloat(pos.fifo_pnl_unrealized) : null
                      const costBasis = pos.cost_basis_price ? parseFloat(pos.cost_basis_price) : null
                      return (
                        <tr key={pos.symbol} className={`${i < positions.length - 1 ? 'border-b border-coffee-50 dark:border-dark-border' : ''}`}>
                          <td className="py-3.5 pr-4">
                            <span className="text-sm font-semibold text-coffee-900 dark:text-dark-text">{pos.symbol}</span>
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <span className="text-sm text-coffee-900 dark:text-dark-text">{parseFloat(pos.quantity).toLocaleString()}</span>
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <span className="text-sm text-coffee-900 dark:text-dark-text">
                              {pos.market_price ? `$${parseFloat(pos.market_price).toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            {dailyChange !== null ? (
                              <span className={`text-sm font-medium ${dailyChange >= 0 ? 'text-forest-700 dark:text-forest-400' : 'text-terracotta-600 dark:text-terracotta-400'}`}>
                                {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-sm text-coffee-400 dark:text-dark-text-muted">-</span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <span className="text-sm text-coffee-900 dark:text-dark-text">
                              {costBasis ? `$${costBasis.toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            {fifoPnl !== null ? (
                              <span className={`text-sm font-medium ${fifoPnl >= 0 ? 'text-forest-700 dark:text-forest-400' : 'text-terracotta-600 dark:text-terracotta-400'}`}>
                                {fifoPnl >= 0 ? '+' : ''}${fifoPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-sm text-coffee-400 dark:text-dark-text-muted">-</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="text-sm font-medium text-coffee-900 dark:text-dark-text">
                              {pos.market_value
                                ? `$${parseFloat(pos.market_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                : '-'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              {/* Dropdown selector for movers mode */}
              <div className="flex justify-end mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-coffee-50 dark:bg-dark-surface-hover text-coffee-700 dark:text-dark-text hover:bg-coffee-100 dark:hover:bg-dark-border transition-colors outline-none">
                    {moversMode === 'intraday' ? t('dashboard.intraday') : t('dashboard.costBasisView')}
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem
                      onClick={() => setMoversMode('intraday')}
                      className={moversMode === 'intraday' ? 'bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-400' : ''}
                    >
                      {t('dashboard.intraday')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setMoversMode('costBasis')}
                      className={moversMode === 'costBasis' ? 'bg-forest-50 dark:bg-forest-900/20 text-forest-700 dark:text-forest-400' : ''}
                    >
                      {t('dashboard.costBasisView')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Top Movers content */}
              {(() => {
                const withPct = positions.map((pos) => {
                  let pct: number | null = null
                  if (moversMode === 'intraday') {
                    pct = pos.daily_price_change_pct ? parseFloat(pos.daily_price_change_pct) : null
                  } else {
                    const mp = pos.market_price ? parseFloat(pos.market_price) : null
                    const cb = pos.cost_basis_price ? parseFloat(pos.cost_basis_price) : null
                    if (mp !== null && cb !== null && cb > 0) {
                      pct = ((mp - cb) / cb) * 100
                    }
                  }
                  return { ...pos, pct }
                }).filter((p): p is typeof p & { pct: number } => p.pct !== null)

                const sorted = [...withPct].sort((a, b) => b.pct - a.pct)
                const gainers = sorted.filter((p) => p.pct >= 0)
                const losers = sorted.filter((p) => p.pct < 0)

                const limit = expandedTops ? undefined : 5
                const showGainers = gainers.slice(0, limit)
                const showLosers = losers.slice(0, limit)

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gainers */}
                    <div>
                      <h4 className="text-xs font-semibold text-forest-700 dark:text-forest-400 uppercase tracking-wider mb-3">
                        {t('dashboard.topGainers')}
                      </h4>
                      <div className="space-y-2">
                        {showGainers.length === 0 ? (
                          <p className="text-sm text-coffee-400 dark:text-dark-text-muted">-</p>
                        ) : (
                          showGainers.map((pos, i) => (
                            <div
                              key={pos.symbol}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-forest-50/50 dark:bg-forest-900/10"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-forest-600 dark:text-forest-400 w-4">
                                  {i + 1}
                                </span>
                                <span className="text-sm font-semibold text-coffee-900 dark:text-dark-text">
                                  {pos.symbol}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-forest-700 dark:text-forest-400">
                                +{pos.pct.toFixed(2)}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Losers */}
                    <div>
                      <h4 className="text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider mb-3">
                        {t('dashboard.topLosers')}
                      </h4>
                      <div className="space-y-2">
                        {showLosers.length === 0 ? (
                          <p className="text-sm text-coffee-400 dark:text-dark-text-muted">-</p>
                        ) : (
                          showLosers.map((pos, i) => (
                            <div
                              key={pos.symbol}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-terracotta-50/50 dark:bg-terracotta-900/10"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-terracotta-600 dark:text-terracotta-400 w-4">
                                  {i + 1}
                                </span>
                                <span className="text-sm font-semibold text-coffee-900 dark:text-dark-text">
                                  {pos.symbol}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-terracotta-600 dark:text-terracotta-400">
                                {pos.pct.toFixed(2)}%
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Expand / Collapse */}
              {(positions.filter((p) => {
                if (moversMode === 'intraday') return p.daily_price_change_pct !== null
                const mp = p.market_price ? parseFloat(p.market_price) : null
                const cb = p.cost_basis_price ? parseFloat(p.cost_basis_price) : null
                return mp !== null && cb !== null && cb > 0
              }).length > 5) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setExpandedTops(!expandedTops)}
                    className="text-xs font-medium text-coffee-500 dark:text-dark-text-muted hover:text-coffee-700 dark:hover:text-dark-text transition-colors"
                  >
                    {expandedTops ? t('dashboard.showLess') : t('dashboard.viewAll')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showConnectModal && (
        <BrokerConnectModal onClose={() => setShowConnectModal(false)} />
      )}
    </div>
  )
}
