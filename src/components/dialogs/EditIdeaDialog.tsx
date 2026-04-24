import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  initialText: string
  onSave: (text: string) => Promise<void>
}

export const EditIdeaDialog = ({ open, onClose, initialText, onSave }: Props) => {
  const [text, setText] = useState(initialText)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setText(initialText)
      setError('')
    }
  }, [open, initialText])

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError("L'idea non può essere vuota."); return }
    if (trimmed.length > 1000) { setError('Massimo 1000 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onSave(trimmed)
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
      title="Modifica idea"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPTextarea
        label="Testo:"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={1000}
        rows={5}
        autoFocus
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{text.length}/1000</div>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
