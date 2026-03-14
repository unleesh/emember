'use client'

// 갤러리 뷰: ESC 누르면 보이는 공간 카드 목록
import type { RoomTheme } from './Room'

const ROOMS: { id: string; theme: RoomTheme; title: string; desc: string; count: number }[] = [
  { id: 'cosmos-1', theme: 'cosmos', title: '우주 정거장 α', desc: '별을 관측하는 조용한 공간', count: 3 },
  { id: 'forest-1', theme: 'forest', title: '마법의 숲 깊은 곳', desc: '신비로운 이야기가 피어나는 곳', count: 7 },
  { id: 'ocean-1', theme: 'ocean', title: '심해 정원', desc: '아무도 모르는 바닷속 비밀', count: 2 },
  { id: 'cafe-1', theme: 'cafe', title: '새벽 세 시 카페', desc: '잠 못 드는 사람들의 아지트', count: 5 },
]

const THEME_PREVIEW: Record<RoomTheme, string> = {
  cosmos: 'radial-gradient(ellipse at 30% 40%, #1a1040, #060412)',
  forest: 'radial-gradient(ellipse at 50% 80%, #0d2818, #030d07)',
  ocean: 'radial-gradient(ellipse at 50% 30%, #0a1f3d, #020a18)',
  cafe: 'radial-gradient(ellipse at 40% 60%, #1a1008, #080503)',
}

const THEME_EMOJI: Record<RoomTheme, string> = {
  cosmos: '🌌', forest: '🌿', ocean: '🌊', cafe: '☕',
}

export function GalleryView({ onEnter, onClose }: {
  onEnter: (roomId: string, theme: RoomTheme) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(12px)' }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Curitown
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            궁금한 공간으로 바로 이동하세요
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
        >
          닫기 (ESC)
        </button>
      </div>

      {/* 공간 카드 그리드 */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => onEnter(room.id, room.theme)}
              className="relative rounded-2xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: THEME_PREVIEW[room.theme],
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                minHeight: '160px',
                padding: '1.5rem',
              }}
            >
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
