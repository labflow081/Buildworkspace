import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPInput } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  initialName: string
  onSave: (name: string) => Promise<void>
}

export const RenameProjectDialog = ({ open, onClose, initialName, onSave }: Props) => {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError('')
    }
  }, [open, initialName])

  const handleOk = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Il nome non può essere vuoto.'); return }
    if (trimmed.length > 40) { setError('Massimo 40 caratteri.'); return }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleOk()
  }

  return (
    <XPDialog
      title="Rinomina progetto"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okDisabled={loading || !name.trim()}
    >
      <XPInput
        label="Nome progetto:"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={40}
        autoFocus
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{name.length}/40</div>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
