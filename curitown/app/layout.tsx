import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Curitown — 궁금한 것들이 모이는 곳',
  description: '이동 없이, 바로 연결되는 메타버스 공간',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
