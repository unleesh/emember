'use client'

import { useState, useCallback } from 'react'
import { Avatar } from './Avatar'

export type RoomTheme = 'cosmos' | 'forest' | 'ocean' | 'cafe'

const ROOM_THEMES: Record<RoomTheme, { bg: string; name: string; emoji: string; objects: { x: number; y: number; emoji: string; label: string }[] }> = {
  cosmos: {
    bg: 'radial-gradient(ellipse at 30% 40%, #1a1040 0%, #0a0820 60%, #060412 100%)',
    name: '우주 정거장',
    emoji: '🌌',
    objects: [
      { x: 15, y: 20, emoji: '🪐', label: '토성' },
      { x: 75, y: 15, emoji: '⭐', label: '별자리' },
      { x: 85, y: 65, emoji: '🛸', label: '탐사선' },
      { x: 10, y: 70, emoji: '🌙', label: '달 기지' },
      { x: 50, y: 10, emoji: '☄️', label: '혜성' },
    ],
  },
  forest: {
    bg: 'radial-gradient(ellipse at 50% 80%, #0d2818 0%, #061a0f 60%, #030d07 100%)',
    name: '마법의 숲',
    emoji: '🌿',
    objects: [
      { x: 10, y: 15, emoji: '🍄', label: '버섯' },
      { x: 80, y: 20, emoji: '🦋', label: '나비' },
      { x: 20, y: 70, emoji: '🌺', label: '꽃' },
      { x: 75, y: 65, emoji: '🦊', label: '여우' },
      { x: 50, y: 8, emoji: '🌳', label: '고목' },
    ],
  },
  ocean: {
    bg: 'radial-gradient(ellipse at 50% 30%, #0a1f3d 0%, #051228 60%, #020a18 100%)',
    name: '심해 탐험',
    emoji: '🌊',
    objects: [
      { x: 15, y: 25, emoji: '🐙', label: '문어' },
      { x: 78, y: 18, emoji: '🐠', label: '물고기' },
      { x: 82, y: 72, emoji: '🦈', label: '상어' },
      { x: 12, y: 68, emoji: '🐚', label: '조개' },
      { x: 48, y: 12, emoji: '🪸', label: '산호' },
    ],
  },
  cafe: {
    bg: 'radial-gradient(ellipse at 40% 60%, #1a1008 0%, #100a04 60%, #080503 100%)',
    name: '비밀 카페',
    emoji: '☕',
    objects: [
      { x: 12, y: 18, emoji: '📚', label: '책장' },
      { x: 76, y: 15, emoji: '🎵', label: '음악' },
      { x: 80, y: 68, emoji: '🕯️', label: '촛불' },
      { x: 10, y: 72, emoji: '🌿', label: '화분' },
      { x: 50, y: 10, emoji: '☕', label: '커피' },
    ],
  },
}

// 공간 내 고정된 슬롯 위치 (%) — 아바타가 "앉는" 자리
const SEAT_POSITIONS = [
  { x: 30, y: 45 }, { x: 50, y: 55 }, { x: 70, y: 45 },
  { x: 35, y: 65 }, { x: 60, y: 68 },
]

interface Presence {
  id: string
  name: string
  seatIndex: number
  reaction?: string
}

export function Room({ theme, presences, myId }: {
  theme: RoomTheme
  presences: Presence[]
  myId: string
}) {
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const t = ROOM_THEMES[theme]

  const sendReaction = useCallback((emoji: string) => {
    setReactions(r => ({ ...r, [myId]: emoji }))
    setTimeout(() => setReactions(r => { const n = { ...r }; delete n[myId]; return n }), 2500)
  }, [myId])

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ background: t.bg }}>
      {/* 배경 오브젝트들 — 장식용 */}
      {t.objects.map((obj, i) => (
        <div
          key={i}
          className="absolute floating select-none pointer-events-none"
          style={{
            left: `${obj.x}%`, top: `${obj.y}%`,
            fontSize: '2rem',
            animationDelay: `${i * 0.4}s`,
            opacity: 0.6,
          }}
          title={obj.label}
        >
          {obj.emoji}
        </div>
      ))}

      {/* 공간 이름 */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-sm"
        style={{ color: 'var(--text-muted)' }}>
        <span>{t.emoji}</span>
        <span>{t.name}</span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {presences.length}명
        </span>
      </div>

      {/* 아바타들 — 슬롯 위치에 배치 */}
      {presences.map((p, i) => {
        const seat = SEAT_POSITIONS[p.seatIndex % SEAT_POSITIONS.length]
        return (
          <div
            key={p.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${seat.x}%`, top: `${seat.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <Avatar id={p.id} name={p.name} size={64} speaking={false} />
            {reactions[p.id] && (
              <div className="bubble absolute -top-8 text-2xl">{reactions[p.id]}</div>
            )}
          </div>
        )
      })}

      {/* 리액션 바 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {['👋', '❤️', '😂', '🤔', '✨', '🎉'].map(e => (
          <button
            key={e}
            onClick={() => sendReaction(e)}
            className="text-xl p-2 rounded-xl transition-transform hover:scale-125 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer' }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
