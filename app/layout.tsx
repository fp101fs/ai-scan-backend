// app/layout.tsx — QWEN-generated root layout
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Scan',
  description: 'Detect AI-generated text across the web',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a1a',
          color: '#e2e8f0',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}