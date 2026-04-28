import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const dark = stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl text-coffee-400 hover:text-coffee-600 hover:bg-coffee-50
                 dark:text-dark-text-muted dark:hover:text-dark-text dark:hover:bg-dark-surface
                 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
