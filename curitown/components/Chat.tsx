'use client'

import { useState, useRef, useEffect } from 'react'

export interface Message {
  id: string
  userId: string
  userName: string
  text: string
  ts: number
}

export function Chat({ messages, onSend, myId }: {
  messages: Message[]
  onSend: (text: string) => void
  myId: string
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const t = input.trim()
    if (!t) return
    onSend(t)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
            아직 대화가 없어요. 먼저 말을 걸어보세요 👋
          </p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.userId === myId ? 'flex-row-reverse' : ''}`}>
            <div
              className="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              style={{
                background: m.userId === myId ? 'var(--accent)' : 'var(--surface2)',
                color: 'var(--text)',
                borderRadius: m.userId === myId ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}
            >
              {m.userId !== myId && (
                <div className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>
                  {m.userName}
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 border-t flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <input
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          placeholder="메시지 입력..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          className="px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
