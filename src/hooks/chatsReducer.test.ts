import { describe, expect, it } from 'vitest'
import type { Message } from '../types'
import { chatsReducer } from './useChats'

const chatId = '77001234567@c.us'
const message = (id: string, timestamp: number, direction: Message['direction'] = 'in'): Message => ({
  id,
  chatId,
  text: id,
  direction,
  timestamp,
})

describe('chatsReducer', () => {
  const opened = chatsReducer([], { type: 'openChat', chatId })

  it('создаёт чат по chatId', () => {
    expect(opened).toEqual([{ chatId, phone: '77001234567', messages: [], unread: 0 }])
  })

  it('не дублирует сообщение с тем же id', () => {
    const once = chatsReducer(opened, { type: 'addMessage', message: message('a', 1, 'out'), active: true })
    const twice = chatsReducer(once, { type: 'addMessage', message: message('a', 1, 'out'), active: true })
    expect(twice[0].messages).toHaveLength(1)
  })

  it('считает непрочитанные только для неактивного чата', () => {
    const state = chatsReducer(opened, { type: 'addMessage', message: message('a', 1), active: false })
    expect(state[0].unread).toBe(1)
    expect(chatsReducer(state, { type: 'markRead', chatId })[0].unread).toBe(0)
  })

  it('игнорирует сообщения из неоткрытых чатов', () => {
    const other = { ...message('x', 1), chatId: '70000000000@c.us' }
    expect(chatsReducer(opened, { type: 'addMessage', message: other, active: false })).toBe(opened)
  })

  it('сортирует сообщения по времени', () => {
    let state = chatsReducer(opened, { type: 'addMessage', message: message('late', 5), active: true })
    state = chatsReducer(state, { type: 'addMessage', message: message('early', 2), active: true })
    expect(state[0].messages.map((m) => m.id)).toEqual(['early', 'late'])
  })

  it('подтверждает отправку: меняет локальный id на настоящий и снимает статус', () => {
    const sending = { ...message('local-1', 1, 'out'), status: 'sending' as const }
    let state = chatsReducer(opened, { type: 'addMessage', message: sending, active: true })
    state = chatsReducer(state, { type: 'updateMessage', chatId, id: 'local-1', patch: { id: 'real', status: undefined } })
    expect(state[0].messages).toEqual([{ ...message('local-1', 1, 'out'), id: 'real', status: undefined }])
  })

  it('убирает локальную копию, если уведомление о сообщении пришло раньше ответа', () => {
    const sending = { ...message('local-1', 1, 'out'), status: 'sending' as const }
    let state = chatsReducer(opened, { type: 'addMessage', message: sending, active: true })
    state = chatsReducer(state, { type: 'addMessage', message: message('real', 1, 'out'), active: true })
    state = chatsReducer(state, { type: 'updateMessage', chatId, id: 'local-1', patch: { id: 'real', status: undefined } })
    expect(state[0].messages.map((m) => m.id)).toEqual(['real'])
  })

  it('сохраняет имя и аватар контакта, не затирая их пустыми значениями', () => {
    let state = chatsReducer(opened, { type: 'setContact', chatId, name: 'Айгерим', avatar: 'https://example.com/a.jpg' })
    state = chatsReducer(state, { type: 'setContact', chatId, name: '', avatar: '' })
    expect(state[0]).toMatchObject({ name: 'Айгерим', avatar: 'https://example.com/a.jpg' })
  })
})
