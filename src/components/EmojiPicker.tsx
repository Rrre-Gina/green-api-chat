import { useEffect, useRef, useState } from 'react'
import { SmileIcon } from './Icons'

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '🙂', '😉', '😍',
  '🥰', '😘', '😎', '🤩', '🥳', '😇', '🤗', '🤔',
  '😏', '🙃', '😅', '😬', '😐', '😴', '😳', '🤯',
  '😢', '😭', '😤', '😡', '😱', '🙈', '👍', '👎',
  '👌', '✌️', '🤝', '🙏', '👏', '💪', '🔥', '✨',
  '❤️', '💔', '💯', '🎉', '🎁', '☕', '🌹', '✅',
]

interface Props {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="emoji" ref={rootRef}>
      {open && (
        <div className="emoji__panel" role="listbox" aria-label="Смайлики">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="emoji__item"
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        className="icon-button emoji__toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Смайлики"
        aria-expanded={open}
      >
        <SmileIcon />
      </button>
    </div>
  )
}
