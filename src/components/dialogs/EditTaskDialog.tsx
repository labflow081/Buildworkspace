import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea, XPInput } from '@/components/xp/XPInput'
import { XpSelect } from '@/components/xp/XpSelect'
import { TAGS, PRIORITIES } from '@/constants/taxonomy'
import { Profile, Task } from '@/types'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  profiles: Profile[]
  onSave: (data: {
    text: string
    assignee: string | null
    due_date: string | null
    tag: string | null
    priority: string | null
  }) => Promise<void>
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

const labelStyle: React.CSSProperties = {
  width: 70,
  minWidth: 70,
  fontSize: 11,
  color: '#1A1828',
  flexShrink: 0,
}

export const EditTaskDialog = ({ open, onClose, task, profiles, onSave }: Props) => {
  const [text, setText] = useState('')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tag, setTag] = useState('')
  const [priority, setPriority] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && task) {
      setText(task.text)
      setAssignee(task.assignee ?? '')
      setDueDate(task.due_date ?? '')
      setTag(task.tag ?? '')
      setPriority(task.priority ?? '')
      setError('')
    }
  }, [open, task])

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError('Descrivi la task.'); return }
    if (trimmed.length > 500) { setError('Massimo 500 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onSave({
        text: trimmed,
        assignee: assignee || null,
        due_date: dueDate || null,
        tag: tag || null,
        priority: priority || null,
      })
      playSound('open')
      onClose()
    } catch {
      setError('Errore nel salvataggio.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <XPDialog
      title="Modifica task"
      open={open}
      onClose={onClose}
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

      <div style={fieldRow}>
        <label style={labelStyle}>Tag:</label>
        <div style={{ flex: 1 }}>
          <XpSelect
            options={TAGS}
            emptyLabel="— nessun tag —"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
        </div>
      </div>

      <div style={fieldRow}>
        <label style={labelStyle}>Priorità:</label>
        <div style={{ flex: 1 }}>
          <XpSelect
            options={PRIORITIES}
            emptyLabel="— nessuna priorità —"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          />
        </div>
      </div>

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
