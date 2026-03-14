'use client'

import { useState, useEffect, useCallback } from 'react'
import { Room, RoomTheme } from '@/components/Room'
import { GalleryView } from '@/components/GalleryView'
import { Chat, Message } from '@/components/Chat'
import { Avatar } from '@/components/Avatar'

// 로컬 상태로 멀티플레이어 시뮬레이션 (MVP: 실제 연결 없이 UX 검증)
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

function generateId() {
  return 'me-' + Math.random().toString(36).slice(2, 8)
}

const MY_ID = generateId()
const MY_NAME = ['달콤한꿈', '파란하늘', '조용한별'][Math.floor(Math.random() * 3)]

export default function Page() {
  const [showGallery, setShowGallery] = useState(true)
  const [currentRoom, setCurrentRoom] = useState<{ id: string; theme: RoomTheme } | null>(null)
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [transitioning, setTransitioning] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [joined, setJoined] = useState(false)

  // ESC 키로 갤러리 열기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGallery(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const enterRoom = useCallback((roomId: string, theme: RoomTheme) => {
    setTransitioning(true)
    setTimeout(() => {
      setCurrentRoom({ id: roomId, theme })
      setShowGallery(false)
      setTransitioning(false)
    }, 300)
  }, [])

  const sendMessage = useCallback((text: string) => {
    setMessages(msgs => [
      ...msgs,
      { id: Date.now().toString(), userId: MY_ID, userName: MY_NAME, text, ts: Date.now() },
    ])
  }, [])

  // 이름 입력 화면 (첫 진입)
  if (!joined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl w-80"
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* 로고 */}
          <div className="text-center">
            <div className="text-4xl mb-2">🏙️</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Curitown</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              궁금한 것들이 모이는 곳
            </p>
          </div>

          {/* 아바타 미리보기 */}
          <Avatar id={MY_ID} name={nameInput || '...'} size={80} />

          {/* 이름 입력 */}
          <div className="w-full space-y-3">
            <input
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              placeholder="닉네임을 입력하세요"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nameInput.trim() && setJoined(true)}
              maxLength={12}
              autoFocus
            />
            <button
              onClick={() => nameInput.trim() && setJoined(true)}
              className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Curitown 입장
            </button>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            설치 불필요 · 바로 시작
          </p>
        </div>
      </div>
    )
  }

  const presences = [
    { id: MY_ID, name: nameInput || MY_NAME, seatIndex: 0 },
    ...DEMO_USERS,
  ]

  return (
    <div className="fixed inset-0 flex" style={{ background: 'var(--bg)' }}>
      {/* 갤러리 뷰 (오버레이) */}
      {showGallery && (
        <GalleryView
          onEnter={enterRoom}
          onClose={() => currentRoom && setShowGallery(false)}
        />
      )}

      {/* 전환 오버레이 */}
      {transitioning && (
        <div className="fixed inset-0 z-40" style={{ background: 'var(--bg)', opacity: 0.95 }} />
      )}

      {/* 메인 레이아웃 */}
      {currentRoom ? (
        <div className="flex flex-1 gap-3 p-3 overflow-hidden">
          {/* 공간 뷰 (좌측 2/3) */}
          <div className="flex-1 min-w-0 relative" style={{ flexBasis: '65%' }}>
            <Room theme={currentRoom.theme} presences={presences} myId={MY_ID} />

            {/* 갤러리 열기 버튼 */}
            <button
              onClick={() => setShowGallery(true)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              🗺 공간 탐색 (ESC)
            </button>
          </div>

          {/* 사이드바: 채팅 + 참여자 */}
          <div className="flex flex-col gap-3 overflow-hidden" style={{ flexBasis: '35%', minWidth: '280px' }}>
            {/* 참여자 목록 */}
            <div className="rounded-2xl p-3 flex gap-2 overflow-x-auto"
              style={{ background: 'var(--surface)', flexShrink: 0 }}>
              {presences.map(p => (
                <Avatar key={p.id} id={p.id} name={p.id === MY_ID ? '나' : p.name} size={44} />
              ))}
            </div>

            {/* 채팅 */}
            <div className="flex-1 rounded-2xl overflow-hidden min-h-0">
              <Chat messages={messages} onSend={sendMessage} myId={MY_ID} />
            </div>
          </div>
        </div>
      ) : (
        /* 아직 공간을 선택하지 않은 경우 */
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-4xl">🏙️</div>
          <p style={{ color: 'var(--text-muted)' }}>탐색 중인 공간이 없어요</p>
          <button
            onClick={() => setShowGallery(true)}
            className="px-6 py-3 rounded-xl font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            공간 탐색하기
          </button>
        </div>
      )}
    </div>
  )
}
