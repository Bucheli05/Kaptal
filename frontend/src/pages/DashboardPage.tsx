import { LogOut, Leaf } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function DashboardPage() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-coffee-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-cream" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl text-coffee-900">Breezely</h1>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-coffee-600 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-forest-700" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl text-coffee-900 mb-3">
            ¡Bienvenido a Breezely!
          </h2>
          <p className="text-coffee-400 max-w-md mx-auto leading-relaxed">
            Tu dashboard está listo. Próximamente podrás conectar tu cuenta de
            Interactive Brokers y ver tu portafolio en tiempo real.
          </p>
        </div>
      </main>
    </div>
  )
}
