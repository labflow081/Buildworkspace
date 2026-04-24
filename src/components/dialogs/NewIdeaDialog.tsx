import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (text: string) => Promise<void>
}

export const NewIdeaDialog = ({ open, onClose, onCreate }: Props) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError("Scrivi l'idea!"); return }
    if (trimmed.length > 1000) { setError('Massimo 1000 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onCreate(trimmed)
      playSound('open')
      setText('')
      onClose()
    } catch {
      setError("Errore nel salvataggio dell'idea.")
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => { setText(''); setError(''); onClose() }

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
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
