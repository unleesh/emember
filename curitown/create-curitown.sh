#!/bin/bash
# Curitown — 로컬 설치 스크립트
# 실행: bash create-curitown.sh

set -e
echo "🏙️  Curitown 프로젝트 생성 중..."

mkdir -p curitown/app curitown/components curitown/public
cd curitown

# ── package.json ──────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "curitown",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  }
}
EOF

# ── tsconfig.json ─────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# ── next.config.js ────────────────────────────────────────
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
EOF

# ── postcss.config.js ─────────────────────────────────────
cat > postcss.config.js << 'EOF'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# ── tailwind.config.ts ────────────────────────────────────
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
export default config
EOF

# ── app/globals.css ───────────────────────────────────────
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0f0f14;
  --surface: #1a1a24;
  --surface2: #22223a;
  --accent: #7c6ff7;
  --accent2: #f76fc0;
  --text: #e8e6ff;
  --text-muted: #7a7a9a;
}

* { box-sizing: border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

.avatar-blob { transition: transform 0.2s ease; }
.avatar-blob:hover { transform: scale(1.05); }

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 8px var(--accent)); }
  50% { filter: drop-shadow(0 0 20px var(--accent)); }
}
@keyframes bubble-up {
  0% { opacity: 0; transform: translateY(10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}
.floating { animation: float 3s ease-in-out infinite; }
.glowing { animation: pulse-glow 2s ease-in-out infinite; }
.bubble { animation: bubble-up 2.5s ease forwards; }
EOF

# ── app/layout.tsx ────────────────────────────────────────
cat > app/layout.tsx << 'EOF'
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
EOF

# ── components/Avatar.tsx ─────────────────────────────────
cat > components/Avatar.tsx << 'EOF'
'use client'

const PALETTE = [
  ['#7c6ff7', '#f76fc0'],
  ['#6ff7c0', '#6fc0f7'],
  ['#f7c06f', '#f76f6f'],
  ['#c06ff7', '#6ff77c'],
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function Avatar({ id, name, size = 64, speaking = false }: {
  id: string; name: string; size?: number; speaking?: boolean
}) {
  const h = hashString(id)
  const [c1, c2] = PALETTE[h % PALETTE.length]
  const gradId = `grad-${id}`
  const blobs = [
    'M50,15 C70,5 90,20 88,45 C86,70 70,85 50,85 C30,85 12,70 12,45 C12,20 30,25 50,15Z',
    'M48,10 C72,8 92,28 90,52 C88,76 65,90 45,88 C25,86 8,68 10,44 C12,20 24,12 48,10Z',
    'M52,12 C78,10 92,35 88,58 C84,81 62,92 40,86 C18,80 8,58 12,36 C16,14 26,14 52,12Z',
    'M50,8 C76,10 94,32 90,56 C86,80 60,94 38,88 C16,82 6,60 10,36 C14,12 24,6 50,8Z',
  ]
  const blobPath = blobs[h % blobs.length]

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={size} height={size} viewBox="0 0 100 100"
        className={`avatar-blob ${speaking ? 'glowing' : ''}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <path d={blobPath} fill={`url(#${gradId})`} />
        <circle cx="38" cy="44" r="6" fill="white" opacity="0.9" />
        <circle cx="62" cy="44" r="6" fill="white" opacity="0.9" />
        <circle cx="40" cy="45" r="3" fill="#1a1a24" />
        <circle cx="64" cy="45" r="3" fill="#1a1a24" />
        <circle cx="41" cy="43" r="1.5" fill="white" opacity="0.8" />
        <circle cx="65" cy="43" r="1.5" fill="white" opacity="0.8" />
        {speaking
          ? <ellipse cx="50" cy="62" rx="8" ry="5" fill="white" opacity="0.7" />
          : <path d="M 40 60 Q 50 66 60 60" stroke="white" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />}
      </svg>
      <span style={{ fontSize: size * 0.2, color: 'var(--text-muted)', maxWidth: size, textAlign: 'center' }}
        className="truncate">{name}</span>
    </div>
  )
}
EOF

# ── components/Room.tsx ───────────────────────────────────
cat > components/Room.tsx << 'EOF'
'use client'

import { useState, useCallback } from 'react'
import { Avatar } from './Avatar'

export type RoomTheme = 'cosmos' | 'forest' | 'ocean' | 'cafe'

const ROOM_THEMES = {
  cosmos: {
    bg: 'radial-gradient(ellipse at 30% 40%, #1a1040 0%, #0a0820 60%, #060412 100%)',
    name: '우주 정거장', emoji: '🌌',
    objects: [
      { x: 15, y: 20, emoji: '🪐', label: '토성' }, { x: 75, y: 15, emoji: '⭐', label: '별자리' },
      { x: 85, y: 65, emoji: '🛸', label: '탐사선' }, { x: 10, y: 70, emoji: '🌙', label: '달 기지' },
      { x: 50, y: 10, emoji: '☄️', label: '혜성' },
    ],
  },
  forest: {
    bg: 'radial-gradient(ellipse at 50% 80%, #0d2818 0%, #061a0f 60%, #030d07 100%)',
    name: '마법의 숲', emoji: '🌿',
    objects: [
      { x: 10, y: 15, emoji: '🍄', label: '버섯' }, { x: 80, y: 20, emoji: '🦋', label: '나비' },
      { x: 20, y: 70, emoji: '🌺', label: '꽃' }, { x: 75, y: 65, emoji: '🦊', label: '여우' },
      { x: 50, y: 8, emoji: '🌳', label: '고목' },
    ],
  },
  ocean: {
    bg: 'radial-gradient(ellipse at 50% 30%, #0a1f3d 0%, #051228 60%, #020a18 100%)',
    name: '심해 탐험', emoji: '🌊',
    objects: [
      { x: 15, y: 25, emoji: '🐙', label: '문어' }, { x: 78, y: 18, emoji: '🐠', label: '물고기' },
      { x: 82, y: 72, emoji: '🦈', label: '상어' }, { x: 12, y: 68, emoji: '🐚', label: '조개' },
      { x: 48, y: 12, emoji: '🪸', label: '산호' },
    ],
  },
  cafe: {
    bg: 'radial-gradient(ellipse at 40% 60%, #1a1008 0%, #100a04 60%, #080503 100%)',
    name: '비밀 카페', emoji: '☕',
    objects: [
      { x: 12, y: 18, emoji: '📚', label: '책장' }, { x: 76, y: 15, emoji: '🎵', label: '음악' },
      { x: 80, y: 68, emoji: '🕯️', label: '촛불' }, { x: 10, y: 72, emoji: '🌿', label: '화분' },
      { x: 50, y: 10, emoji: '☕', label: '커피' },
    ],
  },
} as const

const SEAT_POSITIONS = [
  { x: 30, y: 45 }, { x: 50, y: 55 }, { x: 70, y: 45 },
  { x: 35, y: 65 }, { x: 60, y: 68 },
]

interface Presence { id: string; name: string; seatIndex: number }

export function Room({ theme, presences, myId }: { theme: RoomTheme; presences: Presence[]; myId: string }) {
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const t = ROOM_THEMES[theme]

  const sendReaction = useCallback((emoji: string) => {
    setReactions(r => ({ ...r, [myId]: emoji }))
    setTimeout(() => setReactions(r => { const n = { ...r }; delete n[myId]; return n }), 2500)
  }, [myId])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ background: t.bg }}>
      {t.objects.map((obj, i) => (
        <div key={i} className="absolute floating select-none pointer-events-none"
          style={{ left: `${obj.x}%`, top: `${obj.y}%`, fontSize: '2rem', animationDelay: `${i * 0.4}s`, opacity: 0.6 }}
          title={obj.label}>{obj.emoji}</div>
      ))}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>{t.emoji}</span><span>{t.name}</span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {presences.length}명
        </span>
      </div>
      {presences.map((p) => {
        const seat = SEAT_POSITIONS[p.seatIndex % SEAT_POSITIONS.length]
        return (
          <div key={p.id} className="absolute flex flex-col items-center"
            style={{ left: `${seat.x}%`, top: `${seat.y}%`, transform: 'translate(-50%, -50%)' }}>
            <Avatar id={p.id} name={p.name} size={64} />
            {reactions[p.id] && <div className="bubble absolute -top-8 text-2xl">{reactions[p.id]}</div>}
          </div>
        )
      })}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {['👋', '❤️', '😂', '🤔', '✨', '🎉'].map(e => (
          <button key={e} onClick={() => sendReaction(e)}
            className="text-xl p-2 rounded-xl transition-transform hover:scale-125 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}>{e}</button>
        ))}
      </div>
    </div>
  )
}
EOF

# ── components/GalleryView.tsx ────────────────────────────
cat > components/GalleryView.tsx << 'EOF'
'use client'

import type { RoomTheme } from './Room'

const ROOMS = [
  { id: 'cosmos-1', theme: 'cosmos' as RoomTheme, title: '우주 정거장 α', desc: '별을 관측하는 조용한 공간', count: 3 },
  { id: 'forest-1', theme: 'forest' as RoomTheme, title: '마법의 숲 깊은 곳', desc: '신비로운 이야기가 피어나는 곳', count: 7 },
  { id: 'ocean-1', theme: 'ocean' as RoomTheme, title: '심해 정원', desc: '아무도 모르는 바닷속 비밀', count: 2 },
  { id: 'cafe-1', theme: 'cafe' as RoomTheme, title: '새벽 세 시 카페', desc: '잠 못 드는 사람들의 아지트', count: 5 },
]

const THEME_PREVIEW: Record<RoomTheme, string> = {
  cosmos: 'radial-gradient(ellipse at 30% 40%, #1a1040, #060412)',
  forest: 'radial-gradient(ellipse at 50% 80%, #0d2818, #030d07)',
  ocean: 'radial-gradient(ellipse at 50% 30%, #0a1f3d, #020a18)',
  cafe: 'radial-gradient(ellipse at 40% 60%, #1a1008, #080503)',
}

const THEME_EMOJI: Record<RoomTheme, string> = { cosmos: '🌌', forest: '🌿', ocean: '🌊', cafe: '☕' }

export function GalleryView({ onEnter, onClose }: {
  onEnter: (roomId: string, theme: RoomTheme) => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Curitown</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>궁금한 공간으로 바로 이동하세요</p>
        </div>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
          닫기 (ESC)
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
          {ROOMS.map(room => (
            <button key={room.id} onClick={() => onEnter(room.id, room.theme)}
              className="relative rounded-2xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: THEME_PREVIEW[room.theme], border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', minHeight: '160px', padding: '1.5rem' }}>
              <div className="text-3xl mb-3">{THEME_EMOJI[room.theme]}</div>
              <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>{room.title}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{room.desc}</div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-muted)' }}>
                {room.count}명 접속 중
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
EOF

# ── components/Chat.tsx ───────────────────────────────────
cat > components/Chat.tsx << 'EOF'
'use client'

import { useState, useRef, useEffect } from 'react'

export interface Message { id: string; userId: string; userName: string; text: string; ts: number }

export function Chat({ messages, onSend, myId }: {
  messages: Message[]; onSend: (text: string) => void; myId: string
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => { const t = input.trim(); if (!t) return; onSend(t); setInput('') }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
            아직 대화가 없어요. 먼저 말을 걸어보세요 👋
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.userId === myId ? 'flex-row-reverse' : ''}`}>
            <div className="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              style={{ background: m.userId === myId ? 'var(--accent)' : 'var(--surface2)', color: 'var(--text)',
                borderRadius: m.userId === myId ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
              {m.userId !== myId && (
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>{m.userName}</div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <input className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)' }}
          placeholder="메시지 입력..." value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} className="px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  )
}
EOF

# ── app/page.tsx ──────────────────────────────────────────
cat > app/page.tsx << 'EOF'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Room, RoomTheme } from '@/components/Room'
import { GalleryView } from '@/components/GalleryView'
import { Chat, Message } from '@/components/Chat'
import { Avatar } from '@/components/Avatar'

const DEMO_USERS = [
  { id: 'user-a', name: '달빛여행자', seatIndex: 1 },
  { id: 'user-b', name: '호기심고양이', seatIndex: 2 },
  { id: 'user-c', name: '별빛탐험가', seatIndex: 3 },
]

const DEMO_MESSAGES: Message[] = [
  { id: '1', userId: 'user-a', userName: '달빛여행자', text: '안녕하세요! 처음 왔어요 🌙', ts: Date.now() - 60000 },
  { id: '2', userId: 'user-b', userName: '호기심고양이', text: '환영해요! 여기 자주 오시나요?', ts: Date.now() - 30000 },
  { id: '3', userId: 'user-c', userName: '별빛탐험가', text: '이 공간 분위기가 너무 좋아서요 ✨', ts: Date.now() - 10000 },
]

const MY_ID = 'me-' + Math.random().toString(36).slice(2, 8)

export default function Page() {
  const [showGallery, setShowGallery] = useState(true)
  const [currentRoom, setCurrentRoom] = useState<{ id: string; theme: RoomTheme } | null>(null)
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [transitioning, setTransitioning] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowGallery(v => !v) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const enterRoom = useCallback((roomId: string, theme: RoomTheme) => {
    setTransitioning(true)
    setTimeout(() => { setCurrentRoom({ id: roomId, theme }); setShowGallery(false); setTransitioning(false) }, 300)
  }, [])

  const sendMessage = useCallback((text: string) => {
    setMessages(msgs => [...msgs, { id: Date.now().toString(), userId: MY_ID, userName: nameInput || 'me', text, ts: Date.now() }])
  }, [nameInput])

  if (!joined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-80"
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center">
            <div className="text-4xl mb-2">🏙️</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Curitown</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>궁금한 것들이 모이는 곳</p>
          </div>
          <Avatar id={MY_ID} name={nameInput || '...'} size={80} />
          <div className="w-full space-y-3">
            <input className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="닉네임을 입력하세요" value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nameInput.trim() && setJoined(true)}
              maxLength={12} autoFocus />
            <button onClick={() => nameInput.trim() && setJoined(true)}
              className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
              Curitown 입장
            </button>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>설치 불필요 · 바로 시작</p>
        </div>
      </div>
    )
  }

  const presences = [{ id: MY_ID, name: nameInput, seatIndex: 0 }, ...DEMO_USERS]

  return (
    <div className="fixed inset-0 flex" style={{ background: 'var(--bg)' }}>
      {showGallery && <GalleryView onEnter={enterRoom} onClose={() => currentRoom && setShowGallery(false)} />}
      {transitioning && <div className="fixed inset-0 z-40" style={{ background: 'var(--bg)', opacity: 0.95 }} />}
      {currentRoom ? (
        <div className="flex flex-1 gap-3 p-3 overflow-hidden">
          <div className="flex-1 min-w-0 relative" style={{ flexBasis: '65%' }}>
            <Room theme={currentRoom.theme} presences={presences} myId={MY_ID} />
            <button onClick={() => setShowGallery(true)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              🗺 공간 탐색 (ESC)
            </button>
          </div>
          <div className="flex flex-col gap-3 overflow-hidden" style={{ flexBasis: '35%', minWidth: '280px' }}>
            <div className="rounded-2xl p-3 flex gap-2 overflow-x-auto" style={{ background: 'var(--surface)', flexShrink: 0 }}>
              {presences.map(p => <Avatar key={p.id} id={p.id} name={p.id === MY_ID ? '나' : p.name} size={44} />)}
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden min-h-0">
              <Chat messages={messages} onSend={sendMessage} myId={MY_ID} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-4xl">🏙️</div>
          <p style={{ color: 'var(--text-muted)' }}>탐색 중인 공간이 없어요</p>
          <button onClick={() => setShowGallery(true)}
            className="px-6 py-3 rounded-xl font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
            공간 탐색하기
          </button>
        </div>
      )}
    </div>
  )
}
EOF

# ── 설치 & 실행 ───────────────────────────────────────────
echo ""
echo "📦 패키지 설치 중..."
npm install

echo ""
echo "✅ 완료! 아래 명령어로 실행하세요:"
echo ""
echo "  cd curitown && npm run dev"
echo ""
echo "  → 브라우저에서 http://localhost:3000 접속"
