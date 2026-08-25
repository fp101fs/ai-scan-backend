import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const baseUrl = process.env.NEXTAUTH_URL || 'https://ai-scan-backend.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'AI Scan — Open AI Content Detector & Stylometrics (OpenRouter BYOK)',
    template: '%s | AI Scan',
  },
  description:
    'Detect AI-generated text in real time with OpenRouter OAuth (BYOK) and statistical stylometric analysis (Perplexity, Burstiness, and Lexical Diversity).',
  keywords: [
    'AI Detector',
    'OpenRouter OAuth',
    'GPTZero Alternative',
    'AI Content Detection',
    'Stylometrics',
    'Perplexity Analysis',
    'Burstiness Score',
    'ChatGPT Detector',
    'Claude Detector',
    'Gemini Detector',
    'DeepSeek Detector',
    'Chrome Extension AI Detector',
    'BYOK AI Scanner',
  ],
  authors: [{ name: 'AI Scan Team' }],
  creator: 'AI Scan',
  publisher: 'AI Scan',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'AI Scan',
    title: 'AI Scan — Open AI Content Detector with OpenRouter OAuth',
    description:
      'Detect AI-generated text with mathematical precision. 1-click OpenRouter OAuth PKCE, offline heuristics, and multi-model verification.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Scan — Open AI Content Detector (OpenRouter BYOK)',
    description:
      'Detect AI-generated text with OpenRouter OAuth PKCE, burstiness variance, and perplexity analysis.',
    creator: '@ai_scan',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${baseUrl}/#webapp`,
      name: 'AI Scan',
      url: baseUrl,
      description:
        'Open-source AI content detection platform and Chrome Extension powered by OpenRouter OAuth and statistical stylometrics.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
      },
      featureList: [
        'OpenRouter OAuth PKCE (Bring Your Own Key)',
        'Statistical Perplexity and Burstiness Variance',
        'Multi-Model AI Verification (GPT-4o Mini, Gemini, DeepSeek, Claude)',
        'Zero-Data Retention Privacy Architecture',
        'Real-time Chrome Extension Support',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${baseUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is OpenRouter OAuth and why is it used for AI detection?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'OpenRouter OAuth allows users to connect their OpenRouter account via secure PKCE with 1 click. Users pay direct inference rates from their existing credit balance with zero markup.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use AI Scan for free without an OpenRouter account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, AI Scan contains a built-in Offline Heuristic engine that evaluates sentence length variance (burstiness) and vocabulary entropy locally without API keys or cost.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my scanned text private?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. AI Scan processes text in memory on-demand and does not store, index, or train on your submitted documents.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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