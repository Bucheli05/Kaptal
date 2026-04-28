import { create } from 'zustand'
import { api } from '../lib/api'

export interface Position {
  id: number
  symbol: string
  description: string | null
  asset_class: string | null
  sector: string | null
  currency: string | null
  quantity: string
  avg_cost: string | null
  market_price: string | null
  market_value: string | null
  unrealized_pnl: string | null
  realized_pnl: string | null
  cost_basis_price: string | null
  fifo_pnl_unrealized: string | null
  daily_price_change_pct: string | null
}

export interface PortfolioSummary {
  total_value: string
  cash_balance: string | null
  daily_pnl: string | null
  daily_pnl_pct: string | null
  total_return_pct: string | null
  positions_count: number
  last_sync: string | null
}

export interface BrokerStatus {
  connected: boolean
  broker_type: string | null
  account_id: string | null
  last_sync: string | null
  message: string | null
}

export interface PortfolioSnapshot {
  snapshot_date: string
  total_value: string
  daily_pnl: string | null
  daily_pnl_pct: string | null
}

interface BrokerState {
  status: BrokerStatus | null
  positions: Position[]
  summary: PortfolioSummary | null
  history: PortfolioSnapshot[]
  isLoading: boolean
  error: string | null
  fetchStatus: () => Promise<void>
  fetchPositions: () => Promise<void>
  fetchSummary: () => Promise<void>
  fetchHistory: () => Promise<void>
  syncPortfolio: () => Promise<boolean>
  connectBroker: (token: string, queryId: string, accountId?: string) => Promise<boolean>
  disconnectBroker: () => Promise<boolean>
  clearError: () => void
}

export const useBrokerStore = create<BrokerState>((set, get) => ({
  status: null,
  positions: [],
  summary: null,
  history: [],
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    try {
      const { data } = await api.get('/broker/status')
      set({ status: data })
    } catch {
      set({ status: { connected: false, broker_type: null, account_id: null, last_sync: null, message: 'No broker connected' } })
    }
  },

  fetchPositions: async () => {
    try {
      const { data } = await api.get('/portfolio/positions')
      set({ positions: data })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error fetching positions' })
    }
  },

  fetchSummary: async () => {
    try {
      const { data } = await api.get('/portfolio/summary')
      set({ summary: data })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error fetching summary' })
    }
  },

  fetchHistory: async () => {
    try {
      const { data } = await api.get('/portfolio/history?limit=90')
      set({ history: data })
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error fetching history' })
    }
  },

  syncPortfolio: async () => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/portfolio/sync')
      await get().fetchPositions()
      await get().fetchSummary()
      await get().fetchHistory()
      await get().fetchStatus()
      set({ isLoading: false })
      return true
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error syncing portfolio', isLoading: false })
      return false
    }
  },

  connectBroker: async (token, queryId, accountId) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/broker/connect', {
        broker_type: 'ibkr',
        flex_token: token,
        flex_query_id: queryId,
        account_id: accountId,
      })
      await get().fetchStatus()
      await get().syncPortfolio()
      set({ isLoading: false })
      return true
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error connecting broker', isLoading: false })
      return false
    }
  },

  disconnectBroker: async () => {
    set({ isLoading: true, error: null })
    try {
      await api.delete('/broker/disconnect')
      set({ status: null, positions: [], summary: null, history: [], isLoading: false })
      return true
    } catch (err: any) {
      const detail = err.response?.data?.detail
      set({ error: detail || 'Error disconnecting broker', isLoading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))
