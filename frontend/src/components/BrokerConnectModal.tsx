import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Link2, AlertCircle } from 'lucide-react'
import { useBrokerStore } from '../stores/brokerStore'

interface BrokerConnectModalProps {
  onClose: () => void
}

export default function BrokerConnectModal({ onClose }: BrokerConnectModalProps) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [queryId, setQueryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const { connectBroker, isLoading, error, clearError } = useBrokerStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = await connectBroker(token, queryId, accountId || undefined)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-coffee-400 dark:text-dark-text-muted hover:text-coffee-600 dark:hover:text-dark-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-coffee-900 dark:text-dark-text">
              {t('broker.connectTitle')}
            </h2>
            <p className="text-xs text-coffee-400 dark:text-dark-text-muted">
              {t('broker.connectSubtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-coffee-600 dark:text-dark-text-secondary mb-1.5">
              {t('broker.flexToken')}
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="1234567890abcdef..."
              className="input-organic"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-coffee-600 dark:text-dark-text-secondary mb-1.5">
              {t('broker.flexQueryId')}
            </label>
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="123456"
              className="input-organic"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-coffee-600 dark:text-dark-text-secondary mb-1.5">
              {t('broker.accountId')} ({t('broker.optional')})
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="DU1234567"
              className="input-organic"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-terracotta-50 dark:bg-terracotta-900/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-terracotta-700 dark:text-terracotta-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? t('broker.connecting') : t('broker.connectButton')}
          </button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-surface-hover rounded-xl text-xs text-coffee-500 dark:text-dark-text-muted space-y-1">
          <p className="font-medium text-coffee-700 dark:text-dark-text-secondary">{t('broker.howToTitle')}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>{t('broker.step1')}</li>
            <li>{t('broker.step2')}</li>
            <li>{t('broker.step3')}</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
