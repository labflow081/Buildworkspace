import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea, XPInput } from '@/components/xp/XPInput'
import { Profile } from '@/types'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  profiles: Profile[]
  onCreate: (data: { text: string; assignee: string | null; due_date: string | null }) => Promise<void>
}

export const NewTaskDialog = ({ open, onClose, profiles, onCreate }: Props) => {
  const [text, setText] = useState('')
  const [assignee, setAssignee] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError('Descrivi la task.'); return }
    if (trimmed.length > 500) { setError('Massimo 500 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onCreate({
        text: trimmed,
        assignee: assignee || null,
        due_date: dueDate || null,
      })
      playSound('open')
      reset()
      onClose()
    } catch {
      setError('Errore nella creazione della task.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setText('')
    setAssignee('')
    setDueDate('')
    setError('')
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <XPDialog
      title="Nuova task"
      open={open}
      onClose={handleClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPTextarea
        label="Descrizione:"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={500}
        rows={4}
        autoFocus
        placeholder="Cosa c'è da fare?"
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{text.length}/500</div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: 11, color: '#1A1828' }}>Assegna a:</label>
        <select
          className="xp-input w-full"
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
        >
          <option value="">(nessuno)</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.display_name ?? p.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>

      <XPInput
        label="Scadenza (opzionale):"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
