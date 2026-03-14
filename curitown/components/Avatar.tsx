'use client'

// SVG blob avatar — 각 유저는 고유한 색상+모양 조합
const SHAPES = ['blob1', 'blob2', 'blob3', 'blob4'] as const
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
  id: string
  name: string
  size?: number
  speaking?: boolean
}) {
  const h = hashString(id)
  const [c1, c2] = PALETTE[h % PALETTE.length]
  const gradId = `grad-${id}`

  // 4가지 blob 경로 (유기적 SVG 형태)
  const blobs = [
    'M50,15 C70,5 90,20 88,45 C86,70 70,85 50,85 C30,85 12,70 12,45 C12,20 30,25 50,15Z',
    'M48,10 C72,8 92,28 90,52 C88,76 65,90 45,88 C25,86 8,68 10,44 C12,20 24,12 48,10Z',
    'M52,12 C78,10 92,35 88,58 C84,81 62,92 40,86 C18,80 8,58 12,36 C16,14 26,14 52,12Z',
    'M50,8 C76,10 94,32 90,56 C86,80 60,94 38,88 C16,82 6,60 10,36 C14,12 24,6 50,8Z',
  ]
  const blobPath = blobs[h % blobs.length]

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg
        width={size} height={size} viewBox="0 0 100 100"
        className={`avatar-blob ${speaking ? 'glowing' : ''}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <path d={blobPath} fill={`url(#${gradId})`} />
        {/* 눈 */}
        <circle cx="38" cy="44" r="6" fill="white" opacity="0.9" />
        <circle cx="62" cy="44" r="6" fill="white" opacity="0.9" />
        <circle cx="40" cy="45" r="3" fill="#1a1a24" />
        <circle cx="64" cy="45" r="3" fill="#1a1a24" />
        {/* 하이라이트 */}
        <circle cx="41" cy="43" r="1.5" fill="white" opacity="0.8" />
        <circle cx="65" cy="43" r="1.5" fill="white" opacity="0.8" />
        {/* 발언 시 입 */}
        {speaking && <ellipse cx="50" cy="62" rx="8" ry="5" fill="white" opacity="0.7" />}
        {!speaking && <path d="M 40 60 Q 50 66 60 60" stroke="white" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />}
      </svg>
      <span style={{ fontSize: size * 0.2, color: 'var(--text-muted)', maxWidth: size, textAlign: 'center' }}
        className="truncate">
        {name}
      </span>
    </div>
  )
}
