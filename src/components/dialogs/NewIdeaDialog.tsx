import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea } from '@/components/xp/XPInput'
import { XpSelect } from '@/components/xp/XpSelect'
import { TAGS, PRIORITIES } from '@/constants/taxonomy'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (data: { text: string; tag: string | null; priority: string | null }) => Promise<void>
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

export const NewIdeaDialog = ({ open, onClose, onCreate }: Props) => {
  const [text, setText] = useState('')
  const [tag, setTag] = useState('')
  const [priority, setPriority] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError("Scrivi l'idea!"); return }
    if (trimmed.length > 1000) { setError('Massimo 1000 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onCreate({
        text: trimmed,
        tag: tag || null,
        priority: priority || null,
      })
      playSound('open')
      reset()
      onClose()
    } catch {
      setError("Errore nel salvataggio dell'idea.")
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setText('')
    setTag('')
    setPriority('')
    setError('')
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <XPDialog
      title="Nuova idea"
      open={open}
      onClose={handleClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPTextarea
        label="Idea:"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={1000}
        rows={5}
        autoFocus
        placeholder="Scrivi la tua idea..."
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{text.length}/1000</div>

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

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
