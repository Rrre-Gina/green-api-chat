import { useState } from 'react'

const GRADIENTS = [
  ['#7b61ff', '#b16cff'],
  ['#ff6b8b', '#ff9a6b'],
  ['#1eb980', '#5ad6a8'],
  ['#ff9f43', '#ffc36b'],
  ['#2d9cdb', '#56ccf2'],
  ['#e056fd', '#f78fb3'],
]

interface Props {
  seed: string
  label: string
  src?: string
  size?: number
}

export function Avatar({ seed, label, src, size = 52 }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hash = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const [from, to] = GRADIENTS[hash % GRADIENTS.length]
  const letter = label.replace(/^\+/, '').trim().charAt(0).toUpperCase() || '?'

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      {src && src !== failedSrc ? (
        <img className="avatar__img" src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} />
      ) : (
        letter
      )}
    </div>
  )
}
