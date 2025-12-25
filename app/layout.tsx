import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '명함 스캐너',
  description: 'AI 명함 스캐너 - OCR로 명함을 스캔하고 Google Sheets에 저장',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '명함 스캐너'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
