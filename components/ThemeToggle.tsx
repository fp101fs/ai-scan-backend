'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={`btn btn-secondary btn-sm ${className}`}
        aria-label="Toggle light/dark theme"
        style={{ width: 36, height: 36, padding: 0, borderRadius: 'var(--radius-full)' }}
      >
        <span style={{ fontSize: 16 }}>🌙</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-sm ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      style={{
        width: 36,
        height: 36,
        padding: 0,
        borderRadius: 'var(--radius-full)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  )
}
